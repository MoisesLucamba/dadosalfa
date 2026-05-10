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

CRITICAL ETHICAL RULES (mandatory):
1. NEVER invent specific events, names of officials, or precise statistics you cannot cite.
2. EVERY risk score MUST include a brief methodology note explaining what factors drove the score.
3. EVERY risk alert MUST include at least one citation (publication name + URL or "internal_methodology" if no public source).
4. Score ranges MUST be calibrated: 0-30 low, 31-60 moderate, 61-80 elevated, 81-100 critical. Avoid clustering at extremes without justification.
5. If you lack specific data on a category, set confidence_level to "estimated" and note the gap explicitly.
6. NEVER assign "verified" confidence — that level is reserved for data ingested from official APIs (ANPG, OPEC, EIA, IMF). AI-generated analysis is at most "estimated".
7. Cite real, well-known sources only: Reuters, Bloomberg, Financial Times, OPEC Bulletin, IMF Country Report, World Bank, ANPG press releases, S&P Global Commodity Insights, Argus Media. Do NOT fabricate URLs — use the publication's home page if a specific article URL is unknown.

Current date: ${currentDate}.
Return data via the provided tool only.`
          },
          {
            role: "user",
            content: `Provide a comprehensive risk assessment for Angola's oil sector based on publicly known recent developments (post-OPEC+ exit Jan 2024, Lourenço administration, Lei 10/04 framework, Cabinda enclave dynamics, Lobito Corridor logistics).

Categories (score 0-100, higher = more risk):
1. POLITICAL — government stability, anti-corruption drive, succession dynamics
2. ECONOMIC — Kwanza FX volatility, inflation, sovereign debt servicing
3. OPERATIONAL — FPSO uptime, declining mature fields, deepwater complexity
4. REGULATORY — local content (Decreto 271/20), tax stability, contract renegotiation
5. SECURITY — Cabinda FLEC tensions, Gulf of Guinea piracy residual risk
6. MARKET — Brent volatility, China demand exposure (>60% of exports)
7. ENVIRONMENTAL — IEA NZE pressure, methane regulations, ESG disinvestment
8. INFRASTRUCTURE — Port of Luanda congestion, Soyo LNG reliability, power grid

Also: 3-5 active alerts with citations, 3-5 country risk scores (China, India, EU, USA), 3-5 upcoming regulatory events.

Be honest: where data is sparse, mark confidence accordingly.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_risk_assessment",
              description: "Return comprehensive risk assessment with mandatory citations and confidence levels",
              parameters: {
                type: "object",
                properties: {
                  risk_scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        score: { type: "number", minimum: 0, maximum: 100 },
                        trend: { type: "string", enum: ["improving", "stable", "worsening"] },
                        description: { type: "string" },
                        methodology: { type: "string", description: "Brief note on what factors drove this score" },
                        confidence_level: { type: "string", enum: ["estimated", "unverified"], description: "AI analysis is at most 'estimated'" },
                        citations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              source: { type: "string" },
                              url: { type: "string" }
                            },
                            required: ["source"]
                          }
                        }
                      },
                      required: ["category", "score", "trend", "methodology", "confidence_level", "citations"]
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
                        region: { type: "string" },
                        confidence_level: { type: "string", enum: ["estimated", "unverified"] },
                        source_url: { type: "string", description: "Citation URL or publication homepage" },
                        citations: {
                          type: "array",
                          items: { type: "object", properties: { source: { type: "string" }, url: { type: "string" } } }
                        }
                      },
                      required: ["title", "alert_type", "description", "impact", "confidence_level", "citations"]
                    }
                  },
                  country_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        country: { type: "string" },
                        score: { type: "number", minimum: 0, maximum: 100 },
                        trend: { type: "string" },
                        confidence_level: { type: "string", enum: ["estimated", "unverified"] }
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
                  overall_risk_score: { type: "number", minimum: 0, maximum: 100 },
                  assessment_date: { type: "string" },
                  source: { type: "string" },
                  disclaimer: { type: "string", description: "Plain-language note about data limitations" }
                },
                required: ["risk_scores", "risk_alerts", "overall_risk_score", "source", "disclaimer"]
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
              methodology: risk.methodology || null,
              confidence_level: risk.confidence_level || "estimated",
              is_ai_estimated: true,
              citations: risk.citations || [],
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
              methodology: risk.methodology || null,
              confidence_level: risk.confidence_level || "estimated",
              is_ai_estimated: true,
              citations: risk.citations || [],
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
              confidence_level: alert.confidence_level || "estimated",
              is_ai_estimated: true,
              citations: alert.citations || [],
              source_url: alert.source_url || null,
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
