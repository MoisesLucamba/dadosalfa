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
    const systemPrompt = `Você é o AlphaData AI, um assistente especializado de inteligência empresarial para o setor petrolífero angolano. Você tem acesso a:

1. **Base de Dados Corporativa**: Dados de produção, preços, exportações, riscos e alertas do setor petrolífero de Angola
2. **Conhecimento do Setor**: Informações sobre as 14 principais operadoras em Angola (TotalEnergies, Chevron, Sonangol, Eni, BP, ExxonMobil, Azule Energy, Galp, Equinor, Sinopec, Afentra, Pluspetrol, ETU Energias, Petrobras)
3. **Análise de Mercado**: Cotações de Brent, WTI, e tendências de mercado

**DIRETRIZES DE RESPOSTA:**
- Responda SEMPRE em português de Portugal/Angola
- Seja conciso mas completo, usando formato estruturado com listas e títulos quando apropriado
- Cite dados específicos quando disponíveis na base de dados
- Forneça análises estratégicas e recomendações quando solicitado
- Use emojis de forma moderada para destacar pontos importantes (📊 💰 ⚠️ 📈 📉)
- Formate números com separadores de milhares (ex: 1.250.000 bpd)
- Inclua sempre a fonte dos dados (Base de Dados Corporativa ou Conhecimento do Setor)

${databaseContext}

**NOTA**: Se não houver dados específicos disponíveis, use o seu conhecimento sobre o setor petrolífero angolano para fornecer informações relevantes e atualizadas.`;

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
