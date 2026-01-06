import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("Starting full data sync...");

    const results = {
      prices: { success: false, error: null as string | null },
      production: { success: false, error: null as string | null },
      exports: { success: false, error: null as string | null },
      risks: { success: false, error: null as string | null }
    };

    // Sync oil prices
    try {
      const priceResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-oil-prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action: "sync" })
      });
      if (priceResponse.ok) {
        results.prices.success = true;
        console.log("Oil prices synced successfully");
      } else {
        results.prices.error = await priceResponse.text();
      }
    } catch (e) {
      results.prices.error = e instanceof Error ? e.message : "Unknown error";
    }

    // Sync production data
    try {
      const prodResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-production-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action: "sync" })
      });
      if (prodResponse.ok) {
        results.production.success = true;
        console.log("Production data synced successfully");
      } else {
        results.production.error = await prodResponse.text();
      }
    } catch (e) {
      results.production.error = e instanceof Error ? e.message : "Unknown error";
    }

    // Sync export data
    try {
      const exportResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-export-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action: "sync" })
      });
      if (exportResponse.ok) {
        results.exports.success = true;
        console.log("Export data synced successfully");
      } else {
        results.exports.error = await exportResponse.text();
      }
    } catch (e) {
      results.exports.error = e instanceof Error ? e.message : "Unknown error";
    }

    // Sync risk data
    try {
      const riskResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-risk-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action: "sync" })
      });
      if (riskResponse.ok) {
        results.risks.success = true;
        console.log("Risk data synced successfully");
      } else {
        results.risks.error = await riskResponse.text();
      }
    } catch (e) {
      results.risks.error = e instanceof Error ? e.message : "Unknown error";
    }

    const allSuccess = Object.values(results).every(r => r.success);
    
    console.log("Full sync completed:", results);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        status: allSuccess ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error during full sync:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
