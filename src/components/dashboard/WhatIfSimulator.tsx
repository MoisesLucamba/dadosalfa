import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, BarChart3,
  Fuel, RefreshCw, Trash2, Copy, LineChart, PieChart,
  AlertTriangle, Plus, Layers, Activity, Terminal, ChevronRight,
  Zap,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell, Legend,
} from "recharts";
import { toast } from "sonner";
import { AngolaVariables } from "./AngolaVariables";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScenarioParams {
  name: string;
  brentPrice: number;
  production: number;
  exchangeRate: number;
  operatingCost: number;
  taxRate: number;
  royaltyRate: number;
}

interface ScenarioResult {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  governmentTake: number;
  breakEven: number;
  cashFlow: number[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_SCENARIO: ScenarioParams = {
  name: "BASE",
  brentPrice: 78,
  production: 1080,
  exchangeRate: 830,
  operatingCost: 28,
  taxRate: 50,
  royaltyRate: 16,
};

const PRESET_SCENARIOS = {
  optimistic:  { name: "OTIMISTA",   brentPrice: 95,  production: 1150, exchangeRate: 780,  operatingCost: 25, taxRate: 48, royaltyRate: 15 },
  pessimistic: { name: "PESSIMISTA", brentPrice: 60,  production: 950,  exchangeRate: 950,  operatingCost: 32, taxRate: 52, royaltyRate: 18 },
  crisis:      { name: "CRISE",      brentPrice: 45,  production: 850,  exchangeRate: 1100, operatingCost: 35, taxRate: 55, royaltyRate: 20 },
};

const SCENARIO_COLORS = ["#dc2626", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const TABS = [
  { id: "params",     label: "PARÂMETROS" },
  { id: "results",    label: "RESULTADOS"  },
  { id: "comparison", label: "COMPARATIVO" },
  { id: "projection", label: "PROJECÇÃO"   },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Calculator ───────────────────────────────────────────────────────────────
const calculateResults = (p: ScenarioParams): ScenarioResult => {
  const annualRevenue    = p.brentPrice * p.production * 1000 * 365;
  const annualCosts      = p.operatingCost * p.production * 1000 * 365;
  const grossProfit      = annualRevenue - annualCosts;
  const taxAmount        = grossProfit * (p.taxRate / 100);
  const royaltyAmount    = annualRevenue * (p.royaltyRate / 100);
  const netProfit        = grossProfit - taxAmount - royaltyAmount;
  const governmentTake   = taxAmount + royaltyAmount;
  const breakEven        = p.operatingCost / (1 - (p.taxRate + p.royaltyRate) / 100);
  const cashFlow         = Array.from({ length: 12 }, (_, i) => (netProfit / 12) * (1 + Math.sin(i / 2) * 0.05));
  return { revenue: annualRevenue, costs: annualCosts + governmentTake, profit: netProfit, margin: (netProfit / annualRevenue) * 100, governmentTake, breakEven, cashFlow };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fB  = (v: number) => `$${(v / 1e9).toFixed(2)}B`;
const fPct = (v: number) => `${v.toFixed(1)}%`;

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 text-[10px] font-bold"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(220,38,38,0.3)",
        borderRadius: "4px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <p className="text-[9px] mb-2 tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color || entry.fill }} />
            <span style={{ color: "hsl(var(--muted-foreground))" }}>{entry.name}</span>
          </div>
          <span style={{ color: "hsl(var(--foreground))" }}>
            {typeof entry.value === "number" && String(entry.name).toLowerCase().includes("margem")
              ? fPct(entry.value)
              : `${entry.value.toFixed(2)}B`}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Slider Row ───────────────────────────────────────────────────────────────
const SliderParam = ({ label, icon: Icon, color, value, min, max, unit, onChange }: any) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 flex items-center justify-center" style={{ color }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          {label}
        </span>
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>
        {unit === "$" || unit === "AOA" ? unit : ""}{value}{unit === "%" || unit === "k" ? unit : ""}
      </span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={1} className="py-1" />
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export const WhatIfSimulator = () => {
  const [scenarios, setScenarios] = useState<ScenarioParams[]>([
    { ...BASE_SCENARIO },
    { ...PRESET_SCENARIOS.optimistic },
    { ...PRESET_SCENARIOS.pessimistic },
  ]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [activeTab, setActiveTab]           = useState<TabId>("params");

  const currentScenario = scenarios[activeScenario];
  const results         = useMemo(() => scenarios.map(calculateResults), [scenarios]);
  const currentResult   = results[activeScenario];

  const updateScenario = (key: keyof ScenarioParams, value: number | string) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...updated[activeScenario], [key]: value };
    setScenarios(updated);
  };

  const addScenario = () => {
    if (scenarios.length >= 5) { toast.error("MÁXIMO 5 CENÁRIOS"); return; }
    const next = [...scenarios, { ...BASE_SCENARIO, name: `SCN-0${scenarios.length + 1}` }];
    setScenarios(next);
    setActiveScenario(next.length - 1);
    toast.success("NOVO CENÁRIO CRIADO");
  };

  const removeScenario = (index: number) => {
    if (scenarios.length <= 1) return;
    const updated = scenarios.filter((_, i) => i !== index);
    setScenarios(updated);
    if (activeScenario >= updated.length) setActiveScenario(updated.length - 1);
    toast.success("CENÁRIO REMOVIDO");
  };

  const duplicateScenario = (index: number) => {
    if (scenarios.length >= 5) return;
    const dup = { ...scenarios[index], name: `${scenarios[index].name}-CPY` };
    setScenarios([...scenarios, dup]);
    toast.success("CENÁRIO DUPLICADO");
  };

  const applyPreset = (key: keyof typeof PRESET_SCENARIOS) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...PRESET_SCENARIOS[key] };
    setScenarios(updated);
    toast.success(`PRESET ${PRESET_SCENARIOS[key].name} APLICADO`);
  };

