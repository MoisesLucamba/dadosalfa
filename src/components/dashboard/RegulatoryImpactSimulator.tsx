import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, TrendingUp, TrendingDown, DollarSign, BarChart3,
  AlertTriangle, Calculator, Percent, Building2, Leaf,
  Globe, Info, ArrowRight, CheckCircle2, XCircle, Activity,
  Terminal, ChevronRight, Zap, Radio,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SimulationParams {
  royaltyChange: number;
  taxChange: number;
  environmentalCompliance: number;
  opepQuotaChange: number;
  brentPriceScenario: number;
  currencyDevaluation: number;
}

interface SimulationResult {
  revenueImpact: number;
  productionCostImpact: number;
  netProfitImpact: number;
  exportVolumeImpact: number;
  governmentTakeChange: number;
  breakEvenPrice: number;
  viabilityScore: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PARAMS: SimulationParams = {
  royaltyChange: 0, taxChange: 0, environmentalCompliance: 0,
  opepQuotaChange: 0, brentPriceScenario: 78, currencyDevaluation: 0,
};

const BASE_VALUES = {
  dailyProduction: 1100000, currentRoyalty: 16,
  currentTax: 50, operatingCost: 25, currentBrent: 78,
};

const SCENARIOS = {
  optimistic:  { label: "OTIMISTA",   desc: "Preços altos e incentivos fiscais",  params: { royaltyChange: -2, taxChange: -3, environmentalCompliance: 5,  opepQuotaChange: 5,   brentPriceScenario: 95, currencyDevaluation: 5  } },
  baseline:    { label: "BASE",       desc: "Condições actuais de mercado",       params: DEFAULT_PARAMS },
  pessimistic: { label: "PESSIMISTA", desc: "Queda de preços e custos elevados",  params: { royaltyChange: 2, taxChange: 3,  environmentalCompliance: 15, opepQuotaChange: -5,  brentPriceScenario: 60, currencyDevaluation: 20 } },
  crisis:      { label: "CRISE",      desc: "Cenário de stress extremo",          params: { royaltyChange: 5, taxChange: 8,  environmentalCompliance: 30, opepQuotaChange: -15, brentPriceScenario: 45, currencyDevaluation: 40 } },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;
type TabId = "analysis" | "projection";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const viabilityColor  = (s: number) => s > 70 ? "#4ade80" : s > 40 ? "#fb923c" : "#f87171";
const viabilityLabel  = (s: number) => s > 70 ? "ALTA ATRATIVIDADE" : s > 40 ? "RISCO MODERADO" : "INVIÁVEL / CRÍTICO";
const signedPct       = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 text-[10px] font-bold" style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "4px", fontFamily: "'IBM Plex Mono', monospace" }}>
      <p className="text-[9px] mb-1.5 tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color || p.fill }} />
            <span style={{ color: "hsl(var(--muted-foreground))" }}>{p.name}</span>
          </div>
          <span style={{ color: "hsl(var(--foreground))" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Slider row ───────────────────────────────────────────────────────────────
const ParamSlider = ({ label, value, min, max, unit, onChange, color = "#dc2626" }: any) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
      <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded" style={{ background: `${color}14`, color, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value > 0 && unit !== "USD" ? "+" : ""}{value}{unit}
      </span>
    </div>
    <Slider value={[value]} min={min} max={max} step={label.includes("Brent") ? 1 : 0.5} onValueChange={([v]) => onChange(v)} className="py-1" />
  </div>
);

// ─── Insight row ──────────────────────────────────────────────────────────────
const InsightRow = ({ condition, type, text }: { condition: boolean; type: "danger" | "warning" | "success" | "info"; text: string }) => {
  if (!condition && type !== "info") return null;
  const cfg = {
    danger:  { color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)",  Icon: XCircle      },
    warning: { color: "#fb923c", bg: "rgba(251,146,60,0.07)",  border: "rgba(251,146,60,0.2)",  Icon: AlertTriangle },
    success: { color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.2)",  Icon: CheckCircle2  },
    info:    { color: "#60a5fa", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.2)",  Icon: Info          },
  }[type];
  return (
    <div className="flex items-start gap-2.5 p-3 rounded" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
      <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{text}</p>
    </div>
  );
};

// ─── Circular progress ────────────────────────────────────────────────────────
const CircularScore = ({ score }: { score: number }) => {
  const c = viabilityColor(score);
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path className="fill-none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path
          className="fill-none transition-all duration-700"
          stroke={c}
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums" style={{ color: c, fontFamily: "'IBM Plex Mono', monospace" }}>
        {Math.round(score)}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export const RegulatoryImpactSimulator = () => {
  const [params, setParams]               = useState<SimulationParams>(DEFAULT_PARAMS);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey | "custom">("baseline");
  const [activeTab, setActiveTab]         = useState<TabId>("analysis");

  const applyScenario = (key: ScenarioKey) => {
    setActiveScenario(key);
    setParams(SCENARIOS[key].params as SimulationParams);
  };

  const setParam = (key: keyof SimulationParams, v: number) => {
    setParams(p => ({ ...p, [key]: v }));
    setActiveScenario("custom");
  };

  // ── Calculation ─────────────────────────────────────────────────────────────
  const results = useMemo<SimulationResult>(() => {
    const newProduction   = BASE_VALUES.dailyProduction * (1 + params.opepQuotaChange / 100);
    const baseRevenue     = BASE_VALUES.dailyProduction * BASE_VALUES.currentBrent * 365;
    const newRevenue      = newProduction * params.brentPriceScenario * 365;
    const revenueImpact   = ((newRevenue - baseRevenue) / baseRevenue) * 100;
    const newOpex         = BASE_VALUES.operatingCost * (1 + params.environmentalCompliance / 100 + params.currencyDevaluation / 200);
    const productionCostImpact = ((newOpex - BASE_VALUES.operatingCost) / BASE_VALUES.operatingCost) * 100;
    const curGovTake      = BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax;
    const newGovTake      = (BASE_VALUES.currentRoyalty + params.royaltyChange) + (BASE_VALUES.currentTax + params.taxChange);
    const curProfit       = (BASE_VALUES.currentBrent - BASE_VALUES.operatingCost) * (1 - curGovTake / 100);
    const newProfit       = (params.brentPriceScenario - newOpex) * (1 - newGovTake / 100);
    const netProfitImpact = ((newProfit - curProfit) / curProfit) * 100;
    const breakEvenPrice  = newOpex / (1 - newGovTake / 100);
    const score           = Math.max(0, Math.min(100, 50 + (params.brentPriceScenario - breakEvenPrice) * 2 - (newGovTake - curGovTake) * 2));
    return { revenueImpact, productionCostImpact, netProfitImpact, exportVolumeImpact: params.opepQuotaChange, governmentTakeChange: newGovTake - curGovTake, breakEvenPrice, viabilityScore: score };
  }, [params]);

  const projectionData = useMemo(() => (
    ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"].map((month, i) => ({
      month,
      baseline: 100,
      scenario: Math.round(100 * (1 + (results.netProfitImpact / 100) * ((i + 1) / 12))),
    }))
  ), [results.netProfitImpact]);

  const pieData = [
    { name: "GOV TAKE", value: BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax + results.governmentTakeChange, color: "#dc2626" },
    { name: "CUSTOS OP", value: (results.productionCostImpact / 100 + 1) * 25, color: "#f59e0b" },
    { name: "MARGEM",    value: Math.max(0, params.brentPriceScenario - results.breakEvenPrice), color: "#4ade80" },
  ];

  const govTakeTotal = (BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax + results.governmentTakeChange).toFixed(1);

  return (
    <div
      className="max-w-6xl mx-auto space-y-4"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 rounded"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.15)", borderLeft: "2px solid #dc2626" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.7)" }}>
              ENGINE-SIM // IMPACTO REGULATÓRIO
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <Calculator className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                SIMULADOR DE IMPACTO REGULATÓRIO
              </h1>
              <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                ANÁLISE PREDITIVA · SECTOR PETROLÍFERO ANGOLANO
              </p>
            </div>
          </div>
        </div>

        {/* Viability score */}
        <div
          className="flex items-center gap-4 px-5 py-3 rounded"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <CircularScore score={results.viabilityScore} />
          <div>
            <p className="text-[8px] font-bold tracking-[0.25em] mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              VIABILITY SCORE
            </p>
            <p className="text-[11px] font-bold" style={{ color: viabilityColor(results.viabilityScore) }}>
              {viabilityLabel(results.viabilityScore)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Left: Controls ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Scenario presets */}
          <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              <Radio className="w-3 h-3 text-red-500" />
              <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                CENÁRIOS PRÉ-DEFINIDOS
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => applyScenario(key)}
                  className="flex flex-col items-start px-3 py-2.5 rounded text-left transition-all"
                  style={{
                    background: activeScenario === key ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeScenario === key ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <span className="text-[9px] font-bold tracking-wider" style={{ color: activeScenario === key ? "#f87171" : "hsl(var(--foreground))" }}>
                    {s.label}
                  </span>
                  <span className="text-[8px] mt-0.5 leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {s.desc}
                  </span>
                </button>
              ))}
              {activeScenario === "custom" && (
                <div
                  className="col-span-2 flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
                >
                  <Zap className="w-3 h-3" style={{ color: "#a78bfa" }} />
                  <span className="text-[9px] font-bold tracking-widest" style={{ color: "#a78bfa" }}>CUSTOM // PARÂMETROS MANUAIS</span>
                </div>
              )}
            </div>
          </div>

          {/* Params */}
          <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              <Building2 className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                FISCALIDADE
              </span>
            </div>
            <div className="p-4 space-y-5">
              <ParamSlider label="ROYALTIES"           value={params.royaltyChange}         min={-10} max={10}  unit="pp" color="#f59e0b" onChange={v => setParam("royaltyChange", v)} />
              <ParamSlider label="IMPOSTO RENDIMENTO"  value={params.taxChange}              min={-10} max={10}  unit="pp" color="#f59e0b" onChange={v => setParam("taxChange", v)} />
            </div>

            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                MERCADO & OPERAÇÃO
              </span>
            </div>
            <div className="p-4 space-y-5">
              <ParamSlider label="PREÇO BRENT"     value={params.brentPriceScenario}     min={40}  max={120} unit="USD" color="#3b82f6" onChange={v => setParam("brentPriceScenario", v)} />
              <ParamSlider label="QUOTA OPEP+"     value={params.opepQuotaChange}         min={-20} max={20}  unit="%"   color="#10b981" onChange={v => setParam("opepQuotaChange", v)} />
              <ParamSlider label="COMPLIANCE AMBIENTAL" value={params.environmentalCompliance} min={0} max={40}  unit="%"   color="#a78bfa" onChange={v => setParam("environmentalCompliance", v)} />
              <ParamSlider label="DESVALORIZAÇÃO AOA"    value={params.currencyDevaluation}    min={0} max={50}  unit="%"   color="#f87171" onChange={v => setParam("currencyDevaluation", v)} />
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "IMPACTO RECEITA",  value: signedPct(results.revenueImpact),          color: results.revenueImpact > 0 ? "#4ade80" : "#f87171",  icon: DollarSign, tag: "REV" },
              { label: "MARGEM LUCRO",      value: signedPct(results.netProfitImpact),         color: results.netProfitImpact > 0 ? "#4ade80" : "#f87171", icon: TrendingUp,  tag: "MGN" },
              { label: "BREAK-EVEN",        value: `$${results.breakEvenPrice.toFixed(0)}/BBL`, color: results.breakEvenPrice > params.brentPriceScenario ? "#f87171" : "#4ade80", icon: Scale, tag: "BEP" },
            ].map((m, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded p-4 group"
                style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${m.color}33`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
              >
                <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5" style={{ background: `${m.color}14`, color: m.color, borderBottomLeftRadius: "4px" }}>{m.tag}</div>
                <div className="flex items-center gap-1.5 mb-3">
                  <m.icon className="w-3 h-3" style={{ color: m.color }} />
                  <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</span>
                </div>
                <div className="text-[18px] font-bold tabular-nums" style={{ color: m.color, letterSpacing: "-0.02em" }}>{m.value}</div>
                {m.tag === "BEP" && results.breakEvenPrice > params.brentPriceScenario && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                    <span className="text-[8px] font-bold text-red-500">ACIMA DO PREÇO ACTUAL</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div
            className="flex overflow-hidden rounded"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {(["analysis", "projection"] as TabId[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 px-5 py-3 text-[9px] font-bold tracking-[0.2em] transition-colors"
                style={{ color: activeTab === tab ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              >
                {tab === "analysis" ? "ANÁLISE DE IMPACTO" : "PROJECÇÃO 12 MESES"}
                {activeTab === tab && (
                  <motion.div layoutId="sim-tab-line" className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#dc2626" }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {activeTab === "analysis" && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Donut */}
                <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      DISTRIBUIÇÃO DE VALOR
                    </span>
                  </div>
                  <div className="p-4" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="px-4 pb-4 space-y-1.5">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-3 rounded-sm" style={{ background: d.color }} />
                          <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{d.name}</span>
                        </div>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: d.color }}>{d.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      STRATEGIC INSIGHTS
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <InsightRow condition={results.viabilityScore < 40}     type="danger"  text="Risco elevado de desinvestimento. A carga fiscal supera a viabilidade operacional." />
                    <InsightRow condition={results.breakEvenPrice > 65}     type="warning" text="Vulnerabilidade alta a choques de preço externos. Necessário optimizar custos." />
                    <InsightRow condition={results.netProfitImpact > 15}    type="success" text="Cenário altamente atractivo para novos investimentos e exploração." />
                    <InsightRow condition={true}                             type="info"    text={`Government Take actual: ${govTakeTotal}% do barril bruto.`} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "projection" && (
              <motion.div key="projection" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      PROJECÇÃO RENDIMENTO // BASELINE VS CENÁRIO ACTIVO
                    </span>
                  </div>
                  <div className="px-4 py-4" style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <defs>
                          <linearGradient id="scGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                        <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="baseline" name="BASE"    stroke="rgba(255,255,255,0.2)"  fill="transparent" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                        <Area type="monotone" dataKey="scenario" name="CENÁRIO" stroke="#dc2626" fill="url(#scGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-5 px-5 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-[1px]" style={{ background: "rgba(255,255,255,0.2)", borderTop: "1px dashed rgba(255,255,255,0.3)" }} />
                      <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>BASE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-[2px] rounded-full bg-red-500" />
                      <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>CENÁRIO</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};