import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Landmark,
  Users,
  Ship,
  Percent,
  ChevronDown,
  TrendingDown,
  Globe,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AngolaVariablesProps {
  brentPrice: number;
  operatingCost: number;
  production: number;
}

interface BlockFiscalRegime {
  label: string;
  royalty: number;
  costOilLimit: number;
  profitOilGov: number;
}

const BLOCK_REGIMES: Record<string, BlockFiscalRegime> = {
  block0: { label: "Bloco 0 — Cabinda (Legacy PSA)", royalty: 16, costOilLimit: 50, profitOilGov: 55 },
  block15: { label: "Bloco 15 — ExxonMobil (PSA 2ª Gen)", royalty: 15, costOilLimit: 55, profitOilGov: 52 },
  block17: { label: "Bloco 17 — TotalEnergies (PSA 3ª Gen)", royalty: 12, costOilLimit: 60, profitOilGov: 50 },
  block18: { label: "Bloco 18 — BP (PSA 3ª Gen)", royalty: 12, costOilLimit: 60, profitOilGov: 50 },
  block31: { label: "Bloco 31 — BP (Pre-salt PSA)", royalty: 10, costOilLimit: 65, profitOilGov: 48 },
  block32: { label: "Bloco 32 — TotalEnergies (Pre-salt PSA)", royalty: 10, costOilLimit: 65, profitOilGov: 48 },
  custom: { label: "Personalizado — Entrada Manual", royalty: 16, costOilLimit: 50, profitOilGov: 55 },
};

