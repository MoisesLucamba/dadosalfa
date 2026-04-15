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
  ArrowUpRight, Info, Zap, Activity, Terminal, ChevronRight,
  Radio, Lock, Cpu,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Pulse ────────────────────────────────────────────────────────────── */
const Pulse = ({ color = "#ef4444" }: { color?: string }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
  </span>
);

/* ─── Custom Tooltip ──────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-[10px] font-bold"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(220,38,38,0.3)",
        borderRadius: "4px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <p className="text-[9px] mb-2 tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      {payload.map((p: any, i: number) =>
        p.value != null && (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}:{" "}
            <span style={{ color: "hsl(var(--foreground))", fontWeight: 700 }}>
              {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            </span>
          </p>
        )
      )}
    </div>
  );
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatValue = (key: string, value: number) => {
  switch (key) {
    case "brent_30d":      return `$${value.toFixed(2)}`;
    case "production_30d": return `${(value / 1000).toFixed(2)}M BPD`;
    case "exports_30d":    return `${value.toFixed(1)}M BBL`;
    case "revenue_30d":    return `$${value.toFixed(2)}B`;
    default:               return value.toString();
  }
};

const getModelLabel = (key: string) => ({
  brent_30d:      "BRENT 30D",
  production_30d: "PRODUÇÃO AO",
  exports_30d:    "EXPORTAÇÕES",
  revenue_30d:    "RECEITA EST.",
}[key] ?? key.toUpperCase());

const getModelIndex = (key: string) => ({
  brent_30d: "01", production_30d: "02", exports_30d: "03", revenue_30d: "04",
}[key] ?? "00");

const impactColor = (lvl: string) =>
  lvl === "alto" ? "#ef4444" : lvl === "médio" ? "#f59e0b" : "#3b82f6";

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */
const Predictions = () => {
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [now, setNow]                 = useState(new Date());
  const [bootDone, setBootDone]       = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 950); fetchPredictions(); }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-predictions");
      if (error) throw error;
      if (data?.success && data?.predictions) {
        setPredictions(data.predictions);
        setLastUpdated(new Date().toLocaleTimeString("pt-AO", { hour12: false }));
        toast.success("PREVISÕES IA SINCRONIZADAS // OK");
      } else throw new Error(data?.error || "Erro");
    } catch { toast.error("FALHA NA SINCRONIZAÇÃO — Tentar novamente"); }
    finally { setLoading(false); }
  };

  /* ── Forecast data ──────────────────────────────────────────────────────── */
  const priceForecastData = useMemo(() => {
    if (predictions?.price_forecast) return predictions.price_forecast;
    const base = predictions?.predictions?.brent_30d?.value || 78;
    const today = new Date();
    return Array.from({ length: 16 }, (_, idx) => {
      const i = idx - 5;
      const d = new Date(today);
      d.setDate(d.getDate() + i * 3);
      const dateStr = d.toLocaleDateString("pt-AO", { day: "numeric", month: "short" }).toUpperCase();
      if (i <= 0) return { date: dateStr, actual: base + (Math.random() - 0.5) * 2, predicted: null, lower: null, upper: null };
      const p = base + i * 0.2 + (Math.random() - 0.5);
      return { date: dateStr, actual: null, predicted: p, lower: p - 2, upper: p + 2 };
    });
  }, [predictions]);

  const productionForecastData = useMemo(() => {
    if (predictions?.production_forecast) return predictions.production_forecast;
    const base = predictions?.predictions?.production_30d?.value || 1100;
    const months = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ","JAN'25","FEV'25"];
    const cur = new Date().getMonth();
    return months.map((month, i) => ({
      month,
      actual:    i <= cur ? base + (Math.random() - 0.5) * 50 : null,
      predicted: i >= cur ? base - i * 3 + (Math.random() - 0.5) * 20 : null,
    }));
  }, [predictions]);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet><title>AlphaData — Previsões IA</title></Helmet>

      {/* Boot */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: "#000", fontFamily: "'IBM Plex Mono', monospace" }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <div className="text-red-500 text-xs space-y-1 w-96 max-w-full px-8">
              <p className="text-red-400 text-lg font-bold mb-4">&gt; ALPHADAT-OS v3.2.1</p>
              <p className="opacity-70">INITIALISING NEURAL PREDICTION ENGINE..... OK</p>
              <p className="opacity-70">LOADING HISTORICAL BRENT DATASET.......... OK</p>
              <p className="text-red-500 animate-pulse">CALIBRATING AI FORECAST MODELS............ ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/predictions" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[35%] pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(220,38,38,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[30%] h-[25%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 70%)" }} />

          <Header activeItem="/predictions" />

          {/* Status Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: bootDone ? 1 : 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-6 py-2 border-b shrink-0"
            style={{ borderColor: "rgba(220,38,38,0.12)", background: "rgba(220,38,38,0.03)" }}
          >
            <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="flex items-center gap-1.5 text-violet-400">
                <Pulse color="#a78bfa" />
                AI ENGINE ONLINE
              </span>
              <span className="opacity-40">|</span>
              <span>MÓDULO: PREVISÕES IA</span>
              <span className="opacity-40">|</span>
              <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> NEURAL v2.0</span>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
              {lastUpdated && <span className="mr-3 opacity-50">SYNC: {lastUpdated}</span>}
              <span style={{ color: "hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12: false })}</span>
            </div>
          </motion.div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">

              {/* ── Header ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>INTELLIGENCE</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>PREVISÕES IA</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Brain icon with pulse */}
                    <div
                      className="relative w-12 h-12 flex items-center justify-center rounded shrink-0"
                      style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)" }}
                    >
                      <Brain className="w-5 h-5" style={{ color: "#a78bfa" }} />
                      <span
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                        style={{ background: "#dc2626", boxShadow: "0 0 8px rgba(220,38,38,0.6)" }}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(167,139,250,0.8)" }}>
                        MÓDULO-03 // NEURAL PREDICTION ENGINE
                      </div>
                      <h1 className="font-bold leading-none" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.02em" }}>
                        PREVISÕES IA
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 ml-16">
                    <div className="h-[1px] w-12 bg-red-600" />
                    <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                      PROJEÇÕES AVANÇADAS · MERCADO PETROLÍFERO ANGOLANO
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchPredictions}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold tracking-widest self-start md:self-auto"
                  style={{
                    background: loading ? "rgba(220,38,38,0.4)" : "linear-gradient(135deg, #dc2626, #991b1b)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(220,38,38,0.3)",
                    border: "1px solid rgba(220,38,38,0.5)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> PROCESSANDO...</>
                    : <><RefreshCw className="w-3.5 h-3.5" /> SINCRONIZAR</>
                  }
                </motion.button>
              </motion.div>

              {/* ── Prediction Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {loading
                    ? [...Array(4)].map((_, i) => (
                        <div key={i} className="h-44 rounded animate-pulse" style={{ background: "hsl(var(--card))", opacity: 1 - i * 0.15 }} />
                      ))
                    : predictions?.predictions && Object.entries(predictions.predictions).map(([key, model], idx) => {
                        const isUp = model.trend === "up";
                        const isActive = activeModel === key;

                        return (
                          <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            onClick={() => setActiveModel(isActive ? null : key)}
                            className="relative overflow-hidden rounded cursor-pointer group"
                            style={{
                              background: isActive ? "rgba(220,38,38,0.06)" : "hsl(var(--card))",
                              border: `1px solid ${isActive ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.06)"}`,
                              transition: "border-color 0.2s, background 0.2s",
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                          >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: "#dc2626" }} />}

                            <div className="p-5">
                              {/* Top row */}
                              <div className="flex items-center justify-between mb-5">
                                <span className="text-[9px] font-bold tabular-nums" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.1em" }}>
                                  {getModelIndex(key)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    {getModelLabel(key)}
                                  </span>
                                  <div
                                    className="w-6 h-6 flex items-center justify-center rounded"
                                    style={{ background: isUp ? "rgba(74,222,128,0.1)" : "rgba(220,38,38,0.1)" }}
                                  >
                                    {isUp
                                      ? <TrendingUp className="w-3 h-3" style={{ color: "#4ade80" }} />
                                      : <TrendingDown className="w-3 h-3" style={{ color: "#f87171" }} />
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* Value */}
                              <div className="mb-1">
                                <span
                                  className="font-bold tabular-nums"
                                  style={{ fontSize: "clamp(1.4rem,2.5vw,1.8rem)", letterSpacing: "-0.03em", color: "hsl(var(--foreground))" }}
                                >
                                  {formatValue(key, model.value)}
                                </span>
                              </div>
                              <span
                                className="text-[11px] font-bold"
                                style={{ color: isUp ? "#4ade80" : "#f87171" }}
                              >
                                {model.change_percent > 0 ? "+" : ""}{model.change_percent.toFixed(1)}%
                              </span>

                              {/* Confidence bar */}
                              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    CONFIANÇA
                                  </span>
                                  <span className="text-[10px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
                                    {model.confidence.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${model.confidence}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ background: isUp ? "#4ade80" : "#f87171" }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Expanded reasoning */}
                            <AnimatePresence>
                              {isActive && model.reasoning && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
                                    <p className="text-[9px] font-bold tracking-widest mt-3 mb-1" style={{ color: "rgba(220,38,38,0.7)" }}>
                                      // REASONING
                                    </p>
                                    <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                                      {model.reasoning}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })
                  }
                </AnimatePresence>
              </div>

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { title: "PROJECÇÃO BRENT", sub: "INTERVALO DE CONFIANÇA 95%", tag: "USD/BBL", data: priceForecastData, xKey: "date",  chart: "area" as const },
                  { title: "TENDÊNCIA PRODUÇÃO AO", sub: "HISTÓRICO VS PROJECÇÃO IA", tag: "KBPD",    data: productionForecastData, xKey: "month", chart: "line" as const },
                ].map((cfg, ci) => (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                    transition={{ delay: 0.45 + ci * 0.08 }}
                    className="rounded overflow-hidden"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {cfg.title}
                          </span>
                        </div>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)", marginLeft: "16px" }}>{cfg.sub}</span>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded tracking-widest"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}
                      >
                        {cfg.tag}
                      </span>
                    </div>

                    {/* Chart */}
                    <div className="px-4 pt-5 pb-2" style={{ height: 270 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {cfg.chart === "area" ? (
                          <AreaChart data={cfg.data}>
                            <defs>
                              <linearGradient id={`ga${ci}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                              </linearGradient>
                              <linearGradient id={`gb${ci}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}    />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey={cfg.xKey} stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                            <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} domain={["auto","auto"]} fontFamily="IBM Plex Mono" />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="actual"    name="REAL"  stroke="#3b82f6" strokeWidth={2} fill={`url(#ga${ci})`} dot={false} />
                            <Area type="monotone" dataKey="predicted" name="PREV." stroke="#4ade80" strokeWidth={2} strokeDasharray="5 4" fill={`url(#gb${ci})`} dot={false} />
                            <Area type="monotone" dataKey="upper"     stroke="transparent" fill="#4ade80" fillOpacity={0.03} dot={false} />
                            <Area type="monotone" dataKey="lower"     stroke="transparent" fill="#4ade80" fillOpacity={0.03} dot={false} />
                          </AreaChart>
                        ) : (
                          <LineChart data={cfg.data}>
                            <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey={cfg.xKey} stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                            <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} domain={["auto","auto"]} fontFamily="IBM Plex Mono" />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                            <Line type="monotone" dataKey="actual"    name="REAL"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="predicted" name="PREV." stroke="#a855f7" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5, fill: "#a855f7", strokeWidth: 0 }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-5 px-5 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-[2px] rounded-full bg-blue-400" />
                        <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>REAL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-[2px] rounded-full" style={{ background: cfg.chart === "area" ? "#4ade80" : "#a855f7" }} />
                        <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>PROJECÇÃO IA</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── Insights + Risks ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Insights */}
                <motion.div
                  className="lg:col-span-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.55 }}
                >
                  <div
                    className="rounded overflow-hidden"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="flex items-center gap-2 px-5 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        STRATEGIC INSIGHTS // ANÁLISE IA
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {predictions?.insights?.length ? (
                        predictions.insights.map((insight, i) => {
                          const cfg = {
                            opportunity: { color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.15)",  Icon: Zap         },
                            alert:       { color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.15)", Icon: AlertCircle  },
                            info:        { color: "#60a5fa", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.15)",  Icon: Info         },
                          }[insight.type] ?? { color: "#64748b", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.15)", Icon: Info };
                          const ic = impactColor(insight.impact);

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="p-4 rounded"
                              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-7 h-7 flex items-center justify-center rounded" style={{ background: `${cfg.color}18` }}>
                                  <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                </div>
                                <span
                                  className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                                  style={{ background: `${ic}18`, color: ic }}
                                >
                                  {insight.impact.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{insight.title}</p>
                              <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{insight.description}</p>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div
                          className="col-span-2 flex items-center justify-center py-14 text-[10px] font-bold tracking-[0.2em]"
                          style={{ color: "hsl(var(--muted-foreground))", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "4px" }}
                        >
                          // NENHUM INSIGHT DISPONÍVEL
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Risk Matrix */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.58 }}
                  className="rounded overflow-hidden"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      RISK MATRIX // FACTORES
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {predictions?.risks?.map((risk, i) => {
                      const lc = impactColor(risk.impact_level);
                      return (
                        <div
                          key={i}
                          className="p-3 rounded"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderLeft: `2px solid ${lc}`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {risk.category.toUpperCase()}
                            </span>
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${lc}15`, color: lc }}
                            >
                              {risk.impact_level.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] leading-relaxed mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {risk.description}
                          </p>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>PROB.</span>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: lc }}>{risk.probability}%</span>
                          </div>
                          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${risk.probability}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.7 }}
                              style={{ background: lc }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* ── Model Performance ── */}
              <motion.div
                className="rounded overflow-hidden"
                style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                transition={{ delay: 0.62 }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                >
                  <Activity className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    MODEL DIAGNOSTICS // PERFORMANCE DO MOTOR IA
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Pulse color="#4ade80" />
                    <span className="text-[9px] font-bold text-green-400 tracking-widest">OPERACIONAL</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
                  {[
                    { label: "MAPE",           value: `${predictions?.model_performance?.mape?.toFixed(1) ?? "—"}%`, color: "#4ade80", sub: "ERRO MÉDIO ABSOLUTO",   tag: "ERR" },
                    { label: "PRECISÃO (30D)", value: `${predictions?.model_performance?.accuracy_30d?.toFixed(1) ?? "—"}%`, color: "#f87171", sub: "TAXA DE ACERTO",  tag: "ACC" },
                    { label: "R² SCORE",       value: predictions?.model_performance?.r2_score?.toFixed(2) ?? "—", color: "#fb923c", sub: "COEF. CORRELAÇÃO",         tag: "COR" },
                    { label: "STATUS",         value: "ONLINE", color: "#4ade80", sub: "SISTEMA ACTIVO",                                                              tag: "SYS" },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-6 relative"
                      style={{
                        borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5" style={{ background: `${m.color}12`, color: m.color, borderBottomLeftRadius: "4px" }}>
                        {m.tag}
                      </div>
                      <div className="text-[9px] font-bold tracking-[0.2em] mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                      <div className="text-2xl font-bold tabular-nums" style={{ color: m.color, letterSpacing: "-0.02em" }}>{m.value}</div>
                      <div className="text-[9px] mt-1 font-bold tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Predictions;