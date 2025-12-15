import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "prediction" | "alert" | "opportunity";
  title: string;
  description: string;
  confidence: number;
  trend?: "up" | "down";
}

const insights: Insight[] = [
  {
    id: "1",
    type: "prediction",
    title: "Brent a $78-82 em 30 dias",
    description: "Modelo prevê estabilização com viés de alta devido à decisão OPEP+",
    confidence: 87,
    trend: "up",
  },
  {
    id: "2",
    type: "alert",
    title: "Produção do Bloco 17 em declínio",
    description: "Taxa de declínio acelerada detectada. Recomenda-se análise técnica.",
    confidence: 92,
    trend: "down",
  },
  {
    id: "3",
    type: "opportunity",
    title: "Janela de exportação favorável",
    description: "Spread Brent-Cabinda em máxima de 6 meses. Oportunidade de arbitragem.",
    confidence: 78,
  },
];

export function AIInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-primary/30 p-6 card-gradient relative overflow-hidden"
    >
      {/* AI Glow Effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Insights da IA
              <Sparkles className="w-4 h-4 text-accent" />
            </h3>
            <p className="text-sm text-muted-foreground">Análise em tempo real</p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border transition-all hover:border-primary/50",
                insight.type === "prediction" && "bg-primary/5 border-primary/20",
                insight.type === "alert" && "bg-destructive/5 border-destructive/20",
                insight.type === "opportunity" && "bg-success/5 border-success/20"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {insight.type === "prediction" && insight.trend === "up" && (
                    <TrendingUp className="w-4 h-4 text-success" />
                  )}
                  {insight.type === "prediction" && insight.trend === "down" && (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  {insight.type === "alert" && (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  {insight.type === "opportunity" && (
                    <Sparkles className="w-4 h-4 text-success" />
                  )}
                  <span className="text-sm font-medium text-foreground">{insight.title}</span>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {insight.confidence}% conf.
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </motion.div>
          ))}
        </div>

        <button className="mt-4 w-full py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
          Ver todas as previsões
        </button>
      </div>
    </motion.div>
  );
}