export const AngolaVariables = ({ brentPrice, operatingCost, production }: AngolaVariablesProps) => {
  const [exchangeRate, setExchangeRate] = useState(850);
  const [selectedBlock, setSelectedBlock] = useState("block0");
  const [localContent, setLocalContent] = useState(35);
  const [portCost, setPortCost] = useState(2.4);
  const [profitOilGov, setProfitOilGov] = useState(55);

  const regime = BLOCK_REGIMES[selectedBlock];

  // When block changes, update profitOilGov
  const handleBlockChange = (block: string) => {
    setSelectedBlock(block);
    if (block !== "custom") {
      setProfitOilGov(BLOCK_REGIMES[block].profitOilGov);
    }
  };

  const results = useMemo(() => {
    // Global scenario
    const dailyRevGlobal = brentPrice * production * 1000;
    const annualRevGlobal = dailyRevGlobal * 365;
    const dailyCostsGlobal = operatingCost * production * 1000;
    const annualCostsGlobal = dailyCostsGlobal * 365;
    const globalNetback = brentPrice - operatingCost;

    // Angola adjustments
    const localContentPremium = (localContent - 25) * 0.04; // extra $/bbl for higher local content
    const adjustedOpex = operatingCost + localContentPremium + portCost;
    const angolaNetback = brentPrice - adjustedOpex;
    const profitOilDeduction = angolaNetback * (profitOilGov / 100);
    const operatorMargin = angolaNetback - profitOilDeduction;
    const fiscalAdjustment = globalNetback - operatorMargin;
    const projectNPV = operatorMargin * production * 1000 * 365 * 10 * 0.6 / 1e6; // simplified 10y NPV

    // Benchmarks (simplified netbacks)
    const northSeaNetback = brentPrice - 18 - 2; // lower opex, lower logistics
    const gulfNetback = brentPrice - 22 - 1.5;

    return {
      globalNetback,
      angolaNetback,
      operatorMargin,
      fiscalAdjustment,
      projectNPV,
      northSeaNetback: northSeaNetback * 0.55, // after gov take ~45%
      gulfNetback: gulfNetback * 0.6, // after gov take ~40%
      angolaFinalNetback: operatorMargin,
    };
  }, [brentPrice, operatingCost, production, localContent, portCost, profitOilGov]);

  const benchmarkData = [
    { region: "Angola", value: Math.max(0, results.angolaFinalNetback), color: "#3b82f6" },
    { region: "Mar do Norte", value: Math.max(0, results.northSeaNetback), color: "rgba(255,255,255,0.2)" },
    { region: "Golfo do México", value: Math.max(0, results.gulfNetback), color: "rgba(255,255,255,0.15)" },
  ];

  return (
    <div className="space-y-10 mt-10 border-t border-white/5 pt-10">
      {/* Section Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center border border-[#f59e0b]/20">
          <Landmark className="w-5 h-5 text-[#f59e0b]" />
        </div>
        <div>
          <h4 className="text-lg font-black text-white tracking-tight">Variáveis Locais Angola</h4>
          <p className="text-xs text-white/40">Factores fiscais e operacionais específicos do mercado angolano</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* V1: Exchange Rate */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#f59e0b]">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">AOA/USD Rate</span>
            </div>
            <span className="text-sm font-black text-white font-mono">{exchangeRate} AOA</span>
          </div>
          <Slider value={[exchangeRate]} onValueChange={([v]) => setExchangeRate(v)} min={600} max={1200} step={10} className="py-2" />
          <p className="text-[10px] text-white/25 leading-relaxed">Taxa BNA actual. Afecta todos os custos operacionais locais</p>
        </div>

        {/* V3: Local Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#10b981]">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Conteúdo Local (%)</span>
            </div>
            <span className="text-sm font-black text-white font-mono">{localContent}%</span>
          </div>
          <Slider value={[localContent]} onValueChange={([v]) => setLocalContent(v)} min={25} max={70} step={1} className="py-2" />
          <p className="text-[10px] text-white/25 leading-relaxed">Lei do Conteúdo Local — Lei 10/04. % mais elevada aumenta OPEX local</p>
        </div>

        {/* V4: Port & Logistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#8b5cf6]">
                <Ship className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Porto & Logística ($/bbl)</span>
            </div>
            <span className="text-sm font-black text-white font-mono">${portCost.toFixed(2)}</span>
          </div>
          <Slider value={[portCost * 100]} onValueChange={([v]) => setPortCost(v / 100)} min={150} max={500} step={10} className="py-2" />
          <p className="text-[10px] text-white/25 leading-relaxed">Custos de terminal de exportação + carregamento em Luanda/Cabinda</p>
        </div>

        {/* V5: Profit Oil Split */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#ef4444]">
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Profit Oil Gov. (%)</span>
            </div>
            <span className="text-sm font-black text-white font-mono">{profitOilGov}%</span>
          </div>
          <Slider value={[profitOilGov]} onValueChange={([v]) => setProfitOilGov(v)} min={30} max={75} step={1} className="py-2" />
          <p className="text-[10px] text-white/25 leading-relaxed">Varia por bloco, tranche de produção e trigger de preço do petróleo</p>
        </div>
      </div>

      {/* V2: Block Fiscal Regime */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#3b82f6]">
            <Landmark className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Regime Fiscal ANPG por Bloco</span>
        </div>
        <Select value={selectedBlock} onValueChange={handleBlockChange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-white/10">
            {Object.entries(BLOCK_REGIMES).map(([key, val]) => (
              <SelectItem key={key} value={key} className="text-white/80 focus:bg-white/10 focus:text-white">
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBlock !== "custom" && (
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Royalty</p>
              <p className="text-lg font-black text-white font-mono">{regime.royalty}%</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Cost Oil Limit</p>
              <p className="text-lg font-black text-white font-mono">{regime.costOilLimit}%</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Profit Oil Gov.</p>
              <p className="text-lg font-black text-white font-mono">{regime.profitOilGov}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Results: Global vs Angola */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-white/30" />
            <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Cenário Global</h5>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">Netback Global</span>
              <span className="text-sm font-black text-white font-mono">${results.globalNetback.toFixed(2)}/bbl</span>
            </div>
          </div>
        </div>
        <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/15 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-4 h-4 text-[#f59e0b]" />
            <h5 className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">Cenário Angola Ajustado</h5>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">Netback Angola</span>
              <span className="text-sm font-black text-white font-mono">${results.angolaNetback.toFixed(2)}/bbl</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">Margem Operador</span>
              <span className="text-sm font-black text-white font-mono">${results.operatorMargin.toFixed(2)}/bbl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/15 p-4 rounded-xl">
          <p className="text-[10px] font-black text-[#f59e0b]/70 uppercase tracking-widest mb-1">Ajuste Fiscal Angola</p>
          <p className="text-xl font-black text-[#f59e0b] font-mono flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            -${results.fiscalAdjustment.toFixed(2)}/bbl
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Margem Efectiva Operador</p>
          <p className="text-xl font-black text-white font-mono">${results.operatorMargin.toFixed(2)}/bbl</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">NPV Projecto (Angola)</p>
          <p className="text-xl font-black text-white font-mono">${Math.round(results.projectNPV)}M</p>
        </div>
      </div>

      {/* Benchmark */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6">Angola vs Benchmark Global</h5>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={benchmarkData} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="region"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[#111]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl">
                      <p className="text-xs text-white font-bold">{payload[0].payload.region}</p>
                      <p className="text-sm font-black text-white font-mono">${Number(payload[0].value).toFixed(2)}/bbl</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                {benchmarkData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
