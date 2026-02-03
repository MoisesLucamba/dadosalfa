import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import { 
  Ship, 
  Globe, 
  Clock, 
  DollarSign,
  Anchor,
  Navigation,
  TrendingUp,
  ArrowUpRight,
  MapPin,
  Calendar,
  ChevronRight,
  Activity,
  Box
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
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const exportVolumeData = [
  { month: "Jan", volume: 42.5 },
  { month: "Fev", volume: 38.2 },
  { month: "Mar", volume: 45.1 },
  { month: "Abr", volume: 41.8 },
  { month: "Mai", volume: 44.3 },
  { month: "Jun", volume: 43.2 },
  { month: "Jul", volume: 46.8 },
  { month: "Ago", volume: 44.5 },
  { month: "Set", volume: 45.9 },
  { month: "Out", volume: 44.7 },
  { month: "Nov", volume: 46.0 },
  { month: "Dez", volume: 45.2 },
];

const destinationData = [
  { country: "China", volume: 28.5, percentage: 62, color: "#3b82f6" },
  { country: "Índia", volume: 6.9, percentage: 15, color: "#10b981" },
  { country: "Europa", volume: 5.5, percentage: 12, color: "#8b5cf6" },
  { country: "EUA", volume: 3.7, percentage: 8, color: "#f59e0b" },
  { country: "Outros", volume: 1.4, percentage: 3, color: "#6b7280" },
];

const recentShipments = [
  { 
    vessel: "MT Angotan Spirit", 
    destination: "Ningbo, China", 
    volume: "1.2M bbl", 
    departure: "12 Nov 2024",
    eta: "28 Nov 2024",
    status: "Em trânsito",
    progress: 65
  },
  { 
    vessel: "MT Cabinda Star", 
    destination: "Mumbai, Índia", 
    volume: "950K bbl", 
    departure: "10 Nov 2024",
    eta: "25 Nov 2024",
    status: "Em trânsito",
    progress: 80
  },
  { 
    vessel: "MT Girassol Express", 
    destination: "Rotterdam, Holanda", 
    volume: "800K bbl", 
    departure: "8 Nov 2024",
    eta: "22 Nov 2024",
    status: "Chegou",
    progress: 100
  },
  { 
    vessel: "MT Dalia Voyager", 
    destination: "Houston, EUA", 
    volume: "1.1M bbl", 
    departure: "5 Nov 2024",
    eta: "20 Nov 2024",
    status: "Chegou",
    progress: 100
  },
  { 
    vessel: "MT Pazflor Pioneer", 
    destination: "Shanghai, China", 
    volume: "1.3M bbl", 
    departure: "15 Nov 2024",
    eta: "2 Dez 2024",
    status: "A carregar",
    progress: 15
  },
];

const terminalData = [
  { terminal: "Malongo", capacity: 450, utilization: 82, color: "#3b82f6" },
  { terminal: "Soyo LNG", capacity: 380, utilization: 91, color: "#f59e0b" },
  { terminal: "Cabinda Gulf", capacity: 320, utilization: 75, color: "#10b981" },
  { terminal: "Lobito", capacity: 280, utilization: 68, color: "#8b5cf6" },
];

// --- Main Component ---
const Exports = () => {
  const totalVolume = useMemo(() => destinationData.reduce((acc, curr) => acc + curr.volume, 0), []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 selection:bg-primary/30">
      <Helmet>
        <title>Exportações | AlphaData</title>
        <meta name="description" content="Dados de exportação de petróleo angolano." />
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/exports" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Decorative background elements */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <Header activeItem="/exports" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold">
                      Logistics Hub
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-white">Exportações & Logística</h1>
                  <p className="text-zinc-400 mt-2 max-w-xl">
                    Monitorização em tempo real de fluxos de exportação, destinos globais e infraestrutura portuária.
                  </p>
                </motion.div>
                
                <div className="flex items-center gap-3">
                  <DataExportButton
                    data={recentShipments}
                    columns={[
                      { key: 'vessel', header: 'Navio' },
                      { key: 'destination', header: 'Destino' },
                      { key: 'volume', header: 'Volume' },
                      { key: 'departure', header: 'Partida' },
                      { key: 'eta', header: 'ETA' },
                      { key: 'status', header: 'Status' },
                    ]}
                    filename="exportacoes_angola"
                  />
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Exportações (Nov)"
                  value="46M bbl"
                  change={3.2}
                  changeLabel="vs. Out"
                  icon={<Ship className="w-5 h-5" />}
                  className="bg-[#16191E] border-zinc-800/50 rounded-2xl"
                />
                <KPICard
                  title="Destinos Ativos"
                  value="12"
                  change={2}
                  changeLabel="países"
                  icon={<Globe className="w-5 h-5" />}
                  variant="primary"
                  className="bg-[#16191E] border-zinc-800/50 rounded-2xl"
                />
                <KPICard
                  title="Tempo Médio"
                  value="18 dias"
                  change={-1.2}
                  changeLabel="vs. média"
                  icon={<Clock className="w-5 h-5" />}
                  variant="accent"
                  className="bg-[#16191E] border-zinc-800/50 rounded-2xl"
                />
                <KPICard
                  title="Receita Estimada"
                  value="$3.6B"
                  change={2.8}
                  changeLabel="vs. Out"
                  icon={<DollarSign className="w-5 h-5" />}
                  className="bg-[#16191E] border-zinc-800/50 rounded-2xl"
                />
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Export Volume Trend */}
                <Card className="lg:col-span-8 bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Tendência de Exportação</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Volume mensal em milhões de barris</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">+8.2% YTD</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exportVolumeData}>
                        <defs>
                          <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={[30, 50]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#exportGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Destinations Breakdown */}
                <Card className="lg:col-span-4 bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-zinc-800/50 pb-4">
                    <CardTitle className="text-lg font-bold text-white">Principais Destinos</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">Quota por região geográfica</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={destinationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="volume"
                          >
                            {destinationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-3">
                      {destinationData.map((dest, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dest.color }} />
                            <span className="text-xs font-medium text-zinc-300">{dest.country}</span>
                          </div>
                          <span className="text-xs font-bold text-white">{dest.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Section: Shipments & Terminals */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent Shipments Table */}
                <Card className="lg:col-span-8 bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Embarques Recentes</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Rastreamento de frota em tempo real</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-2">
                      <Activity className="w-3 h-3" /> 5 Ativos
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-900/50 text-left">
                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Navio / Destino</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Volume</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progresso</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {recentShipments.map((ship, i) => (
                            <tr key={i} className="group hover:bg-zinc-800/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-zinc-900 text-primary group-hover:scale-110 transition-transform">
                                    <Ship className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-white">{ship.vessel}</div>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {ship.destination}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-bold text-zinc-200">{ship.volume}</div>
                                <div className="text-[10px] text-zinc-500">ETA: {ship.eta}</div>
                              </td>
                              <td className="py-4 px-6 w-48">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${ship.progress}%` }}
                                      className={`h-full rounded-full ${ship.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-400">{ship.progress}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Badge className={`text-[10px] font-bold uppercase border-none ${
                                  ship.status === 'Em trânsito' ? 'bg-blue-500/10 text-blue-500' :
                                  ship.status === 'Chegou' ? 'bg-emerald-500/10 text-emerald-500' :
                                  'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {ship.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Terminal Utilization */}
                <Card className="lg:col-span-4 bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-zinc-800/50 pb-4">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-lg font-bold text-white">Terminais</CardTitle>
                    </div>
                    <CardDescription className="text-xs text-zinc-500">Capacidade e utilização atual</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {terminalData.map((terminal, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Box className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs font-bold text-zinc-300">{terminal.terminal}</span>
                          </div>
                          <span className={`text-xs font-bold ${
                            terminal.utilization > 90 ? 'text-rose-500' : 
                            terminal.utilization > 80 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {terminal.utilization}%
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${terminal.utilization}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: terminal.color }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                          <span>Capacidade: {terminal.capacity}k bbl</span>
                          <span>{terminal.utilization >= 90 ? 'Crítico' : 'Normal'}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Insight Logístico</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        O terminal de <span className="text-white font-bold">Soyo LNG</span> está a operar próximo da capacidade máxima. Recomenda-se o desvio de cargas não prioritárias para <span className="text-white font-bold">Lobito</span>.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </main>
        </div>
        
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Exports;