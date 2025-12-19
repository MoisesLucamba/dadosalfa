import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RiskHistoryData {
  date: string;
  geopolitical: number | null;
  regulatory: number | null;
  fiscal: number | null;
  operational: number | null;
  currency: number | null;
  environmental: number | null;
  global: number | null;
}

const categoryColors: Record<string, string> = {
  geopolitical: "hsl(var(--primary))",
  regulatory: "hsl(var(--accent))",
  fiscal: "hsl(var(--destructive))",
  operational: "hsl(var(--success))",
  currency: "hsl(217, 91%, 60%)",
  environmental: "hsl(142, 71%, 45%)",
  global: "hsl(var(--foreground))",
};

const categoryLabels: Record<string, string> = {
  geopolitical: "Geopolítico",
  regulatory: "Regulatório",
  fiscal: "Fiscal",
  operational: "Operacional",
  currency: "Cambial",
  environmental: "Ambiental",
  global: "Índice Global",
};

const weights: Record<string, number> = {
  geopolitical: 0.25,
  regulatory: 0.2,
  fiscal: 0.2,
  operational: 0.15,
  currency: 0.1,
  environmental: 0.1,
};

export const RiskHistoryChart = () => {
  const [historyData, setHistoryData] = useState<RiskHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["global", "geopolitical", "regulatory"]);

  useEffect(() => {
    fetchHistoryData();
  }, [period]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(period);
      const startDate = subDays(new Date(), daysAgo).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('risk_data')
        .select('category, score, data_date')
        .gte('data_date', startDate)
        .order('data_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Group by date
        const groupedByDate: Record<string, Record<string, number>> = {};

        data.forEach((item) => {
          const date = item.data_date;
          if (!groupedByDate[date]) {
            groupedByDate[date] = {};
          }
          groupedByDate[date][item.category] = item.score;
        });

        // Transform to chart data
        const chartData: RiskHistoryData[] = Object.entries(groupedByDate).map(([date, scores]) => {
          // Calculate global index
          let globalScore = 0;
          let totalWeight = 0;
          Object.entries(scores).forEach(([cat, score]) => {
            const weight = weights[cat] || 0.15;
            globalScore += score * weight;
            totalWeight += weight;
          });
          
          return {
            date,
            geopolitical: scores.geopolitical || null,
            regulatory: scores.regulatory || null,
            fiscal: scores.fiscal || null,
            operational: scores.operational || null,
            currency: scores.currency || null,
            environmental: scores.environmental || null,
            global: totalWeight > 0 ? Math.round(globalScore) : null,
          };
        });

        setHistoryData(chartData);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching risk history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM", { locale: pt });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">
          {format(parseISO(label), "dd 'de' MMMM, yyyy", { locale: pt })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">
                  {categoryLabels[entry.dataKey] || entry.dataKey}
                </span>
              </div>
              <span className="font-medium text-foreground">{entry.value}/100</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border/50 p-6 card-gradient">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Histórico de Evolução de Riscos
          </h3>
          <p className="text-sm text-muted-foreground">Tendência dos indicadores ao longo do tempo</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleCategory(key)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selectedCategories.includes(key)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: categoryColors[key] }}
            />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                stroke="hsl(var(--border))"
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {selectedCategories.includes("global") && (
                <Line
                  type="monotone"
                  dataKey="global"
                  stroke={categoryColors.global}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("geopolitical") && (
                <Line
                  type="monotone"
                  dataKey="geopolitical"
                  stroke={categoryColors.geopolitical}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("regulatory") && (
                <Line
                  type="monotone"
                  dataKey="regulatory"
                  stroke={categoryColors.regulatory}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("fiscal") && (
                <Line
                  type="monotone"
                  dataKey="fiscal"
                  stroke={categoryColors.fiscal}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("operational") && (
                <Line
                  type="monotone"
                  dataKey="operational"
                  stroke={categoryColors.operational}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("currency") && (
                <Line
                  type="monotone"
                  dataKey="currency"
                  stroke={categoryColors.currency}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
              {selectedCategories.includes("environmental") && (
                <Line
                  type="monotone"
                  dataKey="environmental"
                  stroke={categoryColors.environmental}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Sem dados históricos disponíveis</p>
              <p className="text-xs mt-1">Clique em "Atualizar Riscos" para começar a registrar histórico</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend with current values */}
      {historyData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {selectedCategories.map((cat) => {
            const latestValue = historyData[historyData.length - 1]?.[cat as keyof RiskHistoryData];
            const firstValue = historyData[0]?.[cat as keyof RiskHistoryData];
            const change = latestValue && firstValue ? (latestValue as number) - (firstValue as number) : 0;
            
            return (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[cat] }}
                />
                <span className="text-muted-foreground">{categoryLabels[cat]}:</span>
                <span className="font-medium text-foreground">{latestValue || '-'}</span>
                {change !== 0 && (
                  <span className={change > 0 ? "text-destructive" : "text-success"}>
                    ({change > 0 ? '+' : ''}{change})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
