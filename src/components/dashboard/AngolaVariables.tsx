import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Landmark, Users, Ship, Percent, TrendingDown, Globe,
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
  block0:  { label: "BLOCO 0 — CABINDA (LEGACY PSA)",           royalty: 16, costOilLimit: 50, profitOilGov: 55 },
  block15: { label: "BLOCO 15 — EXXONMOBIL (PSA 2ª GEN)",      royalty: 15, costOilLimit: 55, profitOilGov: 52 },
  block17: { label: "BLOCO 17 — TOTALENERGIES (PSA 3ª GEN)",   royalty: 12, costOilLimit: 60, profitOilGov: 50 },
  block18: { label: "BLOCO 18 — BP (PSA 3ª GEN)",              royalty: 12, costOilLimit: 60, profitOilGov: 50 },
  block31: { label: "BLOCO 31 — BP (PRE-SALT PSA)",            royalty: 10, costOilLimit: 65, profitOilGov: 48 },
  block32: { label: "BLOCO 32 — TOTALENERGIES (PRE-SALT PSA)", royalty: 10, costOilLimit: 65, profitOilGov: 48 },
  custom:  { label: "PERSONALIZADO — ENTRADA MANUAL",           royalty: 16, costOilLimit: 50, profitOilGov: 55 },
};

interface SliderRowProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: string;
}

const SliderRow = ({ icon: Icon, iconColor, label, value, display, min, max, step, onChange, note }: SliderRowProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          {label}
        </span>
      </div>
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {display}
      </span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="py-1" />
    {note && (
      <p className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>{note}</p>
    )}
  </div>
);

