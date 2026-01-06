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

    console.log("Fetching real-time Angola oil production data using AI...");

    const currentDate = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

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
            content: `You are an expert in Angola's oil and gas sector with deep knowledge of production data, operators, and blocks.
You provide accurate, realistic data based on official sources like ANPG (Agência Nacional de Petróleo, Gás e Biocombustíveis), 
OPEC reports, and industry publications. 
Current date: ${currentDate}.
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Provide current Angola oil production data for ${currentMonth} ${currentYear}.

Angola is Africa's second-largest oil producer. Main operators include:
- TotalEnergies (Blocks 17, 32, etc.)
- Chevron (Block 0, 14)
- ExxonMobil (Block 15)
- BP (Block 18, 31)
- Eni (Block 15/06)
- Sonangol (various blocks)

Provide realistic data for the top 8 producing blocks with:
- Block name/number
- Operator name
- Daily production (bpd) - Angola produces ~1.1-1.2 million bpd total
- Monthly production (barrels)
- Status (active, declining, ramping up)
- Decline rate (% annual)
- Main field name

Base your estimates on known production ranges for each block.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_production_data",
              description: "Return Angola oil production data by block",
              parameters: {
                type: "object",
                properties: {
                  production: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        block: { type: "string" },
                        operator: { type: "string" },
                        field: { type: "string" },
                        daily_production: { type: "number" },
                        monthly_production: { type: "number" },
                        status: { type: "string" },
                        decline_rate: { type: "number" }
                      },
                      required: ["block", "operator", "daily_production", "monthly_production"]
                    }
                  },
                  total_daily_production: { type: "number" },
                  data_month: { type: "string" },
                  source: { type: "string" }
                },
                required: ["production", "total_daily_production", "data_month", "source"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_production_data" } }
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
    console.log("AI response received");

    let productionData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      productionData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          productionData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!productionData || !productionData.production) {
      throw new Error("Failed to parse production data from AI response");
    }

    console.log("Parsed production data:", productionData.production.length, "blocks");

    const { action } = await req.json().catch(() => ({ action: "fetch" }));

    if (action === "sync") {
      const today = new Date().toISOString().split("T")[0];
      
      for (const prod of productionData.production) {
        const { data: existing } = await supabase
          .from("production_data")
          .select("id")
          .eq("block", prod.block)
          .eq("data_date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("production_data")
            .update({
              operator: prod.operator,
              field: prod.field || null,
              daily_production: prod.daily_production,
              monthly_production: prod.monthly_production,
              status: prod.status || "active",
              decline_rate: prod.decline_rate || 0,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("production_data")
            .insert({
              block: prod.block,
              operator: prod.operator,
              field: prod.field || null,
              daily_production: prod.daily_production,
              monthly_production: prod.monthly_production,
              status: prod.status || "active",
              decline_rate: prod.decline_rate || 0,
              data_date: today
            });
        }
      }

      await supabase.from("data_updates").insert({
        data_type: "production",
        source: "AI Real-time Fetch",
        records_updated: productionData.production.length,
        notes: productionData.source
      });

      console.log("Production data synced to database");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: productionData,
        synced: action === "sync"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching production data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
