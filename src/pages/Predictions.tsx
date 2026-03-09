import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Brain, TrendingUp, TrendingDown, Target, Sparkles,
  AlertCircle, CheckCircle, RefreshCw, Loader2, Shield,
  ArrowUpRight, Info, Zap, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ──────────────────────────────────────────── */
interface PredictionModel {
  value: number;
  change_percent: number;
  confidence: number;
  trend: "up" | "down";
  reasoning: string;
}
interface Insight {
  type: "alert" | "opportunity" | "info";
  title: string;
  description: string;
  confidence: number;
  impact: "alto" | "médio" | "baixo";
}
interface Risk {
  category: string;
  description: string;
  probability: number;
  impact_level: "alto" | "médio" | "baixo";
}
interface ModelPerformance {
  mape: number;
  accuracy_30d: number;
  r2_score: number;
  last_updated: string;
}
interface PredictionsData {
  predictions: {
    brent_30d: PredictionModel;
    production_30d: PredictionModel;
    exports_30d: PredictionModel;
    revenue_30d: PredictionModel;
  };
  price_forecast?: { date: string; actual?: number | null; predicted: number | null; lower: number | null; upper: number | null }[];
  production_forecast?: { month: string; actual?: number | null; predicted: number | null }[];
  insights: Insight[];
  risks?: Risk[];
  model_performance: ModelPerformance;
  generated_at?: string;
}

/* ─── Tokens ─────────────────────────────────────────── */
const C = {
  bg:       "#070a0f",
  surface:  "#0d1117",
  surface2: "#111722",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(220,38,38,0.3)",
  red:      "#dc2626",
  redSoft:  "rgba(220,38,38,0.12)",
  green:    "#22c55e",
  greenSoft:"rgba(34,197,94,0.1)",
  amber:    "#f59e0b",
  blue:     "#3b82f6",
  text:     "#e2e8f0",
  textMid:  "#64748b",
  textDim:  "#334155",
  mono:     "'IBM Plex Mono', monospace",
  sans:     "'Plus Jakarta Sans', sans-serif",
};

/* ─── Custom tooltip ─────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: C.mono, fontSize: 11 }}>
      <p style={{ color: C.textMid, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 9 }}>{label}</p>
      {payload.map((p: any, i: number) => p.value != null && (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <span style={{ color: C.text, fontWeight: 700 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Stat card ──────────────────────────────────────── */
