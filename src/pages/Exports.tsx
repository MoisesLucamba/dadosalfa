import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { 
  Ship, 
  Globe, 
  Clock, 
  DollarSign,
  Anchor,
  Navigation,
  TrendingUp
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
} from "recharts";

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
  { country: "China", volume: 28.5, percentage: 62, color: "hsl(var(--primary))" },
  { country: "Índia", volume: 6.9, percentage: 15, color: "hsl(var(--accent))" },
  { country: "Europa", volume: 5.5, percentage: 12, color: "hsl(var(--success))" },
  { country: "EUA", volume: 3.7, percentage: 8, color: "#8b5cf6" },
  { country: "Outros", volume: 1.4, percentage: 3, color: "hsl(var(--muted-foreground))" },
];

const recentShipments = [
  { 
    vessel: "MT Angotan Spirit", 
    destination: "Ningbo, China", 
    volume: "1.2M bbl", 
    departure: "12 Nov 2024",
    eta: "28 Nov 2024",
    status: "Em trânsito"
  },
  { 
    vessel: "MT Cabinda Star", 
    destination: "Mumbai, Índia", 
    volume: "950K bbl", 
    departure: "10 Nov 2024",
    eta: "25 Nov 2024",
    status: "Em trânsito"
  },
  { 
    vessel: "MT Girassol Express", 
    destination: "Rotterdam, Holanda", 
    volume: "800K bbl", 
    departure: "8 Nov 2024",
    eta: "22 Nov 2024",
    status: "Chegou"
  },
  { 
    vessel: "MT Dalia Voyager", 
    destination: "Houston, EUA", 
    volume: "1.1M bbl", 
    departure: "5 Nov 2024",
    eta: "20 Nov 2024",
    status: "Chegou"
  },
  { 
    vessel: "MT Pazflor Pioneer", 
    destination: "Shanghai, China", 
    volume: "1.3M bbl", 
    departure: "15 Nov 2024",
    eta: "2 Dez 2024",
    status: "A carregar"
  },
];

const terminalData = [
  { terminal: "Malongo", capacity: 450, utilization: 82 },
  { terminal: "Soyo LNG", capacity: 380, utilization: 91 },
  { terminal: "Cabinda Gulf", capacity: 320, utilization: 75 },
  { terminal: "Lobito", capacity: 280, utilization: 68 },
];

const Exports = () => {
  return (
    <>
      <Helmet>
        <title>Exportações | AlphaData</title>
        <meta
          name="description"
          content="Dados de exportação de petróleo angolano. Volumes, destinos, rastreamento de navios-tanque e análise logística."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/exports" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/exports" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-2xl font-bold text-foreground">Exportações & Logística</h1>
                <p className="text-muted-foreground">Volumes, destinos e rastreamento de embarques</p>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Exportações (Nov)"
                  value="46M bbl"
                  change={3.2}
                  changeLabel="vs. Out"
                  icon={<Ship className="w-5 h-5" />}
                  delay={0}
                />
                <KPICard
                  title="Destinos Ativos"
                  value="12"
                  change={2}
                  changeLabel="países"
                  icon={<Globe className="w-5 h-5" />}
                  variant="primary"
                  delay={0.05}
                />
                <KPICard
                  title="Tempo Médio"
                  value="18 dias"
                  change={-1.2}
                  changeLabel="vs. média anual"
                  icon={<Clock className="w-5 h-5" />}
                  variant="accent"
                  delay={0.1}
                />
                <KPICard
                  title="Receita Exportações"
                  value="$3.6B"
                  change={2.8}
                  changeLabel="vs. Out"
                  icon={<DollarSign className="w-5 h-5" />}
                  delay={0.15}
                />
              </div>

              {/* Export Volume Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Volume de Exportações</h3>
                    <p className="text-sm text-muted-foreground">Milhões de barris por mês</p>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+8.2% YTD</span>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={exportVolumeData}>
                      <defs>
                        <linearGradient id="exportGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[35, 50]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}M bbl`, "Volume"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--primary))"
                        fill="url(#exportGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Destinations & Terminals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Destinations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Destinos de Exportação</h3>
                      <p className="text-sm text-muted-foreground">Novembro 2024</p>
                    </div>
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={destinationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="country" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}M bbl`, "Volume"]}
                        />
                        <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                          {destinationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Terminal Utilization */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Utilização de Terminais</h3>
                      <p className="text-sm text-muted-foreground">Capacidade e utilização</p>
                    </div>
                    <Anchor className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-4">
                    {terminalData.map((terminal, index) => (
                      <motion.div
                        key={terminal.terminal}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{terminal.terminal}</span>
                          <span className="text-sm text-muted-foreground">{terminal.utilization}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${terminal.utilization}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              terminal.utilization >= 90 ? 'bg-accent' : 
                              terminal.utilization >= 75 ? 'bg-primary' : 'bg-success'
                            }`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Recent Shipments Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Embarques Recentes</h3>
                    <p className="text-sm text-muted-foreground">Rastreamento de navios-tanque</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">5 em trânsito</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Navio</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Destino</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Volume</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Partida</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">ETA</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShipments.map((shipment, index) => (
                        <motion.tr
                          key={shipment.vessel}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">{shipment.vessel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">{shipment.destination}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-foreground">{shipment.volume}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">{shipment.departure}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">{shipment.eta}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                              shipment.status === 'Em trânsito' ? 'bg-primary/20 text-primary' :
                              shipment.status === 'Chegou' ? 'bg-success/20 text-success' :
                              'bg-accent/20 text-accent'
                            }`}>
                              {shipment.status}
                            </span>
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
      </div>
    </>
  );
};

export default Exports;
