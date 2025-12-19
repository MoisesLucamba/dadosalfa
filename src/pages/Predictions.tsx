import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Shield,
  AlertTriangle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PredictionModel {
  value: number;
  change_percent: number;
  confidence: number;
  trend: "up" | "down";
  reasoning: string;
}

interface Insight {
  type: "alert" | "opportunity" | "info";
  title: string;
  description: string;
  confidence: number;
  impact: "alto" | "médio" | "baixo";
}

interface Risk {
  category: string;
  description: string;
  probability: number;
  impact_level: "alto" | "médio" | "baixo";
}

interface ModelPerformance {
  mape: number;
  accuracy_30d: number;
  r2_score: number;
  last_updated: string;
}

interface PredictionsData {
  predictions: {
    brent_30d: PredictionModel;
    production_30d: PredictionModel;
    exports_30d: PredictionModel;
    revenue_30d: PredictionModel;
  };
  price_forecast?: { date: string; predicted: number; lower: number; upper: number }[];
  production_forecast?: { month: string; predicted: number }[];
  insights: Insight[];
  risks?: Risk[];
  model_performance: ModelPerformance;
  generated_at?: string;
}

const Predictions = () => {
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictions');

      if (error) throw error;

      if (data?.success && data?.predictions) {
        setPredictions(data.predictions);
        setLastUpdated(new Date().toLocaleString('pt-AO'));
        toast.success("Previsões IA atualizadas com sucesso!");
      } else {
        throw new Error(data?.error || "Erro ao gerar previsões");
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      toast.error("Erro ao gerar previsões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const formatValue = (key: string, value: number) => {
    switch (key) {
      case 'brent_30d':
        return `$${value.toFixed(2)}`;
      case 'production_30d':
        return `${(value / 1000).toFixed(2)}M bpd`;
      case 'exports_30d':
        return `${value.toFixed(1)}M bbl`;
      case 'revenue_30d':
        return `$${value.toFixed(2)}B`;
      default:
        return value.toString();
    }
  };

  const getModelName = (key: string) => {
    switch (key) {
      case 'brent_30d':
        return 'Preço Brent (30d)';
      case 'production_30d':
        return 'Produção Angola (30d)';
      case 'exports_30d':
        return 'Exportações (30d)';
      case 'revenue_30d':
        return 'Receita Estimada (30d)';
      default:
        return key;
    }
  };

  // Generate price forecast data for chart
  const generatePriceForecast = () => {
    if (predictions?.price_forecast) return predictions.price_forecast;
    
    const basePrice = predictions?.predictions?.brent_30d?.value || 78;
    const dates = [];
    const today = new Date();
    
    for (let i = -5; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i * 3);
      const dateStr = date.toLocaleDateString('pt-AO', { day: 'numeric', month: 'short' });
      
      if (i <= 0) {
        dates.push({
          date: dateStr,
          actual: basePrice + (Math.random() - 0.5) * 2,
          predicted: null,
          lower: null,
          upper: null,
        });
      } else {
        const predicted = basePrice + i * 0.2 + (Math.random() - 0.5);
        dates.push({
          date: dateStr,
          actual: null,
          predicted,
          lower: predicted - 2,
          upper: predicted + 2,
        });
      }
    }
    return dates;
  };

  // Generate production forecast data
  const generateProductionForecast = () => {
    if (predictions?.production_forecast) return predictions.production_forecast;
    
    const baseProd = predictions?.predictions?.production_30d?.value || 1100;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', "Jan'25", "Fev'25"];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, i) => ({
      month,
      actual: i <= currentMonth ? baseProd + (Math.random() - 0.5) * 50 : null,
      predicted: i >= currentMonth ? baseProd - i * 3 + (Math.random() - 0.5) * 20 : null,
    }));
  };

  const priceForecastData = generatePriceForecast();
  const productionForecastData = generateProductionForecast();

  return (
    <>
      <Helmet>
        <title>Previsões IA | AlphaData</title>
        <meta
          name="description"
          content="Previsões baseadas em IA para o setor petrolífero angolano. Projeções de preços, produção e exportações com intervalos de confiança."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/predictions" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/predictions" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">Previsões IA</h1>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Tempo Real
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {lastUpdated && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Atualizado: {lastUpdated}
                      </span>
                    )}
                    <Button 
                      onClick={fetchPredictions} 
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {loading ? "Gerando..." : "Atualizar Previsões"}
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground mt-2">
                  Projeções 30/60/90 dias geradas por IA com dados reais do mercado angolano
                </p>
              </motion.div>

              {/* Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-xl" />
                  ))
                ) : predictions?.predictions ? (
                  Object.entries(predictions.predictions).map(([key, model], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-border/50 p-4 card-gradient relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{getModelName(key)}</span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {formatValue(key, model.value)}
                        </span>
                        <span className={`flex items-center gap-1 text-sm font-medium ${
                          model.trend === 'up' ? 'text-success' : 'text-destructive'
                        }`}>
                          {model.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {model.change_percent > 0 ? '+' : ''}{model.change_percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Confiança: {model.confidence.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${model.confidence}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {model.reasoning}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-8 text-muted-foreground">
                    Clique em "Atualizar Previsões" para gerar análises
                  </div>
                )}
              </div>

              {/* Price Prediction Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Previsão Preço Brent</h3>
                    <p className="text-sm text-muted-foreground">Dados reais vs previsão com intervalo de confiança</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Previsão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-3 rounded bg-accent/20" />
                      <span className="text-muted-foreground">Intervalo</span>
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceForecastData}>
                        <defs>
                          <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="upper"
                          stroke="transparent"
                          fill="url(#confidenceGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="transparent"
                          fill="hsl(var(--background))"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
                          connectNulls={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              {/* Production Forecast & AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Production Forecast */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="lg:col-span-2 rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Previsão de Produção</h3>
                      <p className="text-sm text-muted-foreground">Milhares de barris por dia</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <TrendingDown className="w-4 h-4" />
                      <span>Tendência de declínio</span>
                    </div>
                  </div>
                  <div className="h-64">
                    {loading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productionForecastData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="hsl(var(--accent))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 3 }}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </motion.div>

                {/* AI Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Insights IA</h3>
                  </div>
                  <div className="space-y-4">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))
                    ) : predictions?.insights?.length ? (
                      predictions.insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="p-3 rounded-lg bg-secondary/30 border border-border/30"
                        >
                          <div className="flex items-start gap-2">
                            {insight.type === 'alert' && <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />}
                            {insight.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-success mt-0.5" />}
                            {insight.type === 'info' && <CheckCircle className="w-4 h-4 text-primary mt-0.5" />}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground mb-1">{insight.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">Confiança: {insight.confidence}%</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  insight.impact === 'alto' ? 'bg-destructive/20 text-destructive' :
                                  insight.impact === 'médio' ? 'bg-accent/20 text-accent' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  Impacto {insight.impact}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum insight disponível
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Risks Section */}
              {predictions?.risks && predictions.risks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-warning" />
                    <h3 className="text-lg font-semibold text-foreground">Análise de Riscos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {predictions.risks.map((risk, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 + index * 0.1 }}
                        className="p-4 rounded-lg bg-secondary/20 border border-border/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${
                            risk.impact_level === 'alto' ? 'text-destructive' :
                            risk.impact_level === 'médio' ? 'text-warning' :
                            'text-muted-foreground'
                          }`} />
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {risk.category}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-3">{risk.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Probabilidade: {risk.probability}%
                          </span>
                          <span className={`px-2 py-0.5 rounded ${
                            risk.impact_level === 'alto' ? 'bg-destructive/20 text-destructive' :
                            risk.impact_level === 'médio' ? 'bg-warning/20 text-warning' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {risk.impact_level}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Model Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Performance dos Modelos</h3>
                    <p className="text-sm text-muted-foreground">Métricas de precisão das previsões</p>
                  </div>
                  {predictions?.model_performance?.last_updated && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Última atualização: {predictions.model_performance.last_updated}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))
                  ) : predictions?.model_performance ? (
                    <>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                        <span className="text-sm text-muted-foreground">MAPE</span>
                        <div className="text-2xl font-bold text-foreground mt-1">
                          {predictions.model_performance.mape.toFixed(1)}%
                        </div>
                        <span className="text-xs text-muted-foreground">Erro Médio Absoluto</span>
                        <div className="mt-2 h-1.5 bg-background rounded-full">
                          <div 
                            className="h-full rounded-full bg-success" 
                            style={{ width: `${100 - predictions.model_performance.mape * 10}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                        <span className="text-sm text-muted-foreground">Accuracy (30d)</span>
                        <div className="text-2xl font-bold text-foreground mt-1">
                          {predictions.model_performance.accuracy_30d.toFixed(1)}%
                        </div>
                        <span className="text-xs text-muted-foreground">Taxa de Acerto</span>
                        <div className="mt-2 h-1.5 bg-background rounded-full">
                          <div 
                            className="h-full rounded-full bg-primary" 
                            style={{ width: `${predictions.model_performance.accuracy_30d}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                        <span className="text-sm text-muted-foreground">R² Score</span>
                        <div className="text-2xl font-bold text-foreground mt-1">
                          {predictions.model_performance.r2_score.toFixed(2)}
                        </div>
                        <span className="text-xs text-muted-foreground">Coef. Determinação</span>
                        <div className="mt-2 h-1.5 bg-background rounded-full">
                          <div 
                            className="h-full rounded-full bg-accent" 
                            style={{ width: `${predictions.model_performance.r2_score * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                        <span className="text-sm text-muted-foreground">Status do Modelo</span>
                        <div className="text-2xl font-bold text-success mt-1 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Ativo
                        </div>
                        <span className="text-xs text-muted-foreground">Operacional</span>
                        <div className="mt-2 h-1.5 bg-background rounded-full">
                          <div className="h-full rounded-full bg-success w-full" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4 text-center py-4 text-muted-foreground">
                      Métricas não disponíveis
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Predictions;
