import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
  Zap,
  ChevronRight,
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
  BarChart,
  Bar,
  Cell,
} from "recharts";

/**
 * Modernização com Deep Dark Mode Fixo:
 * 1. Cores Hardcoded: Substituição de 'bg-background' e 'text-foreground' por valores hexadecimais (#050505, #ffffff).
 * 2. Estética "Onyx": Uso de tons de cinza extremamente escuros para cartões (#0a0a0a).
 * 3. Bordas de Baixo Contraste: Uso de 'rgba(255,255,255,0.05)' para um look minimalista.
 * 4. Foco em Dados: Gráficos com grids quase invisíveis e tooltips flutuantes modernos.
 */

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
  { name: "Brent", price: 78.45, change: 1.8, color: "#3b82f6" },
  { name: "WTI", price: 74.12, change: 1.5, color: "#06b6d4" },
  { name: "Cabinda", price: 76.82, change: 1.9, color: "#10b981" },
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

// Tooltip Moderno Fixo (Ignora Light Mode do Sistema)
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-xs font-medium text-white/70">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-white">${entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Prices = () => {
  return (
    <>
      <Helmet>
        <title>Preços & Mercado | AlphaData</title>
      </Helmet>

      {/* Container Principal com Cor Fixa #050505 */}
      <div className="flex h-screen bg-[#050505] text-white/90 overflow-hidden font-sans selection:bg-primary/30">
        <Sidebar activeItem="/prices" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/prices" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 lg:pb-8 scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header de Página Modernizado */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between flex-wrap gap-6 border-b border-white/5 pb-8"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.2em]">
                    <Globe className="w-3 h-3 animate-spin-slow" />
                    Global Market Intelligence
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-white">
                    Preços & Mercado
                  </h1>
                  <p className="text-white/40 font-medium">
                    Benchmarks globais e análise de spreads para o crude angolano.
                  </p>
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

              {/* Price Cards - Cores Fixas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Brent Crude", value: "$78.45", change: 1.8, icon: <DollarSign />, color: "#3b82f6" },
                  { title: "WTI Crude", value: "$74.12", change: 1.5, icon: <DollarSign />, color: "#06b6d4" },
                  { title: "Spread B-W", value: "$4.33", change: 0.3, icon: <Activity />, color: "#10b981" },
                  { title: "Volatilidade", value: "18.2%", change: -2.1, icon: <Zap />, color: "#f59e0b" }
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl group hover:border-white/10 transition-all cursor-default"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform" style={{ color: kpi.color }}>
                        {kpi.icon}
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-black ${kpi.change >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">{kpi.title}</h3>
                    <div className="text-2xl font-black text-white">{kpi.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Brent History Chart - Deep Dark Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8">
                   <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                        <span className="text-[10px] font-bold text-white/50 uppercase">Preço</span>
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <span className="text-[10px] font-bold text-white/50 uppercase">Volume</span>
                      </div>
                   </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-xl font-black text-white tracking-tight">Histórico Brent Crude</h3>
                  <p className="text-sm text-white/40">Análise de preço vs liquidez de mercado</p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={brentHistoryData}>
                      <defs>
                        <linearGradient id="priceGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.02} strokeDasharray="4 4" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="price" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}
                        domain={[70, 90]} 
                      />
                      <Tooltip content={<ModernTooltip />} />
                      <Area
                        yAxisId="price"
                        type="monotone"
                        dataKey="price"
                        name="Brent"
                        stroke="#3b82f6"
                        fill="url(#priceGlow)"
                        strokeWidth={4}
                        animationDuration={2500}
                      />
                      <Bar yAxisId="price" dataKey="volume" fill="white" fillOpacity={0.05} radius={[4, 4, 0, 0]} barSize={20} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Grid Secundário */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Crude Comparison - List Style */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-white">Benchmarks</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Comparativo em Tempo Real</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white/40" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {crudeComparison.map((crude, index) => (
                      <div
                        key={crude.name}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-white/20 border border-white/5 group-hover:text-white transition-colors">
                            {crude.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{crude.name}</div>
                            <div className="text-[10px] text-white/30 uppercase font-black tracking-tighter">Spot Price</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-white">${crude.price}</div>
                          <div className={`text-[10px] font-black ${crude.change >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {crude.change >= 0 ? '▲' : '▼'} {crude.change}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Spreads Chart - Modern Line */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col"
                >
                  <div className="mb-8">
                    <h3 className="text-lg font-black text-white">Spreads de Referência</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Diferenciais de Mercado</p>
                  </div>

                  <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spreadData}>
                        <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.02} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                          domain={[-3, 6]} 
                        />
                        <Tooltip content={<ModernTooltip />} />
                        <Line
                          type="stepAfter"
                          dataKey="brentWti"
                          name="Brent-WTI"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="cabindaBrent"
                          name="Cabinda-Brent"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-3 rounded-2xl bg-[#3b82f6]/5 border border-[#3b82f6]/10">
                      <div className="text-[10px] font-black text-[#3b82f6] uppercase mb-1">Brent-WTI</div>
                      <div className="text-lg font-black text-white">+$4.33</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f59e0b]/5 border border-[#f59e0b]/10">
                      <div className="text-[10px] font-black text-[#f59e0b] uppercase mb-1">Cabinda-B</div>
                      <div className="text-lg font-black text-white">-$1.63</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* OPEC News & Volatility */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* OPEC+ News - Card Style */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-2 space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-white tracking-tight">Impacto OPEP+</h3>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Latest Updates</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opecNews.map((news, index) => (
                      <div
                        key={index}
                        className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-white/20" />
                            <span className="text-[10px] font-bold text-white/30 uppercase">{news.date}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${
                            news.impact === 'positivo' ? 'bg-[#10b981]/10 text-[#10b981]' :
                            news.impact === 'negativo' ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                            'bg-white/5 text-white/40'
                          }`}>
                            {news.impact}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2 group-hover:text-[#3b82f6] transition-colors line-clamp-1">{news.title}</h4>
                        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{news.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Volatility - Minimalist Bars */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-white">Volatilidade</h3>
                    <Zap className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  
                  <div className="space-y-6">
                    {volatilityData.map((item, index) => (
                      <div key={item.period} className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/30">{item.period}</span>
                          <span className="text-white">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / 40) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              item.value > 25 ? 'bg-[#ef4444]' :
                              item.value > 15 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <div className="text-[10px] font-black text-white/20 uppercase mb-1">Média do Sector</div>
                    <div className="text-xl font-black text-white">21.4%</div>
                  </div>
                </motion.div>
              </div>

              {/* What-If Simulator - Estilo Deep Dark */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <WhatIfSimulator />
              </div>
            </div>
          </main>
        </div>
        
        <MobileBottomNav />
      </div>
    </>
  );
};

export default Prices;