import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface Insight {
  type: "prediction" | "alert" | "opportunity" | "info";
  title: string;
  description: string;
  confidence: number;
  trend?: "up" | "down";
  impact?: "alto" | "médio" | "baixo";
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictions');

      if (error) throw error;

      if (data?.success && data?.predictions) {
        const predictions = data.predictions;
        
        // Convert predictions to insights format
        const newInsights: Insight[] = [];
        
        // Add prediction insights
        if (predictions.predictions?.brent_30d) {
          const brent = predictions.predictions.brent_30d;
          newInsights.push({
            type: "prediction",
            title: `Brent a $${brent.value.toFixed(0)}-${(brent.value + 4).toFixed(0)} em 30 dias`,
            description: brent.reasoning || "Previsão baseada em análise de mercado",
            confidence: brent.confidence,
            trend: brent.trend,
          });
        }

        // Add AI-generated insights
        if (predictions.insights) {
          predictions.insights.slice(0, 2).forEach((insight: any) => {
            newInsights.push({
              type: insight.type === "alert" ? "alert" : insight.type === "opportunity" ? "opportunity" : "prediction",
              title: insight.title,
              description: insight.description,
              confidence: insight.confidence,
              trend: insight.type === "opportunity" ? "up" : insight.type === "alert" ? "down" : undefined,
              impact: insight.impact,
            });
          });
        }

        setInsights(newInsights.slice(0, 3));
        setLastUpdated(new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
      // Use fallback insights on error
      setInsights([
        {
          type: "prediction",
          title: "Análise em processamento",
          description: "Clique em atualizar para gerar novas previsões com IA",
          confidence: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Insights da IA
                <Sparkles className="w-4 h-4 text-accent" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {lastUpdated ? `Atualizado às ${lastUpdated}` : "Análise em tempo real"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : insights.length > 0 ? (
            insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border transition-all hover:border-primary/50",
                  insight.type === "prediction" && "bg-primary/5 border-primary/20",
                  insight.type === "alert" && "bg-destructive/5 border-destructive/20",
                  insight.type === "opportunity" && "bg-success/5 border-success/20",
                  insight.type === "info" && "bg-accent/5 border-accent/20"
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
                    {insight.type === "info" && (
                      <Brain className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-sm font-medium text-foreground">{insight.title}</span>
                  </div>
                  {insight.confidence > 0 && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {insight.confidence.toFixed(0)}% conf.
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.impact && (
                  <span className={cn(
                    "mt-2 inline-block text-xs px-2 py-0.5 rounded",
                    insight.impact === "alto" && "bg-destructive/20 text-destructive",
                    insight.impact === "médio" && "bg-warning/20 text-warning",
                    insight.impact === "baixo" && "bg-muted text-muted-foreground"
                  )}>
                    Impacto {insight.impact}
                  </span>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Clique em atualizar para gerar insights
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/predictions')}
          className="mt-4 w-full py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          Ver todas as previsões
        </button>
      </div>
    </motion.div>
  );
}
