import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Activity,
  TrendingDown,
  Leaf,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

// --- TYPES ---
interface Scenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  brentRange: string;
  brentMid: number;
}

interface BlockData {
  block: string;
  operator: string;
  breakeven: number;
}

// --- DATA ---
const SCENARIOS: Scenario[] = [
  {
    id: "current",
    name: "Current Policies",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "#f59e0b",
    description: "Procura de petróleo atinge pico pós-2030. Produção angolana viável até 2040+",
    brentRange: "$75–85/bbl",
    brentMid: 80,
  },
  {
    id: "pledges",
    name: "Announced Pledges",
    icon: <Activity className="w-5 h-5" />,
    color: "#3b82f6",
    description: "Procura atinge pico ~2025. Declínio gradual. Investimento selectivo viável",
    brentRange: "$55–70/bbl",
    brentMid: 62,
  },
  {
    id: "nze",
    name: "Net Zero 2050",
    icon: <TrendingDown className="w-5 h-5" />,
    color: "#ef4444",
    description: "Destruição rápida da procura. Apenas produtores de custo mais baixo sobrevivem",
    brentRange: "$35–50/bbl",
    brentMid: 42,
  },
];

const BLOCKS: BlockData[] = [
  { block: "Bloco 0", operator: "Chevron", breakeven: 28 },
  { block: "Bloco 15", operator: "ExxonMobil", breakeven: 32 },
  { block: "Bloco 17", operator: "TotalEnergies", breakeven: 35 },
  { block: "Bloco 18", operator: "BP", breakeven: 38 },
  { block: "Bloco 31", operator: "BP", breakeven: 42 },
  { block: "Bloco 32", operator: "TotalEnergies", breakeven: 45 },
];

const getViability = (breakeven: number, brentMid: number): "viable" | "marginal" | "at_risk" => {
  if (breakeven < brentMid - 10) return "viable";
  if (breakeven < brentMid) return "marginal";
  return "at_risk";
};