const MetricCard = ({ label, value, color, sub, icon: Icon }: any) => (
  <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: 16 }}>
    <p style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, color: C.textMid, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
    <div className="flex items-center gap-2">
      <span style={{ fontFamily: C.mono, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {Icon && <Icon style={{ width: 16, height: 16, color }} />}
    </div>
    <p style={{ fontFamily: C.sans, fontSize: 11, color: C.textMid, marginTop: 4 }}>{sub}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
const Predictions = () => {
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-predictions");
      if (error) throw error;
      if (data?.success && data?.predictions) {
        setPredictions(data.predictions);
        setLastUpdated(new Date().toLocaleString("pt-AO"));
        toast.success("Previsões IA atualizadas!");
      } else throw new Error(data?.error || "Erro ao gerar previsões");
    } catch (error) {
      toast.error("Erro ao gerar previsões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPredictions(); }, []);

  const formatValue = (key: string, value: number) => {
    switch (key) {
      case "brent_30d":      return `$${value.toFixed(2)}`;
      case "production_30d": return `${(value / 1000).toFixed(2)}M bpd`;
      case "exports_30d":    return `${value.toFixed(1)}M bbl`;
      case "revenue_30d":    return `$${value.toFixed(2)}B`;
      default:               return value.toString();
    }
  };

  const getModelLabel = (key: string) => ({
    brent_30d:      "Preço Brent",
    production_30d: "Produção Angola",
    exports_30d:    "Exportações",
    revenue_30d:    "Receita Est.",
  }[key] || key);

  const getModelIndex = (key: string) => ({
    brent_30d: "01", production_30d: "02", exports_30d: "03", revenue_30d: "04",
  }[key] || "00");

  const priceForecastData = useMemo(() => {
    if (predictions?.price_forecast) return predictions.price_forecast;
    const base = predictions?.predictions?.brent_30d?.value || 78;
    const today = new Date();
    return Array.from({ length: 16 }, (_, idx) => {
      const i = idx - 5;
      const d = new Date(today);
      d.setDate(d.getDate() + i * 3);
      const dateStr = d.toLocaleDateString("pt-AO", { day: "numeric", month: "short" });
      if (i <= 0) return { date: dateStr, actual: base + (Math.random() - 0.5) * 2, predicted: null, lower: null, upper: null };
      const p = base + i * 0.2 + (Math.random() - 0.5);
      return { date: dateStr, actual: null, predicted: p, lower: p - 2, upper: p + 2 };
    });
  }, [predictions]);

  const productionForecastData = useMemo(() => {
    if (predictions?.production_forecast) return predictions.production_forecast;
    const base = predictions?.predictions?.production_30d?.value || 1100;
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez","Jan'25","Fev'25"];
    const cur = new Date().getMonth();
    return months.map((month, i) => ({
      month,
      actual:    i <= cur ? base + (Math.random() - 0.5) * 50 : null,
      predicted: i >= cur ? base - i * 3 + (Math.random() - 0.5) * 20 : null,
    }));
  }, [predictions]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .pred-scroll::-webkit-scrollbar { width: 3px; }
        .pred-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes pulse-r {
          0%,100% { box-shadow: 0 0 4px 1px rgba(220,38,38,.5); }
          50%      { box-shadow: 0 0 12px 4px rgba(220,38,38,.2); }
        }
        .pulse-r { animation: pulse-r 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen" style={{ background: C.bg, fontFamily: C.sans }}>
        <Helmet>
          <title>Previsões IA | AlphaData</title>
          <meta name="description" content="Previsões baseadas em IA para o setor petrolífero angolano." />
        </Helmet>

        <div className="flex h-screen overflow-hidden">
          <Sidebar activeItem="/predictions" />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{
              background: "radial-gradient(ellipse at top, rgba(220,38,38,0.04) 0%, transparent 70%)",
            }} />

            <Header activeItem="/predictions" />

            <main className="pred-scroll flex-1 overflow-y-auto pb-24 lg:pb-8" style={{ padding: "28px 32px" }}>
              <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Page header ───────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-4">
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        AlphaData
                      </span>
                      <span style={{ color: C.textDim, fontSize: 10 }}>/</span>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.red, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        Previsões IA
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: C.redSoft, border: `1px solid ${C.borderHi}` }}>
                        <Brain style={{ width: 18, height: 18, color: C.red }} />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-r" style={{ background: C.red }} />
                      </div>
                      <div>
                        <h1 style={{ fontFamily: C.sans, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                          Previsões Inteligentes
                        </h1>
                        <p style={{ fontFamily: C.mono, fontSize: 9, color: C.textMid, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3 }}>
                          AI Engine v2.0 · Projeções avançadas · Mercado angolano
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4">
                    {lastUpdated && (
                      <div className="hidden md:block text-right">
                        <p style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                          Última Sincronização
                        </p>
                        <p style={{ fontFamily: C.mono, fontSize: 11, color: C.textMid, marginTop: 2 }}>{lastUpdated}</p>
                      </div>
                    )}
                    <button
                      onClick={fetchPredictions}
                      disabled={loading}
                      className="flex items-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                      style={{
                        fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                        padding: "11px 20px", background: C.red, color: "#fff",
                        border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 20px rgba(220,38,38,0.3)",
                      }}
                      onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.background = "#b91c1c")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = C.red)}
                    >
                      {loading
                        ? <><Loader2 style={{ width: 13, height: 13 }} className="spin-slow" /> Processando...</>
                        : <><RefreshCw style={{ width: 13, height: 13 }} /> Atualizar</>
                      }
                    </button>
                  </motion.div>
                </div>

                {/* ── Prediction cards ──────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <AnimatePresence mode="popLayout">
                    {loading
                      ? [...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-44 rounded-xl" style={{ background: C.surface }} />
                        ))
                      : predictions?.predictions && Object.entries(predictions.predictions).map(([key, model], idx) => {
                          const isUp = model.trend === "up";
                          return (
                            <motion.div key={key}
                              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.08 }}
                              className="relative group overflow-hidden"
                              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, transition: "border-color 0.2s" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                            >
                              {/* Top row */}
                              <div className="flex items-center justify-between mb-5">
                                <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                                  {getModelIndex(key)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMid }}>
                                    {getModelLabel(key)}
                                  </span>
                                  <div style={{ padding: "4px 5px", borderRadius: 6, background: isUp ? C.greenSoft : C.redSoft }}>
                                    {isUp
                                      ? <TrendingUp style={{ width: 12, height: 12, color: C.green }} />
                                      : <TrendingDown style={{ width: 12, height: 12, color: C.red }} />
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* Value */}
                              <div className="flex items-baseline gap-2 mb-1">
                                <span style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
                                  {formatValue(key, model.value)}
                                </span>
                              </div>
                              <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: isUp ? C.green : C.red }}>
                                {model.change_percent > 0 ? "+" : ""}{model.change_percent.toFixed(1)}%
                              </span>

                              {/* Confidence */}
                              <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                                    Confiança
                                  </span>
                                  <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                                    {model.confidence.toFixed(0)}%
                                  </span>
                                </div>
                                <div style={{ height: 2, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${model.confidence}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    style={{ height: "100%", background: "rgba(255,255,255,0.45)", borderRadius: 99 }}
                                  />
                                </div>
                              </div>

                              {/* Subtle corner accent */}
                              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{
                                background: "radial-gradient(circle at top right, rgba(220,38,38,0.06) 0%, transparent 70%)",
                              }} />
                            </motion.div>
                          );
                        })
                    }
                  </AnimatePresence>
                </div>

                {/* ── Charts ────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Brent forecast */}
                  {[
                    {
                      title: "Projeção Preço Brent",
                      sub: "Intervalo de confiança 95%",
                      tag: "USD/bbl",
                      data: priceForecastData,
                      xKey: "date",
                      chart: "area",
                    },
                    {
                      title: "Tendência de Produção",
                      sub: "Histórico vs Projeção IA",
                      tag: "kbpd",
                      data: productionForecastData,
                      xKey: "month",
                      chart: "line",
                    },
                  ].map((cfg, ci) => (
                    <div key={ci} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                      {/* Card header */}
                      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <div>
                          <p style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 700, color: C.text }}>{cfg.title}</p>
                          <p style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginTop: 2 }}>{cfg.sub}</p>
                        </div>
                        <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, color: C.red, letterSpacing: "0.16em", padding: "4px 10px", background: C.redSoft, border: `1px solid ${C.borderHi}`, borderRadius: 4 }}>
                          {cfg.tag}
                        </span>
                      </div>

                      {/* Chart */}
                      <div style={{ height: 280, padding: "20px 8px 8px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {cfg.chart === "area" ? (
                            <AreaChart data={cfg.data}>
                              <defs>
                                <linearGradient id={`ga${ci}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.25} />
                                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`gb${ci}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={C.green} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
                              <XAxis dataKey={cfg.xKey} stroke={C.textDim} fontSize={9} tickLine={false} axisLine={false} fontFamily={C.mono} />
                              <YAxis stroke={C.textDim} fontSize={9} tickLine={false} axisLine={false} domain={["auto","auto"]} fontFamily={C.mono} />
                              <Tooltip content={<ChartTooltip />} />
                              <Area type="monotone" dataKey="actual" name="Real" stroke={C.blue} strokeWidth={2} fill={`url(#ga${ci})`} dot={false} />
                              <Area type="monotone" dataKey="predicted" name="Prev." stroke={C.green} strokeWidth={2} strokeDasharray="5 4" fill={`url(#gb${ci})`} dot={false} />
                              <Area type="monotone" dataKey="upper" stroke="transparent" fill={C.green} fillOpacity={0.04} dot={false} />
                              <Area type="monotone" dataKey="lower" stroke="transparent" fill={C.green} fillOpacity={0.04} dot={false} />
                            </AreaChart>
                          ) : (
                            <LineChart data={cfg.data}>
                              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
                              <XAxis dataKey={cfg.xKey} stroke={C.textDim} fontSize={9} tickLine={false} axisLine={false} fontFamily={C.mono} />
                              <YAxis stroke={C.textDim} fontSize={9} tickLine={false} axisLine={false} domain={["auto","auto"]} fontFamily={C.mono} />
                              <Tooltip content={<ChartTooltip />} />
                              <Line type="monotone" dataKey="actual" name="Real" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue, strokeWidth: 0 }} />
                              <Line type="monotone" dataKey="predicted" name="Prev." stroke="#a855f7" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-5 px-6 pb-5">
                        <div className="flex items-center gap-2">
                          <span style={{ width: 20, height: 2, background: C.blue, display: "inline-block", borderRadius: 99 }} />
                          <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>Real</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ width: 20, height: 2, background: cfg.chart === "area" ? C.green : "#a855f7", display: "inline-block", borderRadius: 99, borderTop: "2px dashed" }} />
                          <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>Projeção IA</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Insights + Risks ──────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Insights */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles style={{ width: 14, height: 14, color: C.red }} />
                      <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: C.text, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        Insights Estratégicos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {predictions?.insights?.length ? (
                        predictions.insights.map((insight, i) => {
                          const colors = {
                            opportunity: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: C.green, IconEl: Zap },
                            alert:       { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",  icon: C.red,   IconEl: AlertCircle },
                            info:        { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", icon: C.blue,  IconEl: Info },
                          }[insight.type] || { bg: C.surface, border: C.border, icon: C.textMid, IconEl: Info };

                          const impactColor = { alto: C.red, médio: C.amber, baixo: C.blue }[insight.impact];

                          return (
                            <motion.div key={i}
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                              style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 18 }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${colors.icon}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <colors.IconEl style={{ width: 13, height: 13, color: colors.icon }} />
                                </div>
                                <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, color: impactColor, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", background: `${impactColor}15`, borderRadius: 4 }}>
                                  {insight.impact}
                                </span>
                              </div>
                              <p style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{insight.title}</p>
                              <p style={{ fontFamily: C.sans, fontSize: 11.5, color: C.textMid, lineHeight: 1.65 }}>{insight.description}</p>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 flex items-center justify-center py-14"
                          style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
                          <p style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                            Nenhum insight disponível
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risks */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield style={{ width: 14, height: 14, color: C.amber }} />
                      <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: C.text, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        Matriz de Riscos
                      </span>
                    </div>

                    <div className="space-y-2">
                      {predictions?.risks?.map((risk, i) => {
                        const lvlColor = { alto: C.red, médio: C.amber, baixo: C.blue }[risk.impact_level];
                        return (
                          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, borderLeft: `2px solid ${lvlColor}` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span style={{ fontFamily: C.mono, fontSize: 8, color: C.textDim, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                                {risk.category}
                              </span>
                              <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, color: lvlColor, padding: "2px 7px", background: `${lvlColor}15`, borderRadius: 3 }}>
                                {risk.impact_level}
                              </span>
                            </div>
                            <p style={{ fontFamily: C.sans, fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 10 }}>{risk.description}</p>
                            <div className="flex items-center justify-between">
                              <span style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim }}>Prob.</span>
                              <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: lvlColor }}>{risk.probability}%</span>
                            </div>
                            <div style={{ height: 2, background: C.border, borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
                              <motion.div
                                initial={{ width: 0 }} whileInView={{ width: `${risk.probability}%` }}
                                viewport={{ once: true }} transition={{ duration: 0.7 }}
                                style={{ height: "100%", background: lvlColor, borderRadius: 99 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Model performance ─────────────────── */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <Activity style={{ width: 14, height: 14, color: C.red }} />
                    <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: C.text, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                      Performance do Modelo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-6">
                    <MetricCard label="MAPE" value={`${predictions?.model_performance?.mape?.toFixed(1) ?? "—"}%`} color={C.green} sub="Erro Médio Absoluto" />
                    <MetricCard label="Precisão (30d)" value={`${predictions?.model_performance?.accuracy_30d?.toFixed(1) ?? "—"}%`} color={C.red} sub="Taxa de Acerto" />
                    <MetricCard label="R² Score" value={predictions?.model_performance?.r2_score?.toFixed(2) ?? "—"} color={C.amber} sub="Coef. de Correlação" />
                    <MetricCard label="Status" value="Operacional" color={C.green} sub="Sistema Ativo" icon={CheckCircle} />
                  </div>
                </div>

              </div>
            </main>
          </div>

          <MobileBottomNav />
        </div>
      </div>
    </>
  );
};

export default Predictions;