  // Projection data
  const projectionData = Array.from({ length: 12 }, (_, i) => {
    const month = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][i];
    const row: Record<string, any> = { month };
    scenarios.forEach((s, idx) => { row[s.name] = results[idx].cashFlow[i] / 1e9; });
    return row;
  });

  const comparisonData = scenarios.map((s, i) => ({
    name: s.name,
    receita: results[i].revenue / 1e9,
    lucro: results[i].profit / 1e9,
  }));

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        fontFamily: "'IBM Plex Mono', monospace",
        overflow: "hidden",
      }}
    >
      {/* ── Top Header Bar ── */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(220,38,38,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}
          >
            <Calculator className="w-4 h-4" style={{ color: "#dc2626" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-red-500" />
              <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)" }}>
                MÓDULO-SIM // WHAT-IF ENGINE
              </span>
            </div>
            <h3 className="text-[13px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
              SIMULADOR DE CENÁRIOS FINANCEIROS
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addScenario}
            className="flex items-center gap-2 px-4 py-2 rounded text-[9px] font-bold tracking-widest transition-all"
            style={{
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              color: "white",
              border: "1px solid rgba(220,38,38,0.4)",
              boxShadow: "0 0 12px rgba(220,38,38,0.2)",
            }}
          >
            <Plus className="w-3 h-3" />
            NOVO CENÁRIO
          </button>
        </div>
      </div>

      {/* ── Scenario Tabs ── */}
      <div
        className="flex items-center gap-1 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
      >
        {scenarios.map((scenario, index) => (
          <button
            key={index}
            onClick={() => setActiveScenario(index)}
            className="flex items-center gap-2 px-4 py-2 rounded text-[9px] font-bold tracking-widest whitespace-nowrap transition-all"
            style={{
              background: activeScenario === index ? "rgba(255,255,255,0.07)" : "transparent",
              border: `1px solid ${activeScenario === index ? "rgba(255,255,255,0.1)" : "transparent"}`,
              color: activeScenario === index ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SCENARIO_COLORS[index] }} />
            {scenario.name}
          </button>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div
        className="flex items-center overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-3 text-[9px] font-bold tracking-[0.2em] transition-all whitespace-nowrap relative"
            style={{ color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "#dc2626" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB CONTENT ══ */}
      <div className="p-6">
        <AnimatePresence mode="wait">

          {/* ── PARAMS ── */}
          {activeTab === "params" && (
            <motion.div key="params" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Presets */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    PRESETS:
                  </span>
                  {(["optimistic","pessimistic","crisis"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 rounded text-[9px] font-bold tracking-wider transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "hsl(var(--muted-foreground))",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)";
                        (e.currentTarget as HTMLElement).style.color = "#f87171";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
                      }}
                    >
                      {PRESET_SCENARIOS[p].name}
                    </button>
                  ))}
                </div>

                {/* Utils */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => duplicateScenario(activeScenario)}
                    className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
                  >
                    <Copy className="w-3 h-3" /> DUPLICAR
                  </button>
                  {scenarios.length > 1 && (
                    <button
                      onClick={() => removeScenario(activeScenario)}
                      className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest transition-colors"
                      style={{ color: "rgba(239,68,68,0.5)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.5)"}
                    >
                      <Trash2 className="w-3 h-3" /> REMOVER
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="max-w-xs space-y-2">
                <span className="text-[8px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  IDENTIFICAÇÃO DO CENÁRIO
                </span>
                <input
                  value={currentScenario.name}
                  onChange={e => updateScenario("name", e.target.value)}
                  className="w-full h-10 px-3 rounded text-[11px] font-bold tracking-wider outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "hsl(var(--foreground))",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-7">
                {[
                  { label: "PREÇO BRENT",   key: "brentPrice",    icon: DollarSign, min: 30,  max: 150,  unit: "$",   color: "#3b82f6" },
                  { label: "PRODUÇÃO",       key: "production",    icon: Fuel,       min: 500, max: 1500, unit: "k",   color: "#10b981" },
                  { label: "CÂMBIO",         key: "exchangeRate",  icon: TrendingUp, min: 500, max: 1500, unit: "AOA", color: "#f59e0b" },
                  { label: "CUSTO OPER.",    key: "operatingCost", icon: BarChart3,  min: 15,  max: 50,   unit: "$",   color: "#ef4444" },
                  { label: "IMPOSTOS",       key: "taxRate",       icon: PieChart,   min: 30,  max: 70,   unit: "%",   color: "#8b5cf6" },
                  { label: "ROYALTIES",      key: "royaltyRate",   icon: LineChart,  min: 5,   max: 30,   unit: "%",   color: "#ec4899" },
                ].map(p => (
                  <SliderParam
                    key={p.key}
                    label={p.label}
                    icon={p.icon}
                    color={p.color}
                    value={(currentScenario as any)[p.key]}
                    min={p.min}
                    max={p.max}
                    unit={p.unit}
                    onChange={(v: number) => updateScenario(p.key as any, v)}
                  />
                ))}
              </div>

              <AngolaVariables
                brentPrice={currentScenario.brentPrice}
                operatingCost={currentScenario.operatingCost}
                production={currentScenario.production}
              />
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {activeTab === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* KPI grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "RECEITA ANUAL",  value: fB(currentResult.revenue),        color: "#3b82f6",  tag: "REV" },
                  { label: "LUCRO LÍQUIDO",  value: fB(currentResult.profit),         color: currentResult.profit > 0 ? "#10b981" : "#ef4444", tag: "NET" },
                  { label: "MARGEM",         value: fPct(currentResult.margin),       color: "#f59e0b",  tag: "MRG" },
                  { label: "GOV. TAKE",      value: fB(currentResult.governmentTake), color: "#8b5cf6",  tag: "GOV" },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded p-5 group"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${m.color}33`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5" style={{ background: `${m.color}18`, color: m.color, borderBottomLeftRadius: "4px" }}>{m.tag}</div>
                    <div className="text-[9px] font-bold tracking-[0.2em] mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold tabular-nums" style={{ color: m.color, letterSpacing: "-0.02em" }}>{m.value}</span>
                      {m.label === "LUCRO LÍQUIDO" && (
                        currentResult.profit > 0
                          ? <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
                          : <TrendingDown className="w-4 h-4" style={{ color: "#ef4444" }} />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
                  </div>
                ))}
              </div>

              {/* Break-Even */}
              <div
                className="p-6 rounded relative overflow-hidden flex items-center justify-between gap-6"
                style={{
                  background: currentScenario.brentPrice < currentResult.breakEven
                    ? "rgba(239,68,68,0.06)" : "rgba(74,222,128,0.06)",
                  border: `1px solid ${currentScenario.brentPrice < currentResult.breakEven ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)"}`,
                }}
              >
                <Activity className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.04]" />

                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded"
                    style={{
                      background: currentScenario.brentPrice < currentResult.breakEven ? "rgba(239,68,68,0.12)" : "rgba(74,222,128,0.12)",
                      color: currentScenario.brentPrice < currentResult.breakEven ? "#f87171" : "#4ade80",
                    }}
                  >
                    {currentScenario.brentPrice < currentResult.breakEven
                      ? <AlertTriangle className="w-5 h-5" />
                      : <TrendingUp className="w-5 h-5" />
                    }
                  </div>
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.25em] mb-1" style={{ color: currentScenario.brentPrice < currentResult.breakEven ? "rgba(248,113,113,0.7)" : "rgba(74,222,128,0.7)" }}>
                      {currentScenario.brentPrice < currentResult.breakEven ? "⚠ ALERTA — ABAIXO DO BREAK-EVEN" : "// OPERAÇÃO RENTÁVEL"}
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>PREÇO DE BREAK-EVEN</p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {currentScenario.brentPrice < currentResult.breakEven
                        ? `Preço actual ($${currentScenario.brentPrice}) abaixo do limite de rentabilidade`
                        : `Margem de segurança: $${(currentScenario.brentPrice - currentResult.breakEven).toFixed(0)}/bbl`
                      }
                    </p>
                  </div>
                </div>

                <div className="relative z-10 text-right shrink-0">
                  <span className="font-bold tabular-nums" style={{ fontSize: "2rem", color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
                    ${currentResult.breakEven.toFixed(0)}
                  </span>
                  <span className="text-[11px] ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>/BBL</span>
                </div>
              </div>

              {/* Monthly cash flow mini-chart */}
              <div
                className="rounded overflow-hidden"
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    CASH FLOW MENSAL // {currentScenario.name}
                  </span>
                </div>
                <div className="px-4 py-4" style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentResult.cashFlow.map((v, i) => ({ month: ["J","F","M","A","M","J","J","A","S","O","N","D"][i], value: v / 1e9 }))}>
                      <defs>
                        <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SCENARIO_COLORS[activeScenario]} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={SCENARIO_COLORS[activeScenario]} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="value" name="CASH FLOW" stroke={SCENARIO_COLORS[activeScenario]} strokeWidth={2} fill="url(#cfGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── COMPARISON ── */}
          {activeTab === "comparison" && (
            <motion.div key="comparison" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Bar chart */}
              <div className="rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    COMPARATIVO // RECEITA & LUCRO POR CENÁRIO ($B)
                  </span>
                </div>
                <div className="px-4 py-4" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Bar dataKey="receita" name="RECEITA ($B)" fill="#3b82f6" radius={[3,3,0,0]} barSize={32} />
                      <Bar dataKey="lucro"   name="LUCRO ($B)"   fill="#10b981" radius={[3,3,0,0]} barSize={32} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison table */}
              <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Header */}
                <div
                  className="grid text-[9px] font-bold tracking-[0.2em] px-5 py-3"
                  style={{
                    gridTemplateColumns: "1fr 80px 80px 70px 80px",
                    background: "rgba(255,255,255,0.025)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <span>CENÁRIO</span>
                  <span className="text-right">RECEITA</span>
                  <span className="text-right">LUCRO</span>
                  <span className="text-right">MARGEM</span>
                  <span className="text-right">BREAK-EVEN</span>
                </div>

                {scenarios.map((scenario, index) => (
                  <div
                    key={index}
                    className="grid px-5 py-3.5 transition-colors cursor-pointer relative"
                    style={{
                      gridTemplateColumns: "1fr 80px 80px 70px 80px",
                      alignItems: "center",
                      borderBottom: index < scenarios.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      background: activeScenario === index ? "rgba(255,255,255,0.025)" : "transparent",
                    }}
                    onClick={() => setActiveScenario(index)}
                  >
                    {activeScenario === index && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: SCENARIO_COLORS[index] }} />
                    )}
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: SCENARIO_COLORS[index] }} />
                      <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{scenario.name}</span>
                    </div>
                    <span className="text-[10px] tabular-nums text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {fB(results[index].revenue)}
                    </span>
                    <span
                      className="text-[10px] font-bold tabular-nums text-right"
                      style={{ color: results[index].profit > 0 ? "#4ade80" : "#f87171" }}
                    >
                      {fB(results[index].profit)}
                    </span>
                    <span className="text-[10px] tabular-nums text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {fPct(results[index].margin)}
                    </span>
                    <span className="text-[10px] tabular-nums text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                      ${results[index].breakEven.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PROJECTION ── */}
          {activeTab === "projection" && (
            <motion.div key="projection" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              <div className="rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    PROJECÇÃO DE CASH FLOW // 12 MESES ($B)
                  </span>
                </div>
                <div className="px-4 py-4" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        {scenarios.map((s, i) => (
                          <linearGradient key={s.name} id={`pg${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={SCENARIO_COLORS[i]} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={SCENARIO_COLORS[i]} stopOpacity={0}    />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                      {scenarios.map((s, i) => (
                        <Area key={s.name} type="monotone" dataKey={s.name} stroke={SCENARIO_COLORS[i]} fill={`url(#pg${i})`} strokeWidth={2} dot={false} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 px-5 pb-4">
                  {scenarios.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-4 h-[2px] rounded-full" style={{ background: SCENARIO_COLORS[i] }} />
                      <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical note */}
              <div
                className="p-5 rounded relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="absolute top-2 right-2 opacity-[0.06]">
                  <Zap className="w-10 h-10" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "rgba(220,38,38,0.7)" }}>
                    NOTA TÉCNICA // DISCLAIMER
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Esta projecção considera variações sazonais baseadas em modelos estatísticos de produção.
                  Os valores são estimativas brutas e não consideram interrupções operacionais imprevistas ou variações fiscais extraordinárias.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};