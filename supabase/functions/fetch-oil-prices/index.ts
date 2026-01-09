import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const OIL_PRICE_API_KEY = Deno.env.get("OIL_PRICE_API_KEY");
    const EIA_API_KEY = Deno.env.get("EIA_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching real oil prices...");

    let brentPrice: number | null = null;
    let wtiPrice: number | null = null;
    let dataDate: string | null = null;
    let source = "";

    // PRIMARY SOURCE: Oil Price API (oilpriceapi.com) - Real-time data
    if (OIL_PRICE_API_KEY) {
      console.log("Trying Oil Price API (primary source)...");
      try {
        const oilPriceUrl = `https://api.oilpriceapi.com/v1/prices/latest`;
        
        const oilPriceResponse = await fetch(oilPriceUrl, {
          headers: {
            "Authorization": `Token ${OIL_PRICE_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        if (oilPriceResponse.ok) {
          const oilPriceData = await oilPriceResponse.json();
          console.log("Oil Price API response:", JSON.stringify(oilPriceData).substring(0, 500));
          
          if (oilPriceData.status === "success" && oilPriceData.data) {
            brentPrice = oilPriceData.data.price;
            dataDate = new Date(oilPriceData.data.created_at).toISOString().split("T")[0];
            source = "Oil Price API (Real-time)";
            console.log(`Brent price from Oil Price API: $${brentPrice} on ${dataDate}`);
          }
        } else {
          const errorText = await oilPriceResponse.text();
          console.error("Oil Price API error:", oilPriceResponse.status, errorText);
        }
      } catch (oilPriceError) {
        console.error("Oil Price API error:", oilPriceError);
      }
    }

    // SECONDARY SOURCE: EIA API (U.S. Energy Information Administration)
    if (!brentPrice && EIA_API_KEY) {
      console.log("Trying EIA API (secondary source)...");
      try {
        const brentUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        
        const brentResponse = await fetch(brentUrl);
        
        if (brentResponse.ok) {
          const brentData = await brentResponse.json();
          console.log("EIA Brent response:", JSON.stringify(brentData).substring(0, 500));
          
          if (brentData.response?.data?.length > 0) {
            const latestBrent = brentData.response.data[0];
            brentPrice = parseFloat(latestBrent.value);
            dataDate = latestBrent.period;
            source = "EIA (U.S. Energy Information Administration)";
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

    // TERTIARY SOURCE: FRED (Federal Reserve Economic Data) - Free API
    if (!brentPrice) {
      console.log("Trying FRED API (tertiary source)...");
      try {
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DCOILBRENTEU&api_key=DEMO_KEY&file_type=json&sort_order=desc&limit=5`;
        
        const fredResponse = await fetch(fredUrl);
        if (fredResponse.ok) {
          const fredData = await fredResponse.json();
          if (fredData.observations?.length > 0) {
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

    // FINAL FALLBACK: Use cached database value
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
        source = "Cached data (APIs unavailable)";
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
        change_percent: 0,
        source: source
      },
      ...Object.entries(ANGOLAN_DIFFERENTIALS).map(([crude, differential]) => ({
        crude_type: crude,
        price: Math.round((brentPrice! + differential) * 100) / 100,
        change_percent: 0,
        source: `Calculated from Brent + differential (${differential >= 0 ? '+' : ''}${differential})`
      }))
    ];

    // Add WTI if available
    if (wtiPrice) {
      prices.push({
        crude_type: "WTI",
        price: wtiPrice,
        change_percent: 0,
        source: "EIA (U.S. Energy Information Administration)"
      });
    }

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
        notes: `Data from ${dataDate}. Sources hierarchy: Oil Price API → EIA → FRED`
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
          api_status: {
            oil_price_api: OIL_PRICE_API_KEY ? "configured" : "not configured",
            eia_api: EIA_API_KEY ? "configured" : "not configured"
          }
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
