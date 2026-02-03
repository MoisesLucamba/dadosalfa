import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Fuel,
  RefreshCw,
  Save,
  Trash2,
  Copy,
  LineChart,
  PieChart,
  AlertTriangle,
  ChevronRight,
  Plus,
  Layers,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

/**
 * Simulador What-If Modernizado (Fixed Deep Dark):
 * 1. UI Imersiva: Fundo fixo #0a0a0a com bordas white/5.
 * 2. UX Intuitiva: Sliders personalizados, feedback visual imediato e tabs estilizadas.
 * 3. Cores Hardcoded: Independente do tema do sistema (Dark Mode Permanente).
 * 4. Micro-interações: Transições suaves com Framer Motion.
 */

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

const BASE_SCENARIO: ScenarioParams = {
  name: "Base",
  brentPrice: 78,
  production: 1080,
  exchangeRate: 830,
  operatingCost: 28,
  taxRate: 50,
  royaltyRate: 16,
};

const PRESET_SCENARIOS = {
  optimistic: {
    name: "Otimista",
    brentPrice: 95,
    production: 1150,
    exchangeRate: 780,
    operatingCost: 25,
    taxRate: 48,
    royaltyRate: 15,
  },
  pessimistic: {
    name: "Pessimista",
    brentPrice: 60,
    production: 950,
    exchangeRate: 950,
    operatingCost: 32,
    taxRate: 52,
    royaltyRate: 18,
  },
  crisis: {
    name: "Crise",
    brentPrice: 45,
    production: 850,
    exchangeRate: 1100,
    operatingCost: 35,
    taxRate: 55,
    royaltyRate: 20,
  },
};

const calculateResults = (params: ScenarioParams): ScenarioResult => {
  const dailyRevenue = params.brentPrice * params.production * 1000;
  const annualRevenue = dailyRevenue * 365;
  const dailyCosts = params.operatingCost * params.production * 1000;
  const annualCosts = dailyCosts * 365;
  const grossProfit = annualRevenue - annualCosts;
  const taxAmount = grossProfit * (params.taxRate / 100);
  const royaltyAmount = annualRevenue * (params.royaltyRate / 100);
  const netProfit = grossProfit - taxAmount - royaltyAmount;
  const margin = (netProfit / annualRevenue) * 100;
  const governmentTake = taxAmount + royaltyAmount;
  const breakEven = params.operatingCost / (1 - (params.taxRate + params.royaltyRate) / 100);
  const cashFlow = Array.from({ length: 12 }, (_, i) => {
    const monthlyVariation = 1 + (Math.sin(i / 2) * 0.05);
    return (netProfit / 12) * monthlyVariation;
  });
  return {
    revenue: annualRevenue,
    costs: annualCosts + governmentTake,
    profit: netProfit,
    margin,
    governmentTake,
    breakEven,
    cashFlow,
  };
};

