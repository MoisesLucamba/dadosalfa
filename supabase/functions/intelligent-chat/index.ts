import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { messages, includeDatabase = true, includeWeb = true } = await req.json();
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";
    
    console.log("[intelligent-chat] Query:", lastUserMessage);

    // ═══════════════════════════════════════════════════════════════
    // 1. BUSCAR DADOS DA BASE DE DADOS
    // ═══════════════════════════════════════════════════════════════
    let databaseContext = "";
    
    if (includeDatabase) {
      const queryLower = lastUserMessage.toLowerCase();
      
      // Buscar dados relevantes em paralelo
      const [prodRes, priceRes, exportRes, riskRes, alertRes, countryRiskRes] = await Promise.all([
        // Production data
        queryLower.includes("produção") || queryLower.includes("production") || queryLower.includes("bloco") || queryLower.includes("operador")
          ? supabase.from("production_data").select("*").order("data_date", { ascending: false }).limit(10)
          : Promise.resolve({ data: null }),
        
        // Price data
        queryLower.includes("preço") || queryLower.includes("price") || queryLower.includes("brent") || queryLower.includes("wti") || queryLower.includes("cotação")
          ? supabase.from("price_data").select("*").order("data_date", { ascending: false }).limit(10)
          : Promise.resolve({ data: null }),
        
        // Export data
        queryLower.includes("export") || queryLower.includes("logística") || queryLower.includes("navio") || queryLower.includes("destino")
          ? supabase.from("export_data").select("*").order("data_date", { ascending: false }).limit(10)
          : Promise.resolve({ data: null }),
        
        // Risk data
        queryLower.includes("risco") || queryLower.includes("risk") || queryLower.includes("score")
          ? supabase.from("risk_data").select("*").order("data_date", { ascending: false }).limit(10)
          : Promise.resolve({ data: null }),
        
        // Risk alerts
        queryLower.includes("alert") || queryLower.includes("geopolít") || queryLower.includes("tensão")
          ? supabase.from("risk_alerts").select("*").eq("is_active", true).limit(10)
          : Promise.resolve({ data: null }),
        
        // Country risk
        queryLower.includes("país") || queryLower.includes("country") || queryLower.includes("angola")
          ? supabase.from("country_risk").select("*").order("data_date", { ascending: false }).limit(5)
          : Promise.resolve({ data: null }),
      ]);

      // Compilar contexto da base de dados
      const dbSections: string[] = [];
      
      if (prodRes.data?.length) {
        dbSections.push(`**Dados de Produção (${prodRes.data.length} registos):**\n${prodRes.data.map((p: any) => 
          `- ${p.operator} (${p.block}): ${p.daily_production?.toLocaleString()} bpd | Campo: ${p.field || "N/A"}`
        ).join("\n")}`);
      }
      
      if (priceRes.data?.length) {
        dbSections.push(`**Cotações de Preços (${priceRes.data.length} registos):**\n${priceRes.data.map((p: any) => 
          `- ${p.crude_type}: $${p.price?.toFixed(2)}/bbl | Variação: ${p.change_percent >= 0 ? "+" : ""}${p.change_percent?.toFixed(2)}%`
        ).join("\n")}`);
      }
      
      if (exportRes.data?.length) {
        dbSections.push(`**Dados de Exportação (${exportRes.data.length} registos):**\n${exportRes.data.map((e: any) => 
          `- Destino: ${e.destination} | Volume: ${e.volume?.toLocaleString()} bbl | Navio: ${e.tanker_name || "N/A"}`
        ).join("\n")}`);
      }
      
      if (riskRes.data?.length) {
        dbSections.push(`**Análise de Riscos (${riskRes.data.length} registos):**\n${riskRes.data.map((r: any) => 
          `- ${r.category}: Score ${r.score}/100 | Tendência: ${r.trend || "N/A"}`
        ).join("\n")}`);
      }
      
      if (alertRes.data?.length) {
        dbSections.push(`**Alertas Ativos (${alertRes.data.length} alertas):**\n${alertRes.data.map((a: any) => 
          `- ⚠️ ${a.title}: ${a.description?.substring(0, 100)}...`
        ).join("\n")}`);
      }
      
      if (countryRiskRes.data?.length) {
        dbSections.push(`**Risco País (${countryRiskRes.data.length} registos):**\n${countryRiskRes.data.map((c: any) => 
          `- ${c.country}: Score ${c.score}/100 | Tendência: ${c.trend || "N/A"}`
        ).join("\n")}`);
      }
      
      if (dbSections.length > 0) {
        databaseContext = `\n\n═══ DADOS DA BASE DE DADOS CORPORATIVA ═══\n${dbSections.join("\n\n")}`;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. CONSTRUIR SYSTEM PROMPT ESPECIALIZADO
    // ═══════════════════════════════════════════════════════════════
    const systemPrompt = `You are AlphaData AI Analyst, an expert petroleum engineer and energy market analyst specializing in Angola and the South Atlantic Basin. You have deep knowledge of:

- Reservoir engineering (IPR, BHP, GOR, W-Cut, skin factor, PI, decline curves)
- Angola-specific blocks (0, 15, 17, 18, 31, 32) and their geology
- Operators (TotalEnergies, BP, ExxonMobil, Chevron, ENI Angola, Sonangol, Azule Energy, Galp, Equinor)
- ANPG regulatory framework and Lei 10/04
- Crude grades (Cabinda, Girassol, Dalia, Pazflor, Nemba, Kissanje)
- Export logistics and FPSO operations
- Brent/WTI correlation and African crude differentials
- IEA/OPEC production quotas and Angola's post-OPEC strategy

RESPONSE RULES:
1. ALWAYS respond in European Portuguese (Portugal/Angola).
2. ALWAYS use correct petroleum engineering units: bbl/d, MMscf/d, bar, °C, m MD/TVD.
3. ALWAYS include specific numbers. Never give vague answers like "production is high" — say "produção de 312.450 bbl/d em Fevereiro 2026".
4. STRUCTURE every response with:
   - 1-sentence executive summary (**bold**)
   - Technical data section with a mini-table or bullet list of key metrics
   - Analysis paragraph (2-3 sentences)
   - 1 forward-looking statement or risk note
5. FORMAT numbers always as:
   - Large numbers: X.XXX.XXX (dot separator, European format)
   - Percentages: XX,X%
   - Prices: $XX.XX/bbl
   - Depth: X.XXXm MD / X.XXXm TVD
   - Dates: MMM YYYY (ex: Jan 2026)
6. USE technical terminology naturally:
   Instead of "poço de petróleo" → "poço produtor"
   Instead of "o petróleo flui" → "influxo de fluido"
   Instead of "água no petróleo" → "water cut"
   Instead of "pressão do poço" → "BHP" or "pressão de fundo"
   Instead of "a abrandar" → "exibindo declínio hiperbólico"
   Instead of "risco" → specify type: "risco geopolítico", "risco regulatório", "risco de reservatório", "risco de preço"
7. WHEN mentioning a block or well, always include:
   - Operator name
   - Current production figure
   - Basin name
   - One technical characteristic
8. DATA TABLES in responses: When presenting comparative data, always format as a markdown table with columns like | Bloco | Operadora | Prod. (bbl/d) | API | Status |.
9. CONFIDENCE INDICATORS: End each factual statement with one of:
   - [Alta confiança] — verified data
   - [Estimativa] — calculated/modeled
   - [Projecção] — forecast data
10. Use emojis moderately to highlight key points (📊 💰 ⚠️ 📈 📉).
11. Cite data sources (Base de Dados Corporativa or Conhecimento do Setor).

${databaseContext}

**NOTA**: Se não houver dados específicos disponíveis, use o conhecimento especializado sobre o setor petrolífero angolano para fornecer informações técnicas relevantes e actualizadas.`;

    // ═══════════════════════════════════════════════════════════════
    // 3. CHAMAR LOVABLE AI (STREAMING)
    // ═══════════════════════════════════════════════════════════════
    console.log("[intelligent-chat] Calling Lovable AI with database context:", databaseContext.length > 0);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[intelligent-chat] AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Por favor, aguarde alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione fundos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    // Retornar stream diretamente
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[intelligent-chat] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
