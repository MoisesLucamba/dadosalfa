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

    console.log("🔄 Iniciando sincronização de preços de petróleo...");

    let brentPrice: number | null = null;
    let wtiPrice: number | null = null;
    let dataDate: string | null = null;
    let source = "";

    // PRIMARY SOURCE: Oil Price API (oilpriceapi.com) - Real-time data
    if (OIL_PRICE_API_KEY) {
      console.log("📡 Tentando Oil Price API (fonte primária)...");
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
          console.log("✅ Resposta Oil Price API recebida");
          
          if (oilPriceData.status === "success" && oilPriceData.data) {
            brentPrice = oilPriceData.data.price;
            dataDate = new Date(oilPriceData.data.created_at).toISOString().split("T")[0];
            source = "Oil Price API (Tempo Real)";
            console.log(`💰 Preço Brent: $${brentPrice} em ${dataDate}`);
          }
        } else {
          const errorText = await oilPriceResponse.text();
          console.warn("⚠️ Oil Price API erro:", oilPriceResponse.status, errorText);
        }
      } catch (oilPriceError) {
        console.warn("⚠️ Erro Oil Price API:", oilPriceError);
      }
    } else {
      console.log("ℹ️ Oil Price API não configurada");
    }

    // SECONDARY SOURCE: EIA API (U.S. Energy Information Administration)
    if (!brentPrice && EIA_API_KEY) {
      console.log("📡 Tentando EIA API (fonte secundária)...");
      try {
        const brentUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        
        const brentResponse = await fetch(brentUrl);
        
        if (brentResponse.ok) {
          const brentData = await brentResponse.json();
          console.log("✅ Resposta EIA recebida");
          
          if (brentData.response?.data?.length > 0) {
            const latestBrent = brentData.response.data[0];
            brentPrice = parseFloat(latestBrent.value);
            dataDate = latestBrent.period;
            source = "EIA (Administração de Informação de Energia dos EUA)";
            console.log(`💰 Preço Brent EIA: $${brentPrice} em ${dataDate}`);
          }
        } else {
          console.warn("⚠️ EIA Brent falhou:", brentResponse.status);
        }

        // Fetch WTI crude price
        if (brentPrice) {
          const wtiUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&length=5`;
          
          try {
            const wtiResponse = await fetch(wtiUrl);
            if (wtiResponse.ok) {
              const wtiData = await wtiResponse.json();
              if (wtiData.response?.data?.length > 0) {
                wtiPrice = parseFloat(wtiData.response.data[0].value);
                console.log(`💰 Preço WTI EIA: $${wtiPrice}`);
              }
            }
          } catch (wtiError) {
            console.warn("⚠️ Erro ao obter WTI:", wtiError);
          }
        }
      } catch (eiaError) {
        console.warn("⚠️ Erro EIA API:", eiaError);
      }
    } else if (!brentPrice) {
      console.log("ℹ️ EIA API não configurada");
    }

    // TERTIARY SOURCE: FRED (Federal Reserve Economic Data) - Free API
    if (!brentPrice) {
      console.log("📡 Tentando FRED API (fonte terciária)...");
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
                source = "FRED (Dados Económicos do Federal Reserve)";
                console.log(`💰 Preço Brent FRED: $${brentPrice} em ${dataDate}`);
                break;
              }
            }
          }
        } else {
          console.warn("⚠️ FRED API falhou:", fredResponse.status);
        }
      } catch (fredError) {
        console.warn("⚠️ Erro FRED API:", fredError);
      }
    }

    // FINAL FALLBACK: Use cached database value
    if (!brentPrice) {
      console.log("💾 Usando valores em cache da base de dados...");
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
        source = "Dados em Cache (APIs indisponíveis)";
        console.log(`💾 Usando preço Brent em cache: $${brentPrice}`);
      } else {
        // If no cached data exists, use a reasonable default based on historical average
        console.warn("⚠️ Nenhum dado em cache disponível. Usando valor padrão histórico.");
        brentPrice = 80.00; // Historical average
        dataDate = new Date().toISOString().split("T")[0];
        source = "Valor Padrão Histórico (Nenhuma fonte disponível)";
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
        source: `Calculado a partir de Brent + diferencial (${differential >= 0 ? '+' : ''}${differential})`
      }))
    ];

    // Add WTI if available
    if (wtiPrice) {
      prices.push({
        crude_type: "WTI",
        price: wtiPrice,
        change_percent: 0,
        source: "EIA (Administração de Informação de Energia dos EUA)"
      });
    }

    // Calculate change percentages from previous day in DB
    for (const price of prices) {
      try {
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
      } catch (error) {
        console.warn(`⚠️ Erro ao calcular mudança para ${price.crude_type}:`, error);
      }
    }

    console.log("📊 Preços finais calculados:", prices.length, "tipos de crude");

    // Check if we should update the database
    const { action } = await req.json().catch(() => ({ action: "fetch" }));

    if (action === "sync") {
      const today = dataDate || new Date().toISOString().split("T")[0];
      let updatedCount = 0;
      let insertedCount = 0;
      
      for (const price of prices) {
        try {
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
            updatedCount++;
            console.log(`✏️ Atualizado: ${price.crude_type}`);
          } else {
            await supabase
              .from("price_data")
              .insert({
                crude_type: price.crude_type,
                price: price.price,
                change_percent: price.change_percent,
                data_date: today
              });
            insertedCount++;
            console.log(`➕ Inserido: ${price.crude_type}`);
          }
        } catch (dbError) {
          console.error(`❌ Erro ao sincronizar ${price.crude_type}:`, dbError);
        }
      }

      try {
        await supabase.from("data_updates").insert({
          data_type: "price",
          source: source,
          records_updated: updatedCount + insertedCount,
          notes: `Dados de ${dataDate}. Hierarquia de fontes: Oil Price API → EIA → FRED → Cache. Atualizados: ${updatedCount}, Inseridos: ${insertedCount}`
        });
      } catch (logError) {
        console.warn("⚠️ Erro ao registar atualização:", logError);
      }

      console.log(`✅ Sincronização concluída: ${updatedCount} atualizados, ${insertedCount} inseridos`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          prices,
          last_updated: dataDate,
          source: source,
          api_status: {
            oil_price_api: OIL_PRICE_API_KEY ? "configurada" : "não configurada",
            eia_api: EIA_API_KEY ? "configurada" : "não configurada"
          }
        },
        synced: action === "sync"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro geral na sincronização de preços:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido na sincronização de preços" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
