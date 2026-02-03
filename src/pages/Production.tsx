import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import { 
  BarChart3, 
  TrendingDown, 
  Factory, 
  Gauge,
  Droplets,
  MapPin,
  ChevronRight,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Modernização do Design:
 * 1. Deep Dark Mode: Uso de tons de cinza mais profundos (#0a0a0a, #111111) para reduzir o cansaço visual.
 * 2. Glassmorphism: Efeitos de desfoque e bordas sutis para maior profundidade.
 * 3. Micro-interações: Framer Motion para transições suaves.
 * 4. Hierarquia Visual: Tipografia e espaçamento otimizados para leitura intuitiva.
 */

const productionTrendData = [
  { month: "Jan", production: 1120, capacity: 1350 },
  { month: "Fev", production: 1098, capacity: 1350 },
  { month: "Mar", production: 1085, capacity: 1350 },
  { month: "Abr", production: 1110, capacity: 1350 },
  { month: "Mai", production: 1075, capacity: 1350 },
  { month: "Jun", production: 1092, capacity: 1350 },
  { month: "Jul", production: 1065, capacity: 1350 },
  { month: "Ago", production: 1088, capacity: 1350 },
  { month: "Set", production: 1070, capacity: 1350 },
  { month: "Out", production: 1095, capacity: 1350 },
  { month: "Nov", production: 1080, capacity: 1350 },
  { month: "Dez", production: 1078, capacity: 1350 },
];

const operatorProductionData = [
  { name: "TotalEnergies", production: 285, color: "hsl(var(--primary))" },
  { name: "Chevron", production: 198, color: "hsl(var(--accent))" },
  { name: "Sonangol EP", production: 175, color: "hsl(var(--success))" },
  { name: "ENI Angola", production: 168, color: "#8b5cf6" },
  { name: "BP Angola", production: 145, color: "#f59e0b" },
  { name: "Outros", production: 109, color: "hsl(var(--muted-foreground))" },
];

const blockProductionData = [
  { block: "Bloco 17", production: 320, operator: "TotalEnergies", trend: -1.2 },
  { block: "Bloco 0", production: 210, operator: "Chevron", trend: 0.8 },
  { block: "Bloco 15", production: 185, operator: "ENI Angola", trend: -2.5 },
  { block: "Bloco 18", production: 165, operator: "BP Angola", trend: 1.1 },
  { block: "Bloco 31", production: 142, operator: "BP Angola", trend: -0.5 },
  { block: "Bloco 32", production: 128, operator: "TotalEnergies", trend: 2.3 },
];

const fieldStatusData = [
  { name: "Produzindo", value: 45, color: "hsl(var(--success))" },
  { name: "Desenvolvimento", value: 12, color: "hsl(var(--primary))" },
  { name: "Exploração", value: 8, color: "hsl(var(--accent))" },
  { name: "Manutenção", value: 5, color: "hsl(var(--muted-foreground))" },
];

// Componente customizado para o Tooltip dos gráficos para garantir o Deep Dark Mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f0f]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl">
        <p className="text-xs font-medium text-white/50 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-sm font-semibold text-white">
              {entry.name}: {entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Production = () => {
  return (
    <>
      <Helmet>
        <title>Produção Petrolífera | AlphaData</title>
        <meta
          name="description"
          content="Dados de produção petrolífera de Angola por bloco, operadora e campo. Análise de tendências e taxas de declínio."
        />
      </Helmet>

      {/* Background base com tom Deep Dark */}
      <div className="flex h-screen bg-[#050505] text-white/90 overflow-hidden font-sans">
        <Sidebar activeItem="/production" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/production" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 lg:pb-8 scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Page Header Modernizado */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between flex-wrap gap-6 border-b border-white/5 pb-8"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live Analytics
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-white">
                    Produção Petrolífera
                  </h1>
                  <p className="text-white/40 font-medium max-w-md">
                    Monitorização em tempo real da extração por bloco e operadora em Angola.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium">
                    <Info className="w-4 h-4" />
                    Ajuda
                  </button>
                  <DataExportButton
                    data={blockProductionData.map(d => ({
                      ...d,
                      date: new Date().toISOString().split('T')[0]
                    }))}
                    columns={[
                      { key: 'block', header: 'Bloco' },
                      { key: 'operator', header: 'Operadora' },
                      { key: 'production', header: 'Produção (kbpd)' },
                      { key: 'trend', header: 'Tendência (%)' },
                    ]}
                    filename="producao_petrolifera"
                    dateField="date"
                  />
                </div>
              </motion.div>

              {/* KPI Cards com Hover Effects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Produção Diária", value: "1.08M bpd", change: -2.1, icon: <Gauge />, variant: "default" },
                  { title: "Capacidade", value: "1.35M bpd", change: 0, icon: <Factory />, variant: "primary" },
                  { title: "Utilização", value: "80%", change: -1.5, icon: <Droplets />, variant: "accent" },
                  { title: "Declínio", value: "-3.2%", change: -0.4, icon: <TrendingDown />, variant: "default" }
                ].map((kpi, i) => (
                  <KPICard
                    key={i}
                    title={kpi.title}
                    value={kpi.value}
                    change={kpi.change}
                    changeLabel={kpi.change === 0 ? "estável" : "vs. mês ant."}
                    icon={kpi.icon}
                    variant={kpi.variant as any}
                    delay={i * 0.1}
                    className="bg-[#111111] border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px]"
                  />
                ))}
              </div>

              {/* Main Chart Section - Deep Dark Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-8 relative overflow-hidden group shadow-2xl"
              >
                {/* Background Glow Effect */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Tendência de Produção</h3>
                    <p className="text-sm text-white/40">Comparativo entre extração real e limite operacional</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-tighter">Produção</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border border-white/20" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-tighter">Capacidade</span>
                    </div>
                  </div>
                </div>

                <div className="h-80 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productionTrendData}>
                      <defs>
                        <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.03} strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }} 
                        domain={[900, 1400]} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="production"
                        name="Produção"
                        stroke="hsl(var(--primary))"
                        fill="url(#prodGradient)"
                        strokeWidth={3}
                        animationDuration={2000}
                      />
                      <Area
                        type="monotone"
                        dataKey="capacity"
                        name="Capacidade"
                        stroke="rgba(255,255,255,0.15)"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="8 8"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Grid Secundário */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Operadoras - Design Limpo */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0a0a0a] p-8 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-white">Produção por Operadora</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Market Share por Volume</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-white/20" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operatorProductionData} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 }} 
                          width={110} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="production" name="Produção" radius={[0, 10, 10, 0]} barSize={24}>
                          {operatorProductionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Status - Donut Moderno */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-8 shadow-xl"
                >
                  <h3 className="text-lg font-bold text-white mb-1">Status dos Campos</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Distribuição Operacional</p>
                  
                  <div className="h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fieldStatusData}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {fieldStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white">70</span>
                      <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Total Campos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                    {fieldStatusData.map((item) => (
                      <div key={item.name} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter truncate">{item.name}</span>
                        </div>
                        <span className="text-lg font-bold text-white leading-none">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Tabela de Blocos - Minimalista e Funcional */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden shadow-2xl"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
                  <div>
                    <h3 className="text-xl font-bold text-white">Produção por Bloco</h3>
                    <p className="text-sm text-white/40 mt-1">Detalhamento técnico por unidade de exploração</p>
                  </div>
                  <div className="px-4 py-2 bg-primary/10 rounded-full flex items-center gap-2 border border-primary/20">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase">6 Blocos Activos</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.01]">
                        <th className="py-5 px-8 text-xs font-bold text-white/30 uppercase tracking-widest">Bloco</th>
                        <th className="py-5 px-8 text-xs font-bold text-white/30 uppercase tracking-widest">Operadora</th>
                        <th className="py-5 px-8 text-xs font-bold text-white/30 uppercase tracking-widest text-right">Produção (kbpd)</th>
                        <th className="py-5 px-8 text-xs font-bold text-white/30 uppercase tracking-widest text-right">Tendência</th>
                        <th className="py-5 px-8 text-xs font-bold text-white/30 uppercase tracking-widest text-center">Acções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {blockProductionData.map((block, index) => (
                        <motion.tr
                          key={block.block}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                {block.block.split(' ')[1]}
                              </div>
                              <span className="font-bold text-white group-hover:text-primary transition-colors">{block.block}</span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <span className="text-sm font-medium text-white/60">{block.operator}</span>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <span className="font-mono font-bold text-white">{block.production.toLocaleString()}</span>
                          </td>
                          <td className="py-5 px-8 text-right">
                            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                              block.trend >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                            }`}>
                              {block.trend >= 0 ? '+' : ''}{block.trend}%
                            </div>
                          </td>
                          <td className="py-5 px-8 text-center">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-white">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
        
        <MobileBottomNav />
      </div>
    </>
  );
};

export default Production;