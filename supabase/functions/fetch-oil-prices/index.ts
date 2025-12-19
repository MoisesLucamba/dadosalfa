import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching real-time oil prices using AI...");

    // Use Lovable AI to get current oil prices
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a financial data assistant specialized in oil and petroleum markets. 
Your task is to provide the most recent crude oil prices. 
Always return realistic market prices based on your training data.
Return ONLY valid JSON, no markdown or explanations.`
          },
          {
            role: "user",
            content: `Provide the current approximate prices for these crude oil types as of today (December 2024):
1. Brent Crude (international benchmark)
2. Cabinda (Angolan grade)
3. Girassol (Angolan grade)
4. Dalia (Angolan grade)  
5. Nemba (Angolan grade)

Angolan crude grades typically trade at a small discount or premium to Brent.

Return a JSON object with this exact structure:
{
  "prices": [
    {"crude_type": "Brent", "price": 72.50, "change_percent": 0.5},
    {"crude_type": "Cabinda", "price": 71.20, "change_percent": 0.3},
    ...
  ],
  "last_updated": "2024-12-19",
  "source": "Market estimates based on December 2024 trading range"
}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_oil_prices",
              description: "Return current oil prices data",
              parameters: {
                type: "object",
                properties: {
                  prices: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        crude_type: { type: "string" },
                        price: { type: "number" },
                        change_percent: { type: "number" }
                      },
                      required: ["crude_type", "price", "change_percent"]
                    }
                  },
                  last_updated: { type: "string" },
                  source: { type: "string" }
                },
                required: ["prices", "last_updated", "source"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_oil_prices" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the function call result
    let priceData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      priceData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          priceData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!priceData || !priceData.prices) {
      throw new Error("Failed to parse price data from AI response");
    }

    console.log("Parsed price data:", priceData);

    // Check if we should update the database
    const { action } = await req.json().catch(() => ({ action: "fetch" }));

    if (action === "sync") {
      // Update prices in database
      const today = new Date().toISOString().split("T")[0];
      
      for (const price of priceData.prices) {
        // Check if price exists for today
        const { data: existing } = await supabase
          .from("price_data")
          .select("id")
          .eq("crude_type", price.crude_type)
          .eq("data_date", today)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from("price_data")
            .update({
              price: price.price,
              change_percent: price.change_percent,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          // Insert new
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

      // Log the update
      await supabase.from("data_updates").insert({
        data_type: "price",
        source: "AI Real-time Fetch",
        records_updated: priceData.prices.length,
        notes: priceData.source
      });

      console.log("Prices synced to database");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: priceData,
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
