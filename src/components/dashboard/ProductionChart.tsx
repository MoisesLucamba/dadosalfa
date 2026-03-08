import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useProductionData } from "@/hooks/useData";
import { useMemo } from "react";
import { format, parseISO, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { DataDepthBadge } from "./DataDepthBadge";

const fallbackData = [
  { month: "Jan", production: 1120, forecast: null },
  { month: "Fev", production: 1145, forecast: null },
  { month: "Mar", production: 1098, forecast: null },
  { month: "Abr", production: 1167, forecast: null },
  { month: "Mai", production: 1134, forecast: null },
  { month: "Jun", production: 1156, forecast: null },
  { month: "Jul", production: 1089, forecast: null },
  { month: "Ago", production: 1112, forecast: null },
  { month: "Set", production: 1078, forecast: null },
  { month: "Out", production: 1095, forecast: null },
  { month: "Nov", production: 1067, forecast: 1067 },
  { month: "Dez", production: null, forecast: 1045 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === "production" ? "Produção" : "Previsão IA"}:{" "}
            <span className="font-semibold">{entry.value?.toLocaleString()} kbd</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ProductionChart() {
  const { data: productionData, isLoading } = useProductionData();

  const chartData = useMemo(() => {
    if (!productionData || productionData.length === 0) return fallbackData;

    // Group production by month
    const monthlyData = new Map<string, number>();
    
    productionData.forEach(item => {
      try {
        const date = parseISO(item.data_date);
        const monthKey = format(date, "yyyy-MM");
        const current = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, current + Number(item.daily_production) / 1000);
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Convert to array and sort
    const sortedData = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12) // Last 12 months
      .map(([monthKey, production]) => {
        const date = parseISO(`${monthKey}-01`);
        return {
          month: format(date, "MMM", { locale: pt }),
          production: Math.round(production),
          forecast: null as number | null,
        };
      });

    // Add forecast for next 2 months (simple decline projection)
    if (sortedData.length >= 2) {
      const lastProduction = sortedData[sortedData.length - 1].production;
      const avgDeclineRate = productionData.reduce((sum, p) => sum + (Number(p.decline_rate) || 0), 0) / productionData.length;
      const declineMultiplier = 1 - (avgDeclineRate / 100);

      // Add forecast to last data point
      sortedData[sortedData.length - 1].forecast = lastProduction;

      // Add future months
      const lastMonth = new Date();
      for (let i = 1; i <= 2; i++) {
        const futureMonth = subMonths(lastMonth, -i);
        sortedData.push({
          month: format(futureMonth, "MMM yy", { locale: pt }),
          production: null as any,
          forecast: Math.round(lastProduction * Math.pow(declineMultiplier, i)),
        });
      }
    }

    return sortedData;
  }, [productionData]);

  const yDomain = useMemo(() => {
    const allValues = chartData
      .flatMap(d => [d.production, d.forecast])
      .filter((v): v is number => v !== null && v !== undefined);
    
    if (allValues.length === 0) return [0, 1500];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [chartData]);

  const hasData = chartData.some(d => d.production !== null || d.forecast !== null);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 p-6 card-gradient"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-72 w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-border/50 p-6 card-gradient"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Produção de Petróleo</h3>
          <p className="text-sm text-muted-foreground">Angola - milhares de barris/dia</p>
        </div>
        <div className="flex items-center gap-4">
          <DataDepthBadge startYear={2018} endYear={2025} />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Produção Real</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Previsão IA</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-72 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sem dados de produção disponíveis</p>
            <p className="text-xs mt-1">Adicione dados no painel administrativo</p>
          </div>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="productionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                domain={yDomain}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="production"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                fill="url(#productionGradient)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#forecastGradient)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
