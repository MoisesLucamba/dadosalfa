import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// EIA API series IDs for oil prices
const EIA_SERIES = {
  brent: "PET.RBRTE.D", // Brent crude daily
  wti: "PET.RWTC.D",    // WTI crude daily
};

// Angolan crude differentials (typical premium/discount to Brent in USD)
const ANGOLAN_DIFFERENTIALS = {
  "Cabinda": -0.50,
  "Girassol": 0.20,
  "Dalia": -0.30,
  "Nemba": -0.40,
  "Plutonio": 0.15,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EIA_API_KEY = Deno.env.get("EIA_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching real oil prices from EIA API...");

    let brentPrice: number | null = null;
    let wtiPrice: number | null = null;
    let dataDate: string | null = null;
    let source = "EIA (U.S. Energy Information Administration)";

    if (EIA_API_KEY) {
      // Fetch Brent crude price from EIA API v2
      try {
        const brentUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        
        console.log("Fetching Brent price from EIA...");
        const brentResponse = await fetch(brentUrl);
        
        if (brentResponse.ok) {
          const brentData = await brentResponse.json();
          console.log("EIA Brent response:", JSON.stringify(brentData).substring(0, 500));
          
          if (brentData.response?.data?.length > 0) {
            const latestBrent = brentData.response.data[0];
            brentPrice = parseFloat(latestBrent.value);
            dataDate = latestBrent.period;
            console.log(`Brent price from EIA: $${brentPrice} on ${dataDate}`);
          }
        } else {
          console.error("EIA Brent fetch failed:", brentResponse.status);
        }

        // Fetch WTI crude price
        const wtiUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        
        const wtiResponse = await fetch(wtiUrl);
        if (wtiResponse.ok) {
          const wtiData = await wtiResponse.json();
          if (wtiData.response?.data?.length > 0) {
            wtiPrice = parseFloat(wtiData.response.data[0].value);
            console.log(`WTI price from EIA: $${wtiPrice}`);
          }
        }
      } catch (eiaError) {
        console.error("EIA API error:", eiaError);
      }
    }

    // If EIA failed, try FRED (Federal Reserve Economic Data) as backup - free API
    if (!brentPrice) {
      console.log("EIA unavailable, trying FRED backup...");
      try {
        // FRED Brent crude: DCOILBRENTEU
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DCOILBRENTEU&api_key=DEMO_KEY&file_type=json&sort_order=desc&limit=5`;
        
        const fredResponse = await fetch(fredUrl);
        if (fredResponse.ok) {
          const fredData = await fredResponse.json();
          if (fredData.observations?.length > 0) {
            // Find the first non-null value
            for (const obs of fredData.observations) {
              if (obs.value !== ".") {
                brentPrice = parseFloat(obs.value);
                dataDate = obs.date;
                source = "FRED (Federal Reserve Economic Data)";
                console.log(`Brent price from FRED: $${brentPrice} on ${dataDate}`);
                break;
              }
            }
          }
        }
      } catch (fredError) {
        console.error("FRED API error:", fredError);
      }
    }

    // Final fallback: use database cached value with warning
    if (!brentPrice) {
      console.log("Using cached database values...");
      const { data: cachedPrices } = await supabase
        .from("price_data")
        .select("*")
        .eq("crude_type", "Brent")
        .order("data_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedPrices) {
        brentPrice = cachedPrices.price;
        dataDate = cachedPrices.data_date;
        source = "Cached data (API unavailable)";
        console.log(`Using cached Brent price: $${brentPrice}`);
      } else {
        throw new Error("No price data available from any source");
      }
    }

    // Calculate Angolan crude prices based on Brent + differentials
    const prices = [
      { 
        crude_type: "Brent", 
        price: brentPrice!, 
        change_percent: 0, // Will calculate from DB
        source: source
      },
      ...Object.entries(ANGOLAN_DIFFERENTIALS).map(([crude, differential]) => ({
        crude_type: crude,
        price: Math.round((brentPrice! + differential) * 100) / 100,
        change_percent: 0,
        source: `Calculated from Brent + differential (${differential >= 0 ? '+' : ''}${differential})`
      }))
    ];

    // Calculate change percentages from previous day in DB
    for (const price of prices) {
      const { data: previousPrice } = await supabase
        .from("price_data")
        .select("price")
        .eq("crude_type", price.crude_type)
        .neq("data_date", dataDate)
        .order("data_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousPrice) {
        price.change_percent = Math.round(((price.price - previousPrice.price) / previousPrice.price) * 10000) / 100;
      }
    }

    console.log("Final prices:", prices);

    // Check if we should update the database
    const { action } = await req.json().catch(() => ({ action: "fetch" }));

    if (action === "sync") {
      const today = dataDate || new Date().toISOString().split("T")[0];
      
      for (const price of prices) {
        const { data: existing } = await supabase
          .from("price_data")
          .select("id")
          .eq("crude_type", price.crude_type)
          .eq("data_date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("price_data")
            .update({
              price: price.price,
              change_percent: price.change_percent,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("price_data")
            .insert({
              crude_type: price.crude_type,
              price: price.price,
              change_percent: price.change_percent,
              data_date: today
            });
        }
      }

      await supabase.from("data_updates").insert({
        data_type: "price",
        source: source,
        records_updated: prices.length,
        notes: `Data from ${dataDate}. Primary source: EIA API`
      });

      console.log("Prices synced to database");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          prices,
          last_updated: dataDate,
          source: source,
          api_status: EIA_API_KEY ? "EIA API configured" : "Using fallback sources"
        },
        synced: action === "sync"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching oil prices:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
