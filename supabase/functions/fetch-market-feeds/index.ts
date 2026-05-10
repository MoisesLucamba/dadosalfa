// Free market data ingestion: EIA (official US gov), Yahoo Finance (free), OPEC RSS
// Normalizes to price_data table with explicit `source` and `is_official` flags.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormalizedPrice {
  crude_type: string;
  price: number;
  change_percent: number;
  volume: number;
  data_date: string;
  source: string;
  source_url: string;
  is_official: boolean;
}

// ─── EIA (US Energy Information Administration — official government source)
async function fetchEIA(apiKey: string): Promise<NormalizedPrice[]> {
  const out: NormalizedPrice[] = [];
  // Series: PET.RBRTE.D = Brent (FOB), PET.RWTC.D = WTI Cushing
  const series = [
    { id: "PET.RBRTE.D", crude: "Brent" },
    { id: "PET.RWTC.D", crude: "WTI" },
  ];
  for (const s of series) {
    try {
      const url = `https://api.eia.gov/v2/seriesid/${s.id}?api_key=${apiKey}&length=2&sort[0][column]=period&sort[0][direction]=desc`;
      const r = await fetch(url);
      if (!r.ok) { console.warn(`[EIA] ${s.crude} HTTP ${r.status}`); continue; }
      const json = await r.json();
      const rows = json?.response?.data ?? [];
      if (rows.length === 0) continue;
      const latest = rows[0];
      const prev = rows[1];
      const price = Number(latest.value);
      const prevPrice = prev ? Number(prev.value) : price;
      const change = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
      out.push({
        crude_type: s.crude,
        price,
        change_percent: Number(change.toFixed(2)),
        volume: 0,
        data_date: latest.period,
        source: "EIA (US DOE)",
        source_url: `https://www.eia.gov/dnav/pet/hist/${s.id.replace("PET.", "").replace(".D", "")}D.htm`,
        is_official: true,
      });
    } catch (e) {
      console.error(`[EIA] ${s.crude} error:`, e);
    }
  }
  return out;
}

// ─── Yahoo Finance (free, public quote endpoint)
async function fetchYahoo(): Promise<NormalizedPrice[]> {
  const out: NormalizedPrice[] = [];
  // BZ=F = Brent futures, CL=F = WTI futures
  const symbols = [
    { sym: "BZ=F", crude: "Brent (Futures)" },
    { sym: "CL=F", crude: "WTI (Futures)" },
  ];
  const today = new Date().toISOString().split("T")[0];
  for (const s of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s.sym}?interval=1d&range=2d`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 AlphaData/1.0" } });
      if (!r.ok) { console.warn(`[Yahoo] ${s.crude} HTTP ${r.status}`); continue; }
      const json = await r.json();
      const result = json?.chart?.result?.[0];
      if (!result) continue;
      const meta = result.meta;
      const price = Number(meta.regularMarketPrice);
      const prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? price);
      const change = prev ? ((price - prev) / prev) * 100 : 0;
      out.push({
        crude_type: s.crude,
        price,
        change_percent: Number(change.toFixed(2)),
        volume: Number(meta.regularMarketVolume ?? 0),
        data_date: today,
        source: "Yahoo Finance",
        source_url: `https://finance.yahoo.com/quote/${s.sym}`,
        is_official: false,
      });
    } catch (e) {
      console.error(`[Yahoo] ${s.crude} error:`, e);
    }
  }
  return out;
}

// ─── OPEC Monthly Oil Market Report headlines (RSS)
async function fetchOPECHeadlines(): Promise<{ title: string; link: string; pubDate: string }[]> {
  try {
    // OPEC press releases RSS
    const r = await fetch("https://www.opec.org/opec_web/en/rss/press_releases.xml", {
      headers: { "User-Agent": "Mozilla/5.0 AlphaData/1.0" },
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items: { title: string; link: string; pubDate: string }[] = [];
    const matches = xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g);
    for (const m of matches) {
      const title = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const link = m[2].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      items.push({ title, link, pubDate: m[3].trim() });
      if (items.length >= 10) break;
    }
    return items;
  } catch (e) {
    console.error("[OPEC] error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const eiaKey = Deno.env.get("EIA_API_KEY") ?? "";
    const { action = "fetch" } = await req.json().catch(() => ({}));

    const [eiaPrices, yahooPrices, opecNews] = await Promise.all([
      eiaKey ? fetchEIA(eiaKey) : Promise.resolve([]),
      fetchYahoo(),
      fetchOPECHeadlines(),
    ]);

    const allPrices = [...eiaPrices, ...yahooPrices];
    let synced = 0;

    if (action === "sync" && allPrices.length > 0) {
      for (const p of allPrices) {
        const { data: existing } = await supabase
          .from("price_data")
          .select("id")
          .eq("crude_type", p.crude_type)
          .eq("data_date", p.data_date)
          .maybeSingle();

        if (existing) {
          await supabase.from("price_data").update({
            price: p.price,
            change_percent: p.change_percent,
            volume: p.volume,
            source: p.source,
            source_url: p.source_url,
            is_official: p.is_official,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await supabase.from("price_data").insert(p);
        }
        synced++;
      }
      await supabase.from("data_updates").insert({
        data_type: "market_feeds",
        source: `EIA(${eiaPrices.length}) + Yahoo(${yahooPrices.length}) + OPEC(${opecNews.length})`,
        records_updated: synced,
        notes: "Free public sources — EIA official, Yahoo+OPEC unofficial",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        prices: allPrices,
        opec_headlines: opecNews,
        synced,
        action,
        sources: {
          eia: { count: eiaPrices.length, official: true, url: "https://www.eia.gov" },
          yahoo: { count: yahooPrices.length, official: false, url: "https://finance.yahoo.com" },
          opec: { count: opecNews.length, official: true, url: "https://www.opec.org" },
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[fetch-market-feeds] error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
