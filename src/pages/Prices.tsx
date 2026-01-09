import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Globe,
  BarChart3,
  Zap
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
  BarChart,
  Bar,
  Cell,
} from "recharts";

const brentHistoryData = [
  { date: "Jan", price: 82.5, volume: 125 },
  { date: "Fev", price: 79.8, volume: 118 },
  { date: "Mar", price: 81.2, volume: 132 },
  { date: "Abr", price: 84.6, volume: 145 },
  { date: "Mai", price: 78.3, volume: 128 },
  { date: "Jun", price: 76.9, volume: 115 },
  { date: "Jul", price: 80.1, volume: 138 },
  { date: "Ago", price: 77.5, volume: 122 },
  { date: "Set", price: 75.8, volume: 108 },
  { date: "Out", price: 78.2, volume: 135 },
  { date: "Nov", price: 78.5, volume: 142 },
];

const crudeComparison = [
  { name: "Brent", price: 78.45, change: 1.8, color: "hsl(var(--primary))" },
  { name: "WTI", price: 74.12, change: 1.5, color: "hsl(var(--accent))" },
  { name: "Cabinda", price: 76.82, change: 1.9, color: "hsl(var(--success))" },
  { name: "Girassol", price: 77.18, change: 2.1, color: "#8b5cf6" },
  { name: "Dalia", price: 76.95, change: 1.7, color: "#f59e0b" },
  { name: "Nemba", price: 76.40, change: 1.4, color: "#ec4899" },
];

const spreadData = [
  { date: "Nov 1", brentWti: 4.2, cabindaBrent: -1.8 },
  { date: "Nov 5", brentWti: 4.5, cabindaBrent: -1.6 },
  { date: "Nov 10", brentWti: 4.1, cabindaBrent: -1.9 },
  { date: "Nov 15", brentWti: 4.3, cabindaBrent: -1.7 },
  { date: "Nov 20", brentWti: 4.4, cabindaBrent: -1.5 },
];

const opecNews = [
  {
    date: "15 Nov 2024",
    title: "OPEP+ mantém cortes de produção até Q1 2025",
    impact: "positivo",
    description: "Decisão apoia preços a curto prazo, beneficiando exportadores africanos.",
  },
  {
    date: "12 Nov 2024",
    title: "Arábia Saudita sinaliza extensão de cortes voluntários",
    impact: "positivo",
    description: "Redução adicional de 1M bpd pode elevar Brent acima de $80.",
  },
  {
    date: "8 Nov 2024",
    title: "Rússia cumpre parcialmente quotas de produção",
    impact: "neutro",
    description: "Incerteza sobre compliance total pode limitar ganhos de preço.",
  },
  {
    date: "5 Nov 2024",
    title: "Demanda chinesa abaixo das expectativas",
    impact: "negativo",
    description: "Crescimento económico lento na China pressiona demanda global.",
  },
];

const volatilityData = [
  { period: "1 Semana", value: 12.5 },
  { period: "1 Mês", value: 18.2 },
  { period: "3 Meses", value: 22.8 },
  { period: "6 Meses", value: 28.4 },
  { period: "1 Ano", value: 32.1 },
];

const Prices = () => {
  return (
    <>
      <Helmet>
        <title>Preços & Mercado | AlphaData</title>
        <meta
          name="description"
          content="Análise de preços do petróleo, spreads entre benchmarks e impacto das decisões da OPEP+ no mercado angolano."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/prices" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/prices" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Preços & Mercado</h1>
                  <p className="text-muted-foreground">Benchmarks, spreads e análise de mercado</p>
                </div>
                <DataExportButton
                  data={brentHistoryData.map(d => ({
                    ...d,
                    date: `2024-${String(brentHistoryData.indexOf(d) + 1).padStart(2, '0')}-01`
                  }))}
                  columns={[
                    { key: 'date', header: 'Data' },
                    { key: 'price', header: 'Preço (USD)' },
                    { key: 'volume', header: 'Volume' },
                  ]}
                  filename="precos_brent"
                  dateField="date"
                />
              </motion.div>

              {/* Price Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Brent Crude"
                  value="$78.45"
                  change={1.8}
                  changeLabel="vs. ontem"
                  icon={<DollarSign className="w-5 h-5" />}
                  variant="accent"
                  delay={0}
                />
                <KPICard
                  title="WTI Crude"
                  value="$74.12"
                  change={1.5}
                  changeLabel="vs. ontem"
                  icon={<DollarSign className="w-5 h-5" />}
                  delay={0.05}
                />
                <KPICard
                  title="Spread Brent-WTI"
                  value="$4.33"
                  change={0.3}
                  changeLabel="vs. média 30d"
                  icon={<Activity className="w-5 h-5" />}
                  variant="primary"
                  delay={0.1}
                />
                <KPICard
                  title="Volatilidade 30d"
                  value="18.2%"
                  change={-2.1}
                  changeLabel="vs. mês anterior"
                  icon={<Zap className="w-5 h-5" />}
                  delay={0.15}
                />
              </div>

              {/* Brent Price History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Histórico Brent Crude</h3>
                    <p className="text-sm text-muted-foreground">Preço e volume negociado (2024)</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Preço</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent/50" />
                      <span className="text-muted-foreground">Volume</span>
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={brentHistoryData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="price" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[70, 90]} />
                      <YAxis yAxisId="volume" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        yAxisId="price"
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--primary))"
                        fill="url(#priceGradient)"
                        strokeWidth={2}
                      />
                      <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--accent))" opacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Crude Comparison & Spreads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crude Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Comparativo de Crudes</h3>
                      <p className="text-sm text-muted-foreground">Preços e variação diária</p>
                    </div>
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {crudeComparison.map((crude, index) => (
                      <motion.div
                        key={crude.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: crude.color }} />
                          <span className="font-medium text-foreground">{crude.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-foreground">${crude.price}</span>
                          <span className={`flex items-center gap-1 text-sm font-medium ${
                            crude.change >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {crude.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {crude.change >= 0 ? '+' : ''}{crude.change}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Spreads Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Spreads de Referência</h3>
                      <p className="text-sm text-muted-foreground">Brent-WTI e Cabinda-Brent</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spreadData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[-3, 6]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="brentWti"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                          name="Brent-WTI"
                        />
                        <Line
                          type="monotone"
                          dataKey="cabindaBrent"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
                          name="Cabinda-Brent"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Brent-WTI: +$4.33</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Cabinda-Brent: -$1.63</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* OPEC News & Volatility */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* OPEC+ News */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="lg:col-span-2 rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Impacto OPEP+</h3>
                      <p className="text-sm text-muted-foreground">Decisões e análise de mercado</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {opecNews.map((news, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground">{news.title}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            news.impact === 'positivo' ? 'bg-success/20 text-success' :
                            news.impact === 'negativo' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {news.impact}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{news.description}</p>
                        <span className="text-xs text-muted-foreground">{news.date}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Volatility */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Volatilidade</h3>
                      <p className="text-sm text-muted-foreground">Índice por período</p>
                    </div>
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-4">
                    {volatilityData.map((item, index) => (
                      <motion.div
                        key={item.period}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.period}</span>
                          <span className="font-medium text-foreground">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / 40) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.55 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              item.value > 25 ? 'bg-destructive' :
                              item.value > 15 ? 'bg-accent' : 'bg-success'
                            }`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* What-If Simulator */}
              <WhatIfSimulator />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Prices;
