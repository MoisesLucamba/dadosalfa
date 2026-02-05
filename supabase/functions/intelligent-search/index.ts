import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ─────────────────────────────────────────────────────────────────────────
   CORS
   ───────────────────────────────────────────────────────────────────────── */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────── */
interface DBResult {
  title: string;
  description: string;
  type: string;
  source: "database";
  relevance: number;
  date?: string;
  data?: Record<string, unknown>;
}

interface WebResult {
  title: string;
  description: string;
  type: string;
  source: "web";
  url: string;
  relevance: number;
  date?: string;
  siteName?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
   HANDLER
   ───────────────────────────────────────────────────────────────────────── */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* ─── 1. Parse & validate ──────────────────────────────────────── */
    const { 
      query, 
      searchType,
      includeWeb = false, // Desativado por padrão até configurar API key
      maxResults = 20 
    }: { 
      query?: string; 
      searchType?: string;
      includeWeb?: boolean;
      maxResults?: number;
    } = await req.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[petroleum-search] query:", query, "| type:", searchType, "| web:", includeWeb);

    /* ─── 2. Supabase client ────────────────────────────────────── */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ─── 3. Determinar tipo de busca ──────────────────────────── */
    const isAll = !searchType || searchType === "all";

    /* ─── 4. Queries paralelas na database ────────────────────── */
    const [prodRes, priceRes, exportRes, riskRes, alertRes] = await Promise.all([
      // Production data
      isAll || searchType === "production"
        ? supabase
            .from("production_data")
            .select("*")
            .or(`operator.ilike.%${query}%,block.ilike.%${query}%,field.ilike.%${query}%`)
            .order("data_date", { ascending: false })
            .limit(8)
        : { data: null },

      // Price data
      isAll || searchType === "prices"
        ? supabase
            .from("price_data")
            .select("*")
            .ilike("crude_type", `%${query}%`)
            .order("data_date", { ascending: false })
            .limit(8)
        : { data: null },

      // Export data
      isAll || searchType === "exports"
        ? supabase
            .from("export_data")
            .select("*")
            .or(`destination.ilike.%${query}%,tanker_name.ilike.%${query}%`)
            .order("data_date", { ascending: false })
            .limit(8)
        : { data: null },

      // Risk data
      isAll || searchType === "risk"
        ? supabase
            .from("risk_data")
            .select("*")
            .or(`category.ilike.%${query}%,description.ilike.%${query}%`)
            .order("data_date", { ascending: false })
            .limit(8)
        : { data: null },

      // Active risk alerts
      isAll || searchType === "geopolitical" || searchType === "risk"
        ? supabase
            .from("risk_alerts")
            .select("*")
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .eq("is_active", true)
            .limit(8)
        : { data: null },
    ]);

    /* ─── 5. Processar resultados da database ──────────────────── */
    const results: (DBResult | WebResult)[] = [];

    // Production results
    prodRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `${r.operator} – ${r.block}`,
        description: `Produção diária: ${Number(r.daily_production).toLocaleString("pt-PT")} bpd | Campo: ${r.field || "N/A"} | Status: ${r.status || "Ativo"}`,
        type: "production",
        source: "database",
        relevance: 9,
        date: r.data_date as string,
        data: r,
      });
    });

    // Price results
    priceRes?.data?.forEach((r: Record<string, unknown>) => {
      const chg = Number(r.change_percent);
      results.push({
        title: `${r.crude_type} – $${Number(r.price).toFixed(2)}/bbl`,
        description: `Variação: ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}% | Volume: ${Number(r.volume).toLocaleString("pt-PT")} bbl | Data: ${r.data_date}`,
        type: "prices",
        source: "database",
        relevance: 10,
        date: r.data_date as string,
        data: r,
      });
    });

    // Export results
    const statusPT: Record<string, string> = {
      in_transit: "Em Trânsito",
      delivered: "Entregue",
      loading: "Em Carregamento",
    };
    exportRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `Exportação → ${r.destination}`,
        description: `Volume: ${Number(r.volume).toLocaleString("pt-PT")} bbl | Navio: ${r.tanker_name || "N/A"} | Status: ${statusPT[r.status as string] || r.status}`,
        type: "exports",
        source: "database",
        relevance: 8,
        date: r.data_date as string,
        data: r,
      });
    });

    // Risk results
    const trendPT: Record<string, string> = { 
      up: "↑ Em Elevação", 
      down: "↓ Em Redução", 
      stable: "→ Estável" 
    };
    riskRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `Análise de Risco – ${r.category}: Score ${r.score}/100`,
        description: (r.description as string) || `Tendência: ${trendPT[r.trend as string] || "N/A"}`,
        type: "risk",
        source: "database",
        relevance: 9,
        date: r.data_date as string,
        data: r,
      });
    });

    // Risk alerts (alta prioridade)
    alertRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `⚠️ Alerta: ${r.title}`,
        description: `${r.description} | Região: ${r.region || "Global"} | Impacto Estimado: ${r.impact || "N/A"}`,
        type: "geopolitical",
        source: "database",
        relevance: 10,
        data: r,
      });
    });

    /* ─── 6. Web search (OPCIONAL - requer API key) ────────────── */
    if (includeWeb && Deno.env.get("ANTHROPIC_API_KEY")) {
      try {
        const webSearchResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [{
              role: "user",
              content: `Search for current petroleum industry information about: ${query}. Focus on Angola, crude oil prices, production, OPEC data. Provide factual recent sources only.`
            }],
            tools: [{ 
              type: "web_search_20250305", 
              name: "web_search" 
            }]
          })
        });

        if (webSearchResponse.ok) {
          const webData = await webSearchResponse.json();
          
          // Processar resultados web
          if (webData.content) {
            webData.content.forEach((block: any) => {
              if (block.type === "text" && block.text) {
                // Parse informações relevantes do texto
                const sentences = block.text.split(/[.!?]\s+/);
                sentences.forEach((sentence: string) => {
                  if (sentence.length > 40 && (
                    sentence.includes('$') || 
                    sentence.toLowerCase().includes('barrel') ||
                    sentence.toLowerCase().includes('bpd') ||
                    sentence.toLowerCase().includes('opec') ||
                    sentence.toLowerCase().includes('angola')
                  )) {
                    results.push({
                      title: sentence.substring(0, 120),
                      description: sentence.substring(0, 300),
                      type: searchType || "general",
                      source: "web",
                      url: "#",
                      relevance: 6,
                      siteName: "Pesquisa Web",
                    });
                  }
                });
              }
            });
          }
        }
      } catch (webErr) {
        console.error("[web-search-error]", webErr);
        // Continua mesmo se web search falhar
      }
    }

    /* ─── 7. Ordenar e limitar resultados ──────────────────────── */
    results.sort((a, b) => b.relevance - a.relevance);
    const limitedResults = results.slice(0, maxResults);

    console.log("[petroleum-search] total:", results.length, "| returned:", limitedResults.length);

    /* ─── 8. Preparar resposta estruturada ────────────────────── */
    return new Response(
      JSON.stringify({ 
        success: true, 
        results: limitedResults, 
        query, 
        count: limitedResults.length,
        sources: {
          database: results.filter(r => r.source === "database").length,
          web: results.filter(r => r.source === "web").length,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[petroleum-search-error]", err);
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Erro interno no processamento da consulta",
        success: false,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});