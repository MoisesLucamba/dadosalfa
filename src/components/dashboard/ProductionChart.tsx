import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useProductionData } from "@/hooks/useData";
import { useMemo } from "react";
import { format, parseISO, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { BarChart3, Radio } from "lucide-react";
import { DataDepthBadge } from "./DataDepthBadge";

const fallbackData = [
  { month: "JAN", production: 1120, forecast: null },
  { month: "FEV", production: 1145, forecast: null },
  { month: "MAR", production: 1098, forecast: null },
  { month: "ABR", production: 1167, forecast: null },
  { month: "MAI", production: 1134, forecast: null },
  { month: "JUN", production: 1156, forecast: null },
  { month: "JUL", production: 1089, forecast: null },
  { month: "AGO", production: 1112, forecast: null },
  { month: "SET", production: 1078, forecast: null },
  { month: "OUT", production: 1095, forecast: null },
  { month: "NOV", production: 1067, forecast: 1067 },
  { month: "DEZ", production: null, forecast: 1045 },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(220,38,38,0.3)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        entry.value != null && (
          <p key={i} style={{ fontSize: 11, fontWeight: 700, color: entry.color, margin: "2px 0" }}>
            {entry.dataKey === "production" ? "PRODUÇÃO" : "PREV. IA"}:{" "}
            <span style={{ color: "hsl(var(--foreground))" }}>
              {entry.value?.toLocaleString()} KBD
            </span>
          </p>
        )
      ))}
    </div>
  );
};

export function ProductionChart() {
  const { data: productionData, isLoading } = useProductionData();

  const chartData = useMemo(() => {
    if (!productionData || productionData.length === 0) return fallbackData;
    const monthlyData = new Map<string, number>();
    productionData.forEach(item => {
      try {
        const date = parseISO(item.data_date);
        const monthKey = format(date, "yyyy-MM");
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + Number(item.daily_production) / 1000);
      } catch {}
    });
    const sortedData = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([monthKey, production]) => ({
        month: format(parseISO(`${monthKey}-01`), "MMM", { locale: pt }).toUpperCase(),
        production: Math.round(production),
        forecast: null as number | null,
      }));
    if (sortedData.length >= 2) {
      const lastProduction = sortedData[sortedData.length - 1].production;
      const avgDecline = productionData.reduce((s, p) => s + (Number(p.decline_rate) || 0), 0) / productionData.length;
      const dm = 1 - avgDecline / 100;
      sortedData[sortedData.length - 1].forecast = lastProduction;
      const lastMonth = new Date();
      for (let i = 1; i <= 2; i++) {
        sortedData.push({
          month: format(subMonths(lastMonth, -i), "MMM yy", { locale: pt }).toUpperCase(),
          production: null as any,
          forecast: Math.round(lastProduction * Math.pow(dm, i)),
        });
      }
    }
    return sortedData;
  }, [productionData]);

  const yDomain = useMemo(() => {
    const vals = chartData.flatMap(d => [d.production, d.forecast]).filter((v): v is number => v != null);
    if (!vals.length) return [0, 1500];
    const min = Math.min(...vals), max = Math.max(...vals), pad = (max - min) * 0.1;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [chartData]);

  const hasData = chartData.some(d => d.production !== null || d.forecast !== null);

  if (isLoading) {
    return (
      <div
        className="rounded p-5"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <div className="h-3 w-40 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="h-64 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              PRODUÇÃO DE PETRÓLEO // ANGOLA
            </span>
          </div>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)", marginLeft: "14px" }}>
            MILHARES DE BARRIS/DIA (KBD)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <DataDepthBadge startYear={2018} endYear={2025} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] rounded-full" style={{ background: "#3b82f6" }} />
              <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>REAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] rounded-full" style={{ background: "#f59e0b", borderTop: "2px dashed #f59e0b" }} />
              <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>PREV. IA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            // SEM DADOS DE PRODUÇÃO DISPONÍVEIS
          </p>
        </div>
      ) : (
        <div className="px-4 py-4" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 8, fontFamily: "IBM Plex Mono" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 8, fontFamily: "IBM Plex Mono" }} domain={yDomain} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="production" stroke="#3b82f6" strokeWidth={2} fill="url(#prodGrad)" dot={false} connectNulls={false} />
              <Area type="monotone" dataKey="forecast"   stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" fill="url(#fcGrad)" dot={false} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}