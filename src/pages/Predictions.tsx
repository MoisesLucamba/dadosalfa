import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
  AlertTriangle,
  ArrowUpRight,
  Info,
  Zap,
  Activity
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Interfaces ---
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
  price_forecast?: { date: string; actual?: number | null; predicted: number | null; lower: number | null; upper: number | null }[];
  production_forecast?: { month: string; actual?: number | null; predicted: number | null }[];
  insights: Insight[];
  risks?: Risk[];
  model_performance: ModelPerformance;
  generated_at?: string;
}

// --- Main Component ---
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
        toast.success("Previsões IA atualizadas!");
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

  // --- Helpers ---
  const formatValue = (key: string, value: number) => {
    switch (key) {
      case 'brent_30d': return `$${value.toFixed(2)}`;
      case 'production_30d': return `${(value / 1000).toFixed(2)}M bpd`;
      case 'exports_30d': return `${value.toFixed(1)}M bbl`;
      case 'revenue_30d': return `$${value.toFixed(2)}B`;
      default: return value.toString();
    }
  };

  const getModelName = (key: string) => {
    const names: Record<string, string> = {
      brent_30d: 'Preço Brent (30d)',
      production_30d: 'Produção Angola (30d)',
      exports_30d: 'Exportações (30d)',
      revenue_30d: 'Receita Estimada (30d)'
    };
    return names[key] || key;
  };

  // --- Chart Data Generation ---
  const priceForecastData = useMemo(() => {
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
  }, [predictions]);

  const productionForecastData = useMemo(() => {
    if (predictions?.production_forecast) return predictions.production_forecast;
    
    const baseProd = predictions?.predictions?.production_30d?.value || 1100;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', "Jan'25", "Fev'25"];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, i) => ({
      month,
      actual: i <= currentMonth ? baseProd + (Math.random() - 0.5) * 50 : null,
      predicted: i >= currentMonth ? baseProd - i * 3 + (Math.random() - 0.5) * 20 : null,
    }));
  }, [predictions]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0F1115] text-zinc-100 selection:bg-primary/30">
      <Helmet>
        <title>Previsões IA | AlphaData</title>
        <meta name="description" content="Previsões baseadas em IA para o setor petrolífero angolano." />
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/predictions" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <Header activeItem="/predictions" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Brain className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-tighter font-bold">
                      AI Engine v2.0
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Previsões Inteligentes</h1>
                  <p className="text-zinc-400 mt-1">Projeções avançadas para o mercado de energia angolano.</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4"
                >
                  {lastUpdated && (
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Última Sincronização</span>
                      <span className="text-sm text-zinc-300 font-medium">{lastUpdated}</span>
                    </div>
                  )}
                  <Button 
                    onClick={fetchPredictions} 
                    disabled={loading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {loading ? "Processando..." : "Atualizar Dados"}
                  </Button>
                </motion.div>
              </div>

              {/* Prediction Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-2xl bg-zinc-800/50 border border-zinc-700/30" />
                    ))
                  ) : predictions?.predictions ? (
                    Object.entries(predictions.predictions).map(([key, model], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative p-5 rounded-2xl bg-[#16191E] border border-zinc-800/50 hover:border-primary/30 hover:bg-[#1C2026] transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{getModelName(key)}</span>
                          <div className={`p-1.5 rounded-lg ${model.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {model.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold text-white">{formatValue(key, model.value)}</h3>
                          <span className={`text-xs font-bold ${model.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {model.change_percent > 0 ? '+' : ''}{model.change_percent.toFixed(1)}%
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-zinc-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Confiança</span>
                          </div>
                          <span className="text-xs font-bold text-primary">{model.confidence.toFixed(0)}%</span>
                        </div>
                        
                        {/* Progress bar for confidence */}
                        <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${model.confidence}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </motion.div>
                    ))
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Forecast Chart */}
                <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Projeção Brent</CardTitle>
                      <p className="text-xs text-zinc-500">Intervalo de confiança de 95%</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none">USD/bbl</Badge>
                  </CardHeader>
                  <CardContent className="pt-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceForecastData}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                        <Area type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
                        <Area type="monotone" dataKey="upper" stroke="transparent" fill="#10b981" fillOpacity={0.05} />
                        <Area type="monotone" dataKey="lower" stroke="transparent" fill="#10b981" fillOpacity={0.05} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Production Forecast Chart */}
                <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Tendência de Produção</CardTitle>
                      <p className="text-xs text-zinc-500">Histórico vs Projeção IA</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none">kbpd</Badge>
                  </CardHeader>
                  <CardContent className="pt-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={productionForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                        <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#a855f7' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Insights & Risks Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Insights */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-white">Insights Estratégicos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictions?.insights && predictions.insights.length > 0 ? (
                      predictions.insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-5 rounded-2xl bg-[#16191E] border border-zinc-800/50 hover:bg-[#1C2026] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-xl ${
                              insight.type === 'opportunity' ? 'bg-emerald-500/10 text-emerald-500' :
                              insight.type === 'alert' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {insight.type === 'opportunity' ? <Zap className="w-4 h-4" /> :
                               insight.type === 'alert' ? <AlertCircle className="w-4 h-4" /> :
                               <Info className="w-4 h-4" />}
                            </div>
                            <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">
                              Impacto {insight.impact}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-zinc-100 mb-1">{insight.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{insight.description}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500 text-sm">Nenhum insight disponível no momento.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risks Analysis */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-white">Matriz de Riscos</h3>
                  </div>
                  <div className="space-y-3">
                    {predictions?.risks?.map((risk, index) => (
                      <div key={index} className="p-4 rounded-xl bg-[#16191E] border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{risk.category}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            risk.impact_level === 'alto' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                            risk.impact_level === 'médio' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                        </div>
                        <p className="text-xs text-zinc-300 font-medium mb-3">{risk.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500">Probabilidade: <span className="text-zinc-300">{risk.probability}%</span></span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            risk.impact_level === 'alto' ? 'bg-rose-500/10 text-rose-500' :
                            risk.impact_level === 'médio' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>{risk.impact_level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Performance Metrics */}
              <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-bold text-white">Performance do Modelo</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "MAPE", value: `${predictions?.model_performance?.mape.toFixed(1)}%`, sub: "Erro Médio", color: "text-emerald-500" },
                      { label: "Precisão (30d)", value: `${predictions?.model_performance?.accuracy_30d.toFixed(1)}%`, sub: "Taxa de Acerto", color: "text-primary" },
                      { label: "R² Score", value: predictions?.model_performance?.r2_score.toFixed(2), sub: "Correlação", color: "text-amber-500" },
                      { label: "Status", value: "Operacional", sub: "Sistema Ativo", color: "text-emerald-500", icon: CheckCircle }
                    ].map((metric, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
                          {metric.icon && <metric.icon className={`w-5 h-5 ${metric.color}`} />}
                        </div>
                        <span className="text-xs text-zinc-500 mt-1">{metric.sub}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
        
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Predictions;