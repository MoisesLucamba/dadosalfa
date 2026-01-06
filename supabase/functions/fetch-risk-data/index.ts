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

    console.log("Fetching real-time Angola risk assessment data using AI...");

    const currentDate = new Date().toISOString().split("T")[0];

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
            content: `You are a geopolitical and market risk analyst specialized in Angola and the African oil sector.
You analyze political, economic, operational, and regulatory risks affecting oil operations.
Provide realistic assessments based on current events and historical patterns.
Current date: ${currentDate}.
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Provide a comprehensive risk assessment for Angola's oil sector.

Analyze these risk categories (score 1-100, where 100 is highest risk):

1. POLITICAL RISK - Government stability, policy changes, elections, corruption
2. ECONOMIC RISK - Currency (Kwanza) stability, inflation, fiscal policy, debt
3. OPERATIONAL RISK - Infrastructure, logistics, labor, technical challenges
4. REGULATORY RISK - Local content requirements, tax changes, contract terms
5. SECURITY RISK - Cabinda separatism, maritime security, regional conflicts
6. MARKET RISK - Oil price volatility, demand fluctuations, competition
7. ENVIRONMENTAL RISK - Climate policies, ESG pressure, regulations
8. INFRASTRUCTURE RISK - Port capacity, pipeline condition, power supply

Also provide:
- 3-5 current risk alerts (specific events/concerns)
- Country risk scores for key trade partners (China, India, EU, USA)
- 3-5 upcoming regulatory events to watch

Consider recent developments like OPEC+ decisions, local elections, and global energy transition.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_risk_assessment",
              description: "Return comprehensive risk assessment data",
              parameters: {
                type: "object",
                properties: {
                  risk_scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        score: { type: "number" },
                        trend: { type: "string", enum: ["improving", "stable", "worsening"] },
                        description: { type: "string" }
                      },
                      required: ["category", "score", "trend"]
                    }
                  },
                  risk_alerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        alert_type: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        region: { type: "string" }
                      },
                      required: ["title", "alert_type", "description", "impact"]
                    }
                  },
                  country_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        country: { type: "string" },
                        score: { type: "number" },
                        trend: { type: "string" }
                      },
                      required: ["country", "score"]
                    }
                  },
                  regulatory_events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        event_date: { type: "string" },
                        impact_level: { type: "string" },
                        status: { type: "string" }
                      },
                      required: ["title", "description"]
                    }
                  },
                  overall_risk_score: { type: "number" },
                  assessment_date: { type: "string" },
                  source: { type: "string" }
                },
                required: ["risk_scores", "risk_alerts", "overall_risk_score", "source"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_risk_assessment" } }
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

    let riskData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      riskData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          riskData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!riskData || !riskData.risk_scores) {
      throw new Error("Failed to parse risk data from AI response");
    }

    console.log("Parsed risk data:", riskData.risk_scores.length, "categories");

    const { action } = await req.json().catch(() => ({ action: "fetch" }));

    if (action === "sync") {
      const today = new Date().toISOString().split("T")[0];

      // Sync risk scores
      for (const risk of riskData.risk_scores) {
        const { data: existing } = await supabase
          .from("risk_data")
          .select("id")
          .eq("category", risk.category)
          .eq("data_date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("risk_data")
            .update({
              score: risk.score,
              trend: risk.trend,
              description: risk.description || null,
              source: riskData.source,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("risk_data")
            .insert({
              category: risk.category,
              score: risk.score,
              trend: risk.trend,
              description: risk.description || null,
              source: riskData.source,
              data_date: today
            });
        }
      }

      // Sync risk alerts
      if (riskData.risk_alerts) {
        // Deactivate old alerts
        await supabase
          .from("risk_alerts")
          .update({ is_active: false })
          .eq("is_active", true);

        for (const alert of riskData.risk_alerts) {
          await supabase
            .from("risk_alerts")
            .insert({
              title: alert.title,
              alert_type: alert.alert_type,
              description: alert.description,
              impact: alert.impact,
              region: alert.region || "Angola",
              is_active: true
            });
        }
      }

      // Sync country risks
      if (riskData.country_risks) {
        for (const country of riskData.country_risks) {
          const { data: existing } = await supabase
            .from("country_risk")
            .select("id")
            .eq("country", country.country)
            .eq("data_date", today)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("country_risk")
              .update({
                score: country.score,
                trend: country.trend || "stable",
                updated_at: new Date().toISOString()
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("country_risk")
              .insert({
                country: country.country,
                score: country.score,
                trend: country.trend || "stable",
                data_date: today
              });
          }
        }
      }

      // Sync regulatory events
      if (riskData.regulatory_events) {
        for (const event of riskData.regulatory_events) {
          const { data: existing } = await supabase
            .from("regulatory_events")
            .select("id")
            .eq("title", event.title)
            .maybeSingle();

          if (!existing) {
            await supabase
              .from("regulatory_events")
              .insert({
                title: event.title,
                description: event.description,
                event_date: event.event_date || null,
                impact_level: event.impact_level || "medium",
                status: event.status || "upcoming"
              });
          }
        }
      }

      await supabase.from("data_updates").insert({
        data_type: "risk",
        source: "AI Real-time Fetch",
        records_updated: riskData.risk_scores.length + (riskData.risk_alerts?.length || 0),
        notes: riskData.source
      });

      console.log("Risk data synced to database");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: riskData,
        synced: action === "sync"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching risk data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
