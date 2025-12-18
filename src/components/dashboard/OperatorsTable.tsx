import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductionData } from "@/hooks/useData";
import { useMemo } from "react";

interface Operator {
  name: string;
  blocks: string;
  production: number;
  change: number;
  share: number;
}

const fallbackOperators: Operator[] = [
  { name: "TotalEnergies", blocks: "17, 32", production: 385, change: -2.4, share: 34.2 },
  { name: "ExxonMobil", blocks: "15", production: 245, change: 1.8, share: 21.8 },
  { name: "Chevron", blocks: "0, 14", production: 198, change: -0.5, share: 17.6 },
  { name: "BP", blocks: "18, 31", production: 156, change: 3.2, share: 13.9 },
  { name: "Sonangol EP", blocks: "Diversos", production: 141, change: -1.2, share: 12.5 },
];

export function OperatorsTable() {
  const { data: productionData, isLoading } = useProductionData();

  const operators = useMemo(() => {
    if (!productionData || productionData.length === 0) return fallbackOperators;

    // Group by operator and calculate totals
    const operatorMap = new Map<string, { blocks: Set<string>; totalProduction: number; declineRate: number }>();
    
    productionData.forEach(item => {
      const existing = operatorMap.get(item.operator);
      if (existing) {
        existing.blocks.add(item.block);
        existing.totalProduction += Number(item.daily_production) / 1000; // Convert to kbd
        existing.declineRate = Number(item.decline_rate) || 0;
      } else {
        operatorMap.set(item.operator, {
          blocks: new Set([item.block]),
          totalProduction: Number(item.daily_production) / 1000,
          declineRate: Number(item.decline_rate) || 0,
        });
      }
    });

    const totalProduction = Array.from(operatorMap.values()).reduce((sum, op) => sum + op.totalProduction, 0);

    return Array.from(operatorMap.entries())
      .map(([name, data]) => ({
        name,
        blocks: Array.from(data.blocks).join(", "),
        production: Math.round(data.totalProduction),
        change: -data.declineRate,
        share: totalProduction > 0 ? (data.totalProduction / totalProduction) * 100 : 0,
      }))
      .sort((a, b) => b.production - a.production)
      .slice(0, 5);
  }, [productionData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-border/50 card-gradient overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Operadores</h3>
            <p className="text-sm text-muted-foreground">Produção por operadora</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                Operador
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                Blocos
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                Produção (kbd)
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                Variação
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                Quota
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Carregando dados...
                </td>
              </tr>
            ) : (
              operators.map((operator, index) => (
                <motion.tr
                  key={operator.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{operator.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">Bloco {operator.blocks}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-foreground">{operator.production}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        operator.change >= 0
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {operator.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {operator.change >= 0 ? "+" : ""}
                      {operator.change.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-muted-foreground">{operator.share.toFixed(1)}%</span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
