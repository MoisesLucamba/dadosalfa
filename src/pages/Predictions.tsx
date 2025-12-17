import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target,
  Sparkles,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
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

const pricePredictionData = [
  { date: "Nov 1", actual: 78.2, predicted: null, lower: null, upper: null },
  { date: "Nov 5", actual: 77.8, predicted: null, lower: null, upper: null },
  { date: "Nov 10", actual: 78.5, predicted: null, lower: null, upper: null },
  { date: "Nov 15", actual: 79.1, predicted: null, lower: null, upper: null },
  { date: "Nov 20", actual: 78.4, predicted: null, lower: null, upper: null },
  { date: "Nov 25", actual: null, predicted: 79.2, lower: 77.5, upper: 81.0 },
  { date: "Nov 30", actual: null, predicted: 80.1, lower: 78.0, upper: 82.5 },
  { date: "Dez 5", actual: null, predicted: 79.8, lower: 77.2, upper: 82.8 },
  { date: "Dez 10", actual: null, predicted: 80.5, lower: 77.8, upper: 83.5 },
  { date: "Dez 15", actual: null, predicted: 81.2, lower: 78.5, upper: 84.2 },
];

const productionPredictionData = [
  { month: "Jan", actual: 1120, predicted: null },
  { month: "Fev", actual: 1098, predicted: null },
  { month: "Mar", actual: 1085, predicted: null },
  { month: "Abr", actual: 1110, predicted: null },
  { month: "Mai", actual: 1075, predicted: null },
  { month: "Jun", actual: 1092, predicted: null },
  { month: "Jul", actual: 1065, predicted: null },
  { month: "Ago", actual: 1088, predicted: null },
  { month: "Set", actual: 1070, predicted: null },
  { month: "Out", actual: 1095, predicted: null },
  { month: "Nov", actual: 1080, predicted: 1080 },
  { month: "Dez", actual: null, predicted: 1065 },
  { month: "Jan'25", actual: null, predicted: 1058 },
  { month: "Fev'25", actual: null, predicted: 1052 },
];

const predictionModels = [
  {
    name: "Preço Brent (30d)",
    prediction: "$80.5",
    confidence: 87,
    trend: "up",
    change: "+2.6%",
    lastUpdated: "há 2 horas",
  },
  {
    name: "Produção Angola (30d)",
    prediction: "1.065M bpd",
    confidence: 82,
    trend: "down",
    change: "-1.4%",
    lastUpdated: "há 3 horas",
  },
  {
    name: "Exportações (30d)",
    prediction: "44.8M bbl",
    confidence: 79,
    trend: "down",
    change: "-2.6%",
    lastUpdated: "há 4 horas",
  },
  {
    name: "Receita Estimada (30d)",
    prediction: "$3.5B",
    confidence: 75,
    trend: "up",
    change: "+1.2%",
    lastUpdated: "há 5 horas",
  },
];

const aiInsights = [
  {
    type: "alert",
    title: "Risco de Queda de Produção",
    description: "Manutenção programada no Bloco 17 pode reduzir produção em 50K bpd na próxima semana.",
    confidence: 91,
    impact: "alto",
  },
  {
    type: "opportunity",
    title: "Oportunidade de Preço",
    description: "Tensões geopolíticas no Médio Oriente podem elevar preços do Brent acima de $82 nos próximos 15 dias.",
    confidence: 78,
    impact: "médio",
  },
  {
    type: "info",
    title: "Tendência de Demanda China",
    description: "Indicadores económicos chineses sugerem aumento de 3% na demanda por crude angolano no Q1 2025.",
    confidence: 72,
    impact: "médio",
  },
];

const Predictions = () => {
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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">Previsões IA</h1>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </span>
                </div>
                <p className="text-muted-foreground">Projeções 30/60/90 dias com intervalos de confiança</p>
              </motion.div>

              {/* Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {predictionModels.map((model, index) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-border/50 p-4 card-gradient relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{model.name}</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-2xl font-bold text-foreground">{model.prediction}</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        model.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}>
                        {model.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {model.change}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Confiança: {model.confidence}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{model.lastUpdated}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${model.confidence}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                  </motion.div>
                ))}
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pricePredictionData}>
                      <defs>
                        <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[75, 85]} />
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
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={productionPredictionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[1000, 1150]} />
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
                    {aiInsights.map((insight, index) => (
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
                                'bg-accent/20 text-accent'
                              }`}>
                                Impacto {insight.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Model Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Performance dos Modelos</h3>
                    <p className="text-sm text-muted-foreground">Métricas de precisão das previsões</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Última atualização: há 2 horas</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { metric: "MAPE", value: "4.2%", description: "Erro Médio Absoluto", status: "good" },
                    { metric: "Acurácia 7d", value: "92%", description: "Previsões corretas", status: "good" },
                    { metric: "Acurácia 30d", value: "85%", description: "Previsões corretas", status: "medium" },
                    { metric: "R² Score", value: "0.89", description: "Coeficiente de determinação", status: "good" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.metric}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="text-center p-4 rounded-lg bg-secondary/30"
                    >
                      <div className={`text-2xl font-bold mb-1 ${
                        item.status === 'good' ? 'text-success' : 'text-accent'
                      }`}>
                        {item.value}
                      </div>
                      <div className="text-sm font-medium text-foreground">{item.metric}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </motion.div>
                  ))}
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
