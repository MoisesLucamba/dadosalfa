import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, Loader2, Zap, Info, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Insight {
  type: "prediction" | "alert" | "opportunity" | "info";
  title: string;
  description: string;
  confidence: number;
  trend?: "up" | "down";
  impact?: "alto" | "médio" | "baixo";
}

const insightConfig = {
  prediction:  { color: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.18)", Icon: Brain         },
  alert:       { color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.18)", Icon: AlertTriangle  },
  opportunity: { color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.18)",  Icon: Zap            },
  info:        { color: "#60a5fa", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.18)",  Icon: Info           },
};

const impactColor = (lvl?: string) =>
  lvl === "alto" ? "#ef4444" : lvl === "médio" ? "#f59e0b" : lvl === "baixo" ? "#3b82f6" : "transparent";

export function AIInsights() {
  const [insights, setInsights]       = useState<Insight[]>([]);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-predictions");
      if (error) throw error;
      if (data?.success && data?.predictions) {
        const predictions = data.predictions;
        const newInsights: Insight[] = [];

        if (predictions.predictions?.brent_30d) {
          const brent = predictions.predictions.brent_30d;
          newInsights.push({
            type: "prediction",
            title: `BRENT $${brent.value.toFixed(0)}–${(brent.value + 4).toFixed(0)} // 30 DIAS`,
            description: brent.reasoning || "Previsão baseada em análise de mercado",
            confidence: brent.confidence,
            trend: brent.trend,
          });
        }

        if (predictions.insights) {
          predictions.insights.slice(0, 2).forEach((insight: any) => {
            newInsights.push({
              type:
                insight.type === "alert"       ? "alert"       :
                insight.type === "opportunity" ? "opportunity" : "prediction",
              title:       insight.title,
              description: insight.description,
              confidence:  insight.confidence,
              trend:
                insight.type === "opportunity" ? "up"   :
                insight.type === "alert"       ? "down" : undefined,
              impact: insight.impact,
            });
          });
        }

        setInsights(newInsights.slice(0, 3));
        setLastUpdated(
          new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", hour12: false })
        );
      }
    } catch {
      setInsights([{
        type: "info",
        title: "ANÁLISE EM PROCESSAMENTO",
        description: "Clique em actualizar para gerar novas previsões com IA",
        confidence: 0,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <div
      className="rounded relative overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(167,139,250,0.2)",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Glows */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{ background: "radial-gradient(circle at top right, rgba(167,139,250,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none"
        style={{ background: "radial-gradient(circle at bottom left, rgba(220,38,38,0.04) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(167,139,250,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded relative shrink-0"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}
          >
            <Brain className="w-4 h-4" style={{ color: "#a78bfa" }} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: "#dc2626", boxShadow: "0 0 6px rgba(220,38,38,0.7)" }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                INSIGHTS DA IA
              </span>
              <Sparkles className="w-3 h-3" style={{ color: "#a78bfa" }} />
            </div>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {lastUpdated ? `SYNC: ${lastUpdated}` : "ANÁLISE EM TEMPO REAL"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#a78bfa"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Insights list */}
      <div className="relative z-10 p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)", opacity: 1 - i * 0.2 }}
              />
            ))
          ) : insights.length > 0 ? (
            insights.map((insight, i) => {
              const cfg = insightConfig[insight.type] ?? insightConfig.info;
              const TrendIcon =
                insight.trend === "up"   ? TrendingUp   :
                insight.trend === "down" ? TrendingDown : null;
              const ic = impactColor(insight.impact);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-3 rounded"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {TrendIcon ? (
                        <TrendIcon
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: insight.trend === "up" ? "#4ade80" : "#f87171" }}
                        />
                      ) : (
                        <cfg.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                      )}
                      <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                        {insight.title}
                      </span>
                    </div>
                    {insight.confidence > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums"
                        style={{ background: `${cfg.color}18`, color: cfg.color }}
                      >
                        {insight.confidence.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {insight.description}
                  </p>
                  {insight.impact && (
                    <span
                      className="mt-2 inline-block text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                      style={{ background: `${ic}18`, color: ic }}
                    >
                      IMPACTO {insight.impact.toUpperCase()}
                    </span>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div
              className="py-8 text-center text-[9px] font-bold tracking-widest"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              // CLIQUE EM ACTUALIZAR PARA GERAR INSIGHTS
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-4 pb-4">
        <button
          onClick={() => navigate("/predictions")}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
          style={{ border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", background: "transparent" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          VER TODAS AS PREVISÕES
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}