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

    const { type = "all" } = await req.json().catch(() => ({ type: "all" }));

    console.log("Verifying market data with AI for type:", type);

    let prompt = "";
    
    if (type === "operators" || type === "all") {
      prompt += `
## Angolan Oil Operators (December 2024)
Provide verified data about the main oil operators in Angola, including:
- Operator name
- Main blocks they operate
- Approximate daily production (barrels per day)
- Decline rate (percentage)

Key operators include: TotalEnergies, ExxonMobil, Chevron, BP, Eni, Sonangol.
`;
    }

    if (type === "exports" || type === "all") {
      prompt += `
## Angola Export Destinations (December 2024)
Provide verified data about Angola's crude oil export destinations:
- Main destination countries/regions
- Approximate percentage of total exports
- Typical monthly volume (barrels)

Major destinations historically include: China (largest), India, Europe, USA, South Korea.
`;
    }

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
            content: `You are an expert on the Angolan petroleum sector with access to the latest industry data.
Provide accurate, verified data based on your training knowledge up to 2024.
Angola is a major oil producer in Africa, producing approximately 1.1-1.2 million barrels per day.
Return ONLY valid JSON, no markdown or additional text.`
          },
          {
            role: "user",
            content: prompt + `

Return a JSON object with this structure:
{
  "operators": [
    {
      "name": "TotalEnergies",
      "blocks": ["17", "32"],
      "daily_production": 385000,
      "decline_rate": 2.4,
      "fields": ["Girassol", "Dalia", "Pazflor"]
    }
  ],
  "exports": [
    {
      "destination": "China",
      "percentage": 60,
      "monthly_volume": 28000000
    }
  ],
  "total_production": 1100000,
  "source": "Industry estimates - December 2024",
  "last_updated": "2024-12-19"
}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_market_data",
              description: "Return verified Angolan oil market data",
              parameters: {
                type: "object",
                properties: {
                  operators: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        blocks: { type: "array", items: { type: "string" } },
                        daily_production: { type: "number" },
                        decline_rate: { type: "number" },
                        fields: { type: "array", items: { type: "string" } }
                      },
                      required: ["name", "blocks", "daily_production"]
                    }
                  },
                  exports: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        destination: { type: "string" },
                        percentage: { type: "number" },
                        monthly_volume: { type: "number" }
                      },
                      required: ["destination", "percentage", "monthly_volume"]
                    }
                  },
                  total_production: { type: "number" },
                  source: { type: "string" },
                  last_updated: { type: "string" }
                },
                required: ["operators", "exports", "source"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_market_data" } }
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    let marketData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      marketData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          marketData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!marketData) {
      throw new Error("Failed to parse market data from AI response");
    }

    console.log("Market data verified:", marketData);

    return new Response(
      JSON.stringify({
        success: true,
        data: marketData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying market data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