// Tooltip Moderno Fixo
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-xs font-medium text-white/60">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-white">
                {typeof entry.value === 'number' && entry.name.toLowerCase().includes('margem') 
                  ? `${entry.value.toFixed(1)}%` 
                  : `$${entry.value.toFixed(2)}B`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const WhatIfSimulator = () => {
  const [scenarios, setScenarios] = useState<ScenarioParams[]>([
    { ...BASE_SCENARIO },
    { ...PRESET_SCENARIOS.optimistic },
    { ...PRESET_SCENARIOS.pessimistic },
  ]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  const currentScenario = scenarios[activeScenario];
  const updateScenario = (key: keyof ScenarioParams, value: number | string) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...updated[activeScenario], [key]: value };
    setScenarios(updated);
  };

  const results = useMemo(() => scenarios.map(calculateResults), [scenarios]);
  const currentResult = results[activeScenario];

  const addScenario = () => {
    if (scenarios.length >= 5) {
      toast.error("Máximo de 5 cenários permitido");
      return;
    }
    setScenarios([...scenarios, { ...BASE_SCENARIO, name: `Cenário ${scenarios.length + 1}` }]);
    setActiveScenario(scenarios.length);
    toast.success("Novo cenário adicionado");
  };

  const removeScenario = (index: number) => {
    if (scenarios.length <= 1) return;
    const updated = scenarios.filter((_, i) => i !== index);
    setScenarios(updated);
    if (activeScenario >= updated.length) setActiveScenario(updated.length - 1);
    toast.success("Cenário removido");
  };

  const duplicateScenario = (index: number) => {
    if (scenarios.length >= 5) return;
    const newScenario = { ...scenarios[index], name: `${scenarios[index].name} (cópia)` };
    setScenarios([...scenarios, newScenario]);
    toast.success("Cenário duplicado");
  };

  const applyPreset = (presetKey: keyof typeof PRESET_SCENARIOS) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...PRESET_SCENARIOS[presetKey] };
    setScenarios(updated);
    toast.success(`Preset aplicado`);
  };

  const scenarioColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const formatBillions = (value: number) => `$${(value / 1e9).toFixed(2)}B`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden"
    >
      {/* Header do Simulador */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Simulador What-If</h3>
            <p className="text-sm text-white/40 font-medium">Modelagem preditiva de cenários financeiros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCompareMode(!compareMode)}
            className={`rounded-xl px-6 py-5 font-bold transition-all ${
              compareMode ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" />
            {compareMode ? "Modo Simples" : "Comparar"}
          </Button>
          <Button onClick={addScenario} className="bg-white text-black hover:bg-white/90 rounded-xl px-6 py-5 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cenário
          </Button>
        </div>
      </div>

      {/* Navegação de Cenários - Estilo Tab Moderna */}
      <div className="flex items-center gap-2 mb-10 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {scenarios.map((scenario, index) => (
          <button
            key={index}
            onClick={() => setActiveScenario(index)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeScenario === index 
                ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scenarioColors[index] }} />
            <span className="text-xs font-black uppercase tracking-widest">{scenario.name}</span>
          </button>
        ))}
      </div>

      <Tabs defaultValue="params" className="space-y-8">
        <TabsList className="bg-white/[0.03] p-1 rounded-xl border border-white/5 w-full max-w-md">
          {["params", "results", "comparison", "projection"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab} 
              className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              {tab === "params" ? "Parâmetros" : tab === "results" ? "Resultados" : tab === "comparison" ? "Comparativo" : "Projeção"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="params" className="space-y-10">
          {/* Quick Presets & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mr-2">Presets:</span>
              {['optimistic', 'pessimistic', 'crisis'].map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p as any)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-white/60 uppercase transition-all"
                >
                  {p === 'optimistic' ? 'Otimista' : p === 'pessimistic' ? 'Pessimista' : 'Crise'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => duplicateScenario(activeScenario)} className="text-white/30 hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase transition-colors">
                <Copy className="w-3 h-3" /> Copiar
              </button>
              {scenarios.length > 1 && (
                <button onClick={() => removeScenario(activeScenario)} className="text-[#ef4444]/60 hover:text-[#ef4444] flex items-center gap-2 text-[10px] font-bold uppercase transition-colors">
                  <Trash2 className="w-3 h-3" /> Apagar
                </button>
              )}
            </div>
          </div>

          {/* Edit Name */}
          <div className="max-w-md space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Identificação</label>
            <Input
              value={currentScenario.name}
              onChange={(e) => updateScenario('name', e.target.value)}
              className="bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus:ring-primary/20"
            />
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {[
              { label: "Preço Brent", key: "brentPrice", icon: <DollarSign />, min: 30, max: 150, unit: "$", color: "#3b82f6" },
              { label: "Produção", key: "production", icon: <Fuel />, min: 500, max: 1500, unit: "k", color: "#10b981" },
              { label: "Câmbio", key: "exchangeRate", icon: <TrendingUp />, min: 500, max: 1500, unit: "AOA", color: "#f59e0b" },
              { label: "Custo Oper.", key: "operatingCost", icon: <BarChart3 />, min: 15, max: 50, unit: "$", color: "#ef4444" },
              { label: "Impostos", key: "taxRate", icon: <PieChart />, min: 30, max: 70, unit: "%", color: "#8b5cf6" },
              { label: "Royalties", key: "royaltyRate", icon: <LineChart />, min: 5, max: 30, unit: "%", color: "#ec4899" }
            ].map((param) => (
              <div key={param.key} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center" style={{ color: param.color }}>
                      {param.icon}
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{param.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {param.unit === '$' || param.unit === 'AOA' ? param.unit : ''}
                    {(currentScenario as any)[param.key]}
                    {param.unit === '%' || param.unit === 'k' ? param.unit : ''}
                  </span>
                </div>
                <Slider
                  value={[(currentScenario as any)[param.key]]}
                  onValueChange={([v]) => updateScenario(param.key as any, v)}
                  min={param.min}
                  max={param.max}
                  step={1}
                  className="py-2"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-8">
          {/* Métricas de Resultado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Receita Anual", value: formatBillions(currentResult.revenue), color: "#3b82f6" },
              { label: "Lucro Líquido", value: formatBillions(currentResult.profit), color: currentResult.profit > 0 ? "#10b981" : "#ef4444", trend: currentResult.profit > 0 },
              { label: "Margem", value: formatPercent(currentResult.margin), color: "#f59e0b" },
              { label: "Gov. Take", value: formatBillions(currentResult.governmentTake), color: "#8b5cf6" }
            ].map((metric, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: metric.color }} />
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{metric.label}</div>
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  {metric.value}
                  {metric.trend !== undefined && (
                    metric.trend ? <TrendingUp className="w-4 h-4 text-[#10b981]" /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Break-Even Status */}
          <div className={`p-8 rounded-3xl border flex items-center justify-between overflow-hidden relative ${
            currentScenario.brentPrice < currentResult.breakEven ? 'bg-[#ef4444]/5 border-[#ef4444]/20' : 'bg-[#10b981]/5 border-[#10b981]/20'
          }`}>
            <div className="flex items-center gap-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                currentScenario.brentPrice < currentResult.breakEven ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#10b981]/20 text-[#10b981]'
              }`}>
                {currentScenario.brentPrice < currentResult.breakEven ? <AlertTriangle className="w-7 h-7" /> : <TrendingUp className="w-7 h-7" />}
              </div>
              <div>
                <h4 className="text-lg font-black text-white tracking-tight">Preço de Break-Even</h4>
                <p className="text-sm text-white/40 font-medium">
                  {currentScenario.brentPrice < currentResult.breakEven ? "Alerta: Preço atual abaixo do limite de rentabilidade." : "Positivo: Operação rentável nos parâmetros atuais."}
                </p>
              </div>
            </div>
            <div className="text-4xl font-black text-white relative z-10">
              ${currentResult.breakEven.toFixed(0)}<span className="text-lg text-white/30 ml-1">/bbl</span>
            </div>
            {/* Background Decorative Icon */}
            <Activity className="absolute -right-10 -bottom-10 w-40 h-40 opacity-5" />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={scenarios.map((s, i) => ({
                name: s.name,
                receita: results[i].revenue / 1e9,
                lucro: results[i].profit / 1e9,
                margem: results[i].margin,
              }))}>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="4 4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={<ModernTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="receita" fill="#3b82f6" name="Receita ($B)" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="lucro" fill="#10b981" name="Lucro ($B)" radius={[6, 6, 0, 0]} barSize={40} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Cenário</th>
                  <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Receita</th>
                  <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Lucro</th>
                  <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Margem</th>
                  <th className="py-4 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Break-Even</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scenarios.map((scenario, index) => (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scenarioColors[index] }} />
                        <span className="font-bold text-white">{scenario.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-white/70">{formatBillions(results[index].revenue)}</td>
                    <td className={`py-4 px-6 text-right font-mono text-sm font-bold ${results[index].profit > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {formatBillions(results[index].profit)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-white/70">{formatPercent(results[index].margin)}</td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-white/70">${results[index].breakEven.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 12 }, (_, i) => {
                const month = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i];
                const data: Record<string, any> = { month };
                scenarios.forEach((s, idx) => { data[s.name] = results[idx].cashFlow[i] / 1e9; });
                return data;
              })}>
                <defs>
                  {scenarios.map((s, i) => (
                    <linearGradient key={s.name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioColors[i]} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={scenarioColors[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={<ModernTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {scenarios.map((s, i) => (
                  <Area key={s.name} type="monotone" dataKey={s.name} stroke={scenarioColors[i]} fill={`url(#grad-${i})`} strokeWidth={3} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Nota Técnica</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Esta projeção de fluxo de caixa considera variações sazonais baseadas em modelos estatísticos de produção. 
              Os valores são estimativas brutas e não consideram interrupções operacionais imprevistas ou variações fiscais extraordinárias.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};