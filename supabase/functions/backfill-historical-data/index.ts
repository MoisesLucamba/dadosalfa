// Backfills ~3 years of historical Brent (Stooq, free) and Angola production (EIA monthly).
// Idempotent: uses upsert on (crude_type, data_date) and (operator, block, data_date).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Record<string, any> = {};
  const EIA_API_KEY = Deno.env.get("EIA_API_KEY");

  // ── 1. BRENT 3y daily from EIA (PET.RBRTE.D — official spot price) ──
  if (EIA_API_KEY) {
    try {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 3);
      const startStr = start.toISOString().slice(0, 10);
      const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RBRTE&start=${startStr}&offset=0&length=5000&sort[0][column]=period&sort[0][direction]=asc`;
      const json = await fetch(url).then(r => r.json());
      const series = json?.response?.data ?? [];

      const rows = series
        .map((d: any) => ({
          crude_type: "Brent",
          data_date: d.period,
          price: Number(d.value),
          change_percent: 0,
          volume: 0,
          source: "EIA RBRTE (historical backfill)",
          source_url: "https://www.eia.gov/dnav/pet/hist/RBRTED.htm",
          is_official: true,
        }))
        .filter((r: any) => isFinite(r.price) && r.price > 0);

      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("price_data")
          .upsert(batch, { onConflict: "crude_type,data_date", ignoreDuplicates: false });
        if (error) { results.brent_error = error.message; break; }
        inserted += batch.length;
      }
      results.brent = { rows: rows.length, inserted, oldest: rows[0]?.data_date, newest: rows.at(-1)?.data_date };
    } catch (e) {
      results.brent_error = String(e);
    }
  } else {
    results.brent_error = "EIA_API_KEY not configured";
  }

  // ── 2. ANGOLA CRUDE PRODUCTION from EIA (monthly, 3y) ──
  if (EIA_API_KEY) {
    try {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 3);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      // INTL.57-1-AGO-TBPD.M = Angola crude+condensate, thousand barrels/day, monthly
      const url = `https://api.eia.gov/v2/international/data/?api_key=${EIA_API_KEY}&frequency=monthly&data[0]=value&facets[productId][]=57&facets[activityId][]=1&facets[countryRegionId][]=AGO&facets[unit][]=TBPD&start=${startStr}&offset=0&length=5000`;
      const json = await fetch(url).then(r => r.json());
      const series = json?.response?.data ?? [];

      // EIA series gives total Angola — distribute to a single virtual operator for history.
      // Real per-operator data requires ANPG; we keep this as 'Angola Total' marker.
      const rows = series.map((d: any) => {
        const kbpd = Number(d.value);
        const monthDate = `${d.period}-15`; // mid-month
        return {
          operator: "Angola Total (EIA)",
          block: "ALL",
          field: "ALL",
          daily_production: kbpd * 1000,
          monthly_production: kbpd * 1000 * 30,
          decline_rate: 0,
          status: "ativo",
          data_date: monthDate,
        };
      }).filter((r: any) => isFinite(r.daily_production) && r.daily_production > 0);

      // Upsert per row (no unique constraint guaranteed; delete-then-insert for safety)
      // Strategy: delete the synthetic operator's rows in the range, then insert fresh.
      const oldest = rows.at(0)?.data_date;
      const newest = rows.at(-1)?.data_date;
      if (oldest && newest) {
        await supabase
          .from("production_data")
          .delete()
          .eq("operator", "Angola Total (EIA)")
          .gte("data_date", oldest)
          .lte("data_date", newest);
        const { error } = await supabase.from("production_data").insert(rows);
        if (error) results.production_error = error.message;
      }
      results.production = { rows: rows.length, oldest, newest };
    } catch (e) {
      results.production_error = String(e);
    }
  } else {
    results.production_error = "EIA_API_KEY not configured";
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
