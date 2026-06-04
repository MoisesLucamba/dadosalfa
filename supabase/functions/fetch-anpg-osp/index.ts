// Scrapes ANPG (production reports) and Sonangol (Official Selling Prices) using Firecrawl.
// Requires the Firecrawl connector to be linked (FIRECRAWL_API_KEY env var).
// Falls back gracefully if not configured.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FC = "https://api.firecrawl.dev/v2";

async function fcScrape(url: string, apiKey: string, prompt: string, schema: any) {
  const r = await fetch(`${FC}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: [{ type: "json", prompt, schema }],
      onlyMainContent: true,
    }),
  });
  if (!r.ok) throw new Error(`Firecrawl ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return await r.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const FIRECRAWL = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL) {
    return new Response(JSON.stringify({
      success: false,
      error: "FIRECRAWL_API_KEY não configurado.",
      hint: "Ligue o conector Firecrawl em Connectors para ativar scraping de ANPG e Sonangol.",
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const out: Record<string, any> = {};

  // ── ANPG production page ──
  try {
    const anpgUrl = "https://anpg.co.ao/exploracao-producao/producao-de-petroleo";
    const res = await fcScrape(anpgUrl, FIRECRAWL,
      "Extrai produção mensal de petróleo de Angola: para cada bloco/operador listado, devolve nome do operador, bloco, mês de referência (YYYY-MM) e produção em barris/dia (bpd).",
      {
        type: "object",
        properties: {
          period: { type: "string", description: "YYYY-MM" },
          operators: {
            type: "array",
            items: {
              type: "object",
              properties: {
                operator: { type: "string" },
                block: { type: "string" },
                daily_bpd: { type: "number" },
              },
              required: ["operator", "block", "daily_bpd"],
            },
          },
        },
        required: ["period", "operators"],
      });

    const j = res?.data?.json ?? res?.json;
    if (j?.operators?.length) {
      const dataDate = `${j.period}-15`;
      const rows = j.operators
        .filter((o: any) => o.daily_bpd > 0)
        .map((o: any) => ({
          operator: o.operator,
          block: o.block,
          field: o.block,
          daily_production: o.daily_bpd,
          monthly_production: o.daily_bpd * 30,
          decline_rate: 0,
          status: "ativo",
          data_date: dataDate,
        }));
      // Delete then insert for that period
      await supabase.from("production_data").delete()
        .eq("data_date", dataDate)
        .neq("operator", "Angola Total (EIA)");
      const { error } = await supabase.from("production_data").insert(rows);
      out.anpg = { period: j.period, inserted: rows.length, error: error?.message };
    } else {
      out.anpg = { error: "Sem dados extraídos da página ANPG." };
    }
  } catch (e) {
    out.anpg = { error: String(e) };
  }

  // ── Sonangol OSP page (Official Selling Prices) ──
  try {
    const sonUrl = "https://www.sonangol.co.ao/Lists/PreosOficiaisDeVenda/AllItems.aspx";
    const res = await fcScrape(sonUrl, FIRECRAWL,
      "Extrai os Preços Oficiais de Venda (OSP) mais recentes dos crudes angolanos: para cada crude (Cabinda, Girassol, Dalia, Nemba, Plutonio, Pazflor, etc.), devolve nome do crude, mês de referência (YYYY-MM) e preço em USD/barril.",
      {
        type: "object",
        properties: {
          period: { type: "string" },
          crudes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                crude: { type: "string" },
                price_usd: { type: "number" },
              },
              required: ["crude", "price_usd"],
            },
          },
        },
        required: ["period", "crudes"],
      });

    const j = res?.data?.json ?? res?.json;
    if (j?.crudes?.length) {
      const dataDate = `${j.period}-15`;
      const rows = j.crudes
        .filter((c: any) => c.price_usd > 0)
        .map((c: any) => ({
          crude_type: c.crude,
          data_date: dataDate,
          price: c.price_usd,
          change_percent: 0,
          volume: 0,
          source: "Sonangol OSP (oficial)",
          source_url: sonUrl,
          is_official: true,
        }));
      const { error } = await supabase.from("price_data").upsert(rows, {
        onConflict: "crude_type,data_date", ignoreDuplicates: false,
      });
      out.sonangol = { period: j.period, inserted: rows.length, error: error?.message };
    } else {
      out.sonangol = { error: "Sem OSP extraídos." };
    }
  } catch (e) {
    out.sonangol = { error: String(e) };
  }

  return new Response(JSON.stringify({ success: true, results: out }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