const viabilityConfig = {
  viable: { label: "✅ Viável", bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  marginal: { label: "⚠️ Marginal", bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  at_risk: { label: "❌ Em Risco", bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400" },
};

// Timeline production data per scenario
const generateTimelineData = () => {
  const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
  return years.map((year) => {
    const t = year - 2024;
    return {
      year,
      current: Math.max(0.4, 1.12 - t * 0.01 + (t > 4 ? 0.05 : 0)),
      pledges: Math.max(0.3, 1.12 - t * 0.018 - (t > 6 ? t * 0.005 : 0)),
      nze: Math.max(0.15, 1.12 - t * 0.03 - (t > 4 ? t * 0.008 : 0)),
    };
  });
};

const ANNOTATIONS = [
  { year: 2025, label: "ANPG new block awards" },
  { year: 2028, label: "Bloco 32 full production" },
  { year: 2030, label: "IEA demand peak (Pledges)" },
  { year: 2035, label: "Potential production plateau" },
];

export const EnergyTransitionRisk = () => {
  const [selectedScenario, setSelectedScenario] = useState("pledges");
  const [carbonPrice, setCarbonPrice] = useState(50);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenario)!;
  const timelineData = useMemo(generateTimelineData, []);

  // Carbon price impact
  const carbonImpact = useMemo(() => {
    const co2PerBarrel = 0.43; // tonnes CO2 per barrel
    const additionalCost = carbonPrice * co2PerBarrel;
    const avgBreakeven = BLOCKS.reduce((s, b) => s + b.breakeven, 0) / BLOCKS.length;
    const marginCompression = (additionalCost / activeScenario.brentMid) * 100;
    const blocksAffected = BLOCKS.filter(
      (b) => b.breakeven + additionalCost > activeScenario.brentMid
    ).length;
    return { additionalCost, marginCompression, breakevenShift: additionalCost, blocksAffected };
  }, [carbonPrice, activeScenario]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
        <p className="text-xs font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-bold text-foreground">{Number(entry.value).toFixed(2)} mbpd</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
          <Leaf className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Energy Transition Risk</h2>
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-black uppercase">
              NEW
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Impacto dos cenários de descarbonização global nos ativos upstream angolanos
          </p>
        </div>
      </div>

      {/* SECTION A: Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario) => (
          <motion.button
            key={scenario.id}
            onClick={() => setSelectedScenario(scenario.id)}
            whileTap={{ scale: 0.98 }}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
              selectedScenario === scenario.id
                ? "border-2 shadow-lg"
                : "border-border/50 hover:border-border bg-card/50"
            }`}
            style={{
              borderColor: selectedScenario === scenario.id ? scenario.color : undefined,
              backgroundColor:
                selectedScenario === scenario.id ? `${scenario.color}08` : undefined,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${scenario.color}15`, color: scenario.color }}
              >
                {scenario.icon}
              </div>
              <h4 className="text-sm font-bold text-foreground">{scenario.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{scenario.description}</p>
            <p className="text-xs font-mono font-bold" style={{ color: scenario.color }}>
              Brent: {scenario.brentRange}
            </p>
          </motion.button>
        ))}
      </div>

      {/* SECTION B: Asset Viability Matrix */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Matriz de Viabilidade de Ativos</CardTitle>
          <CardDescription>Principais blocos angolanos por cenário de transição energética</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-3 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bloco</th>
                  <th className="py-3 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operador</th>
                  <th className="py-3 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right font-mono">Breakeven</th>
                  {SCENARIOS.map((s) => (
                    <th key={s.id} className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: s.color }}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {BLOCKS.map((block) => (
                  <tr key={block.block} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-foreground">{block.block}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{block.operator}</td>
                    <td className="py-3 px-4 text-sm font-mono font-bold text-foreground text-right">${block.breakeven}</td>
                    {SCENARIOS.map((s) => {
                      const v = getViability(block.breakeven, s.brentMid);
                      const cfg = viabilityConfig[v];
                      return (
                        <td key={s.id} className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION C: Carbon Price Impact Calculator */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Calculadora de Impacto do Carbono</CardTitle>
              <CardDescription>Simule o efeito de um preço de carbono nos custos operacionais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preço do Carbono ($/tonne CO₂)</span>
              <span className="text-lg font-black text-foreground font-mono">${carbonPrice}</span>
            </div>
            <Slider value={[carbonPrice]} onValueChange={([v]) => setCarbonPrice(v)} min={0} max={150} step={5} className="py-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 border border-border/50 p-4 rounded-xl">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Custo Adicional/bbl</p>
              <p className="text-2xl font-black text-foreground font-mono">${carbonImpact.additionalCost.toFixed(2)}</p>
            </div>
            <div className="bg-secondary/30 border border-border/50 p-4 rounded-xl">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Compressão Margem</p>
              <p className="text-2xl font-black text-foreground font-mono">{carbonImpact.marginCompression.toFixed(1)}%</p>
            </div>
            <div className="bg-secondary/30 border border-border/50 p-4 rounded-xl">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Shift Breakeven</p>
              <p className="text-2xl font-black text-foreground font-mono">+${carbonImpact.breakevenShift.toFixed(2)}/bbl</p>
            </div>
            <div className="bg-secondary/30 border border-border/50 p-4 rounded-xl">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Blocos Afectados</p>
              <p className="text-2xl font-black text-foreground font-mono">
                {carbonImpact.blocksAffected}<span className="text-sm text-muted-foreground">/6</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION D: Timeline to Peak Demand */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Timeline para Pico de Procura</CardTitle>
          <CardDescription>Projecção de produção angolana (mbpd) por cenário — 2024 a 2050</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "monospace" }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "monospace" }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  domain={[0, 1.3]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  x={2026}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: "Hoje",
                    position: "top",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
                {ANNOTATIONS.map((ann) => (
                  <ReferenceDot
                    key={ann.year}
                    x={ann.year}
                    y={timelineData.find((d) => d.year === ann.year)?.pledges || 0}
                    r={4}
                    fill="#3b82f6"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Current Policies"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="pledges"
                  name="Announced Pledges"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="nze"
                  name="Net Zero 2050"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Annotation Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/30">
            {ANNOTATIONS.map((ann) => (
              <div key={ann.year} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-mono font-bold">{ann.year}</span>
                <span>{ann.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