export const AngolaVariables = ({ brentPrice, operatingCost, production }: AngolaVariablesProps) => {
  const [exchangeRate, setExchangeRate] = useState(850);
  const [selectedBlock, setSelectedBlock] = useState("block0");
  const [localContent, setLocalContent] = useState(35);
  const [portCost, setPortCost] = useState(2.4);
  const [profitOilGov, setProfitOilGov] = useState(55);

  const regime = BLOCK_REGIMES[selectedBlock];

  const handleBlockChange = (block: string) => {
    setSelectedBlock(block);
    if (block !== "custom") setProfitOilGov(BLOCK_REGIMES[block].profitOilGov);
  };

  const results = useMemo(() => {
    const globalNetback  = brentPrice - operatingCost;
    const adjustedOpex   = operatingCost + (localContent - 25) * 0.04 + portCost;
    const angolaNetback  = brentPrice - adjustedOpex;
    const operatorMargin = angolaNetback * (1 - profitOilGov / 100);
    return {
      globalNetback,
      angolaNetback,
      operatorMargin,
      fiscalAdjustment: globalNetback - operatorMargin,
      projectNPV:       (operatorMargin * production * 1000 * 365 * 10 * 0.6) / 1e6,
      northSeaNetback:  (brentPrice - 20) * 0.55,
      gulfNetback:      (brentPrice - 23.5) * 0.60,
    };
  }, [brentPrice, operatingCost, production, localContent, portCost, profitOilGov]);

  const benchmarkData = [
    { region: "ANGOLA",          value: Math.max(0, results.operatorMargin),  color: "#dc2626" },
    { region: "MAR DO NORTE",    value: Math.max(0, results.northSeaNetback), color: "rgba(255,255,255,0.18)" },
    { region: "GOLFO DO MÉXICO", value: Math.max(0, results.gulfNetback),     color: "rgba(255,255,255,0.12)" },
  ];

  return (
    <div
      className="space-y-8 mt-8 pt-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center rounded shrink-0"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <Landmark className="w-4 h-4" style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--foreground))" }}>
            VARIÁVEIS LOCAIS ANGOLA
          </h4>
          <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            FACTORES FISCAIS E OPERACIONAIS DO MERCADO ANGOLANO
          </p>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
        <SliderRow
          icon={DollarSign} iconColor="#f59e0b" label="AOA/USD RATE"
          value={exchangeRate} display={`${exchangeRate} AOA`}
          min={600} max={1200} step={10} onChange={setExchangeRate}
          note="Taxa BNA actual. Afecta todos os custos operacionais locais"
        />
        <SliderRow
          icon={Users} iconColor="#10b981" label="CONTEÚDO LOCAL (%)"
          value={localContent} display={`${localContent}%`}
          min={25} max={70} step={1} onChange={setLocalContent}
          note="Lei do Conteúdo Local — Lei 10/04. % mais elevada aumenta OPEX local"
        />
        <SliderRow
          icon={Ship} iconColor="#8b5cf6" label="PORTO & LOGÍSTICA ($/BBL)"
          value={portCost * 100} display={`$${portCost.toFixed(2)}`}
          min={150} max={500} step={10} onChange={(v: number) => setPortCost(v / 100)}
          note="Custos de terminal de exportação + carregamento em Luanda/Cabinda"
        />
        <SliderRow
          icon={Percent} iconColor="#ef4444" label="PROFIT OIL GOV. (%)"
          value={profitOilGov} display={`${profitOilGov}%`}
          min={30} max={75} step={1} onChange={setProfitOilGov}
          note="Varia por bloco, tranche de produção e trigger de preço do petróleo"
        />
      </div>

      {/* Block selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Landmark className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            REGIME FISCAL ANPG POR BLOCO
          </span>
        </div>
        <Select value={selectedBlock} onValueChange={handleBlockChange}>
          <SelectTrigger
            className="h-11 rounded text-[10px] font-bold tracking-wider"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'IBM Plex Mono', monospace",
              color: "hsl(var(--foreground))",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{
              background: "hsl(var(--card))",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {Object.entries(BLOCK_REGIMES).map(([key, val]) => (
              <SelectItem key={key} value={key} className="text-[10px] font-bold">
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedBlock !== "custom" && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: "ROYALTY",       value: `${regime.royalty}%`        },
              { label: "COST OIL LIM",  value: `${regime.costOilLimit}%`   },
              { label: "PROFIT OIL GOV",value: `${regime.profitOilGov}%`  },
            ].map((m, i) => (
              <div
                key={i}
                className="p-3 rounded"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[8px] font-bold tracking-widest mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {m.label}
                </p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global vs Angola */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              CENÁRIO GLOBAL
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>NETBACK GLOBAL</span>
            <span className="text-[12px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
              ${results.globalNetback.toFixed(2)}/BBL
            </span>
          </div>
        </div>
        <div className="p-5 rounded" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "#f59e0b" }}>
              CENÁRIO ANGOLA AJUSTADO
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: "NETBACK ANGOLA",  value: `$${results.angolaNetback.toFixed(2)}/BBL`  },
              { label: "MARGEM OPERADOR", value: `$${results.operatorMargin.toFixed(2)}/BBL` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{row.label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deltas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "AJUSTE FISCAL ANGOLA",
            value: `-$${results.fiscalAdjustment.toFixed(2)}/BBL`,
            color: "#f59e0b",
            prefix: <TrendingDown className="w-3 h-3" />,
          },
          {
            label: "MARGEM EFECTIVA OP.",
            value: `$${results.operatorMargin.toFixed(2)}/BBL`,
            color: "hsl(var(--foreground))",
          },
          {
            label: "NPV PROJECTO (AO)",
            value: `$${Math.round(results.projectNPV)}M`,
            color: "hsl(var(--foreground))",
          },
        ].map((d, i) => (
          <div
            key={i}
            className="p-4 rounded"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[8px] font-bold tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {d.label}
            </p>
            <p className="text-[17px] font-bold flex items-center gap-1 tabular-nums" style={{ color: d.color }}>
              {d.prefix}{d.value}
            </p>
          </div>
        ))}
      </div>

      {/* Benchmark chart */}
      <div className="rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            ANGOLA VS BENCHMARK GLOBAL // NETBACK EFECTIVO ($/BBL)
          </span>
        </div>
        <div className="p-4" style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={benchmarkData} layout="vertical" margin={{ left: 110 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="region"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono" }}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div
                      className="px-3 py-2 text-[10px] font-bold"
                      style={{
                        background: "hsl(var(--card))",
                        border: "1px solid rgba(220,38,38,0.3)",
                        borderRadius: "4px",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      <span style={{ color: "#f87171" }}>${Number(payload[0].value).toFixed(2)}/BBL</span>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={20}>
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