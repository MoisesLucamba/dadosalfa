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
   FONTES ESPECIALIZADAS DO SECTOR PETROLÍFERO
   ───────────────────────────────────────────────────────────────────────── */
const PETROLEUM_SOURCES = [
  // Preços e mercados
  "site:oilprice.com",
  "site:investing.com/commodities/crude-oil",
  "site:bloomberg.com/energy",
  "site:reuters.com/markets/commodities",
  "site:spglobal.com/platts",
  
  // Angola específico
  "site:macauhub.com.mo Angola oil",
  "site:clubofmozambique.com Angola petroleum",
  "site:angolanembassy.org",
  
  // Organizações oficiais
  "site:opec.org",
  "site:iea.org",
  "site:eia.gov",
  
  // Operadoras
  "site:totalenergies.com Angola",
  "site:exxonmobil.com Angola",
  "site:bp.com Angola",
  "site:chevron.com Angola",
  "site:eni.com Angola",
];

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
      includeWeb = true,
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

    console.log("[petroleum-search-enhanced] query:", query, "| type:", searchType, "| web:", includeWeb);

    /* ─── 2. Supabase client ────────────────────────────────────── */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ─── 3. Busca PARALELA: Database + Web ────────────────────── */
    const isAll = !searchType || searchType === "all";

    const searchPromises: Promise<any>[] = [];

    // 3A. Database queries (original)
    searchPromises.push(
      Promise.all([
        isAll || searchType === "production"
          ? supabase
              .from("production_data")
              .select("*")
              .or(`operator.ilike.%${query}%,block.ilike.%${query}%,field.ilike.%${query}%`)
              .order("data_date", { ascending: false })
              .limit(8)
          : { data: null },

        isAll || searchType === "prices"
          ? supabase
              .from("price_data")
              .select("*")
              .ilike("crude_type", `%${query}%`)
              .order("data_date", { ascending: false })
              .limit(8)
          : { data: null },

        isAll || searchType === "exports"
          ? supabase
              .from("export_data")
              .select("*")
              .or(`destination.ilike.%${query}%,tanker_name.ilike.%${query}%`)
              .order("data_date", { ascending: false })
              .limit(8)
          : { data: null },

        isAll || searchType === "risk"
          ? supabase
              .from("risk_data")
              .select("*")
              .or(`category.ilike.%${query}%,description.ilike.%${query}%`)
              .order("data_date", { ascending: false })
              .limit(8)
          : { data: null },

        isAll || searchType === "geopolitical" || searchType === "risk"
          ? supabase
              .from("risk_alerts")
              .select("*")
              .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
              .eq("is_active", true)
              .limit(8)
          : { data: null },
      ])
    );

    // 3B. Web search (NOVO - usando múltiplas queries especializadas)
    if (includeWeb) {
      // Query base
      searchPromises.push(
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{
              role: "user",
              content: `Search for current petroleum industry data: ${query}. Focus on: Angola, OPEC, crude oil prices, production data, exports. Return recent reliable sources.`
            }],
            tools: [{ type: "web_search_20250305", name: "web_search" }]
          })
        }).then(r => r.json()).catch(err => {
          console.error("[web-search-error]", err);
          return null;
        })
      );

      // Se for sobre Angola, faz query específica adicional
      if (query.toLowerCase().includes("angola") || isAll) {
        searchPromises.push(
          fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              messages: [{
                role: "user",
                content: `Latest Angola petroleum news: production, exports, TotalEnergies, ExxonMobil, Sonangol. Recent developments 2025-2026.`
              }],
              tools: [{ type: "web_search_20250305", name: "web_search" }]
            })
          }).then(r => r.json()).catch(() => null)
        );
      }

      // Query para preços se relevante
      if (searchType === "prices" || isAll || query.toLowerCase().includes("preço") || query.toLowerCase().includes("brent") || query.toLowerCase().includes("wti")) {
        searchPromises.push(
          fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              messages: [{
                role: "user",
                content: `Current crude oil prices: Brent, WTI, Angolan grades (Cabinda, Girassol, Dalia). Latest today 2026.`
              }],
              tools: [{ type: "web_search_20250305", name: "web_search" }]
            })
          }).then(r => r.json()).catch(() => null)
        );
      }
    }

    /* ─── 4. Aguardar todos os resultados ──────────────────────── */
    const allResults = await Promise.all(searchPromises);
    
    const [dbResults, ...webSearchResults] = allResults;
    const [prodRes, priceRes, exportRes, riskRes, alertRes] = dbResults;

    /* ─── 5. Map database results ──────────────────────────────── */
    const results: (DBResult | WebResult)[] = [];

    /* production */
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

    /* prices */
    priceRes?.data?.forEach((r: Record<string, unknown>) => {
      const chg = Number(r.change_percent);
      results.push({
        title: `${r.crude_type} – $${Number(r.price).toFixed(2)}/bbl`,
        description: `Variação: ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}% | Volume: ${Number(r.volume).toLocaleString("pt-PT")} bbl`,
        type: "prices",
        source: "database",
        relevance: 9,
        date: r.data_date as string,
        data: r,
      });
    });

    /* exports */
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
        relevance: 9,
        date: r.data_date as string,
        data: r,
      });
    });

    /* risks */
    const trendPT: Record<string, string> = { 
      up: "↑ Subindo", 
      down: "↓ Descendo", 
      stable: "→ Estável" 
    };
    riskRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `Risco – ${r.category}: Score ${r.score}/100`,
        description: (r.description as string) || `Tendência: ${trendPT[r.trend as string] || "N/A"}`,
        type: "risk",
        source: "database",
        relevance: 9,
        date: r.data_date as string,
        data: r,
      });
    });

    /* risk alerts */
    alertRes?.data?.forEach((r: Record<string, unknown>) => {
      results.push({
        title: `⚠️ ${r.title}`,
        description: `${r.description} | Região: ${r.region || "Global"} | Impacto: ${r.impact || "N/A"}`,
        type: "geopolitical",
        source: "database",
        relevance: 10,
        data: r,
      });
    });

    /* ─── 6. Process web search results ────────────────────────── */
    if (includeWeb && webSearchResults) {
      webSearchResults.forEach((webData) => {
        if (!webData || !webData.content) return;

        // Extrair resultados de pesquisa do Claude
        webData.content.forEach((block: any) => {
          if (block.type === "text" && block.text) {
            // Parse básico de citações e resultados
            const lines = block.text.split('\n');
            lines.forEach((line: string) => {
              // Detectar se contém informação relevante
              if (line.length > 50 && (
                line.includes('$') || 
                line.includes('bpd') || 
                line.includes('barrel') ||
                line.includes('OPEC') ||
                line.includes('Angola') ||
                line.toLowerCase().includes('crude')
              )) {
                results.push({
                  title: line.substring(0, 100),
                  description: line.substring(0, 300),
                  type: searchType || "general",
                  source: "web",
                  url: "https://search-result",
                  relevance: 7,
                  siteName: "Web Search",
                });
              }
            });
          }
        });
      });
    }

    /* ─── 7. Sort & limit results ──────────────────────────────── */
    results.sort((a, b) => b.relevance - a.relevance);
    const limitedResults = results.slice(0, maxResults);

    console.log("[petroleum-search-enhanced] total:", results.length, "| returned:", limitedResults.length);

    /* ─── 8. Response ──────────────────────────────────────────── */
    return new Response(
      JSON.stringify({ 
        success: true, 
        results: limitedResults, 
        query, 
        count: limitedResults.length,
        sources: {
          database: results.filter(r => r.source === "database").length,
          web: results.filter(r => r.source === "web").length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[petroleum-search-enhanced]", err);
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Erro interno",
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});