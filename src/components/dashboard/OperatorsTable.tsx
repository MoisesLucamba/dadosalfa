import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Operator {
  name: string;
  blocks: string;
  production: number;
  change: number;
  share: number;
}

const operators: Operator[] = [
  { name: "TotalEnergies", blocks: "17, 32", production: 385, change: -2.4, share: 34.2 },
  { name: "ExxonMobil", blocks: "15", production: 245, change: 1.8, share: 21.8 },
  { name: "Chevron", blocks: "0, 14", production: 198, change: -0.5, share: 17.6 },
  { name: "BP", blocks: "18, 31", production: 156, change: 3.2, share: 13.9 },
  { name: "Sonangol EP", blocks: "Diversos", production: 141, change: -1.2, share: 12.5 },
];

export function OperatorsTable() {
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
            {operators.map((operator, index) => (
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
                    {operator.change}%
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-muted-foreground">{operator.share}%</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
