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
  MapPin
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

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/production" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/production" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Produção Petrolífera</h1>
                  <p className="text-muted-foreground">Análise detalhada por bloco, operadora e campo</p>
                </div>
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
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Produção Diária"
                  value="1.08M bpd"
                  change={-2.1}
                  changeLabel="vs. mês anterior"
                  icon={<Gauge className="w-5 h-5" />}
                  delay={0}
                />
                <KPICard
                  title="Capacidade Instalada"
                  value="1.35M bpd"
                  change={0}
                  changeLabel="estável"
                  icon={<Factory className="w-5 h-5" />}
                  variant="primary"
                  delay={0.05}
                />
                <KPICard
                  title="Taxa de Utilização"
                  value="80%"
                  change={-1.5}
                  changeLabel="vs. mês anterior"
                  icon={<Droplets className="w-5 h-5" />}
                  variant="accent"
                  delay={0.1}
                />
                <KPICard
                  title="Taxa de Declínio"
                  value="-3.2%"
                  change={-0.4}
                  changeLabel="anual"
                  icon={<TrendingDown className="w-5 h-5" />}
                  delay={0.15}
                />
              </div>

              {/* Production Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Tendência de Produção</h3>
                    <p className="text-sm text-muted-foreground">Produção vs Capacidade (milhares bpd)</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Produção</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Capacidade</span>
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productionTrendData}>
                      <defs>
                        <linearGradient id="productionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[900, 1400]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="production"
                        stroke="hsl(var(--primary))"
                        fill="url(#productionGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="capacity"
                        stroke="hsl(var(--accent))"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Operator Production & Field Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Operator Production Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="lg:col-span-2 rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Produção por Operadora</h3>
                    <p className="text-sm text-muted-foreground">Milhares de barris por dia</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operatorProductionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="production" radius={[0, 4, 4, 0]}>
                          {operatorProductionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Field Status Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Status dos Campos</h3>
                    <p className="text-sm text-muted-foreground">Distribuição por estado</p>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fieldStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {fieldStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {fieldStatusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Block Production Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Produção por Bloco</h3>
                    <p className="text-sm text-muted-foreground">Detalhamento por bloco de exploração</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">6 blocos activos</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Bloco</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Operadora</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Produção (kbpd)</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Tendência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockProductionData.map((block, index) => (
                        <motion.tr
                          key={block.block}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-foreground">{block.block}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">{block.operator}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-foreground">{block.production}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-medium ${block.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {block.trend >= 0 ? '+' : ''}{block.trend}%
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
        
        <MobileBottomNav />
      </div>
    </>
  );
};

export default Production;
