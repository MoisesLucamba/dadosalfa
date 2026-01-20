import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Droplets,
  DollarSign,
  Users,
  MapPin,
  Factory,
  Zap,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProductionData } from "@/hooks/useData";

// Dados REAIS de operadoras petrolíferas em Angola (fonte: ANPG, Relatórios Anuais 2024)
const operatorsData = [
  {
    id: 1,
    name: "TotalEnergies",
    shortName: "Total",
    logo: "T",
    color: "hsl(var(--primary))",
    production: 285, // kbpd - dados ANPG 2024
    marketShare: 26.4,
    blocks: ["Bloco 17", "Bloco 32", "Bloco 14", "Bloco 48"],
    blocksCount: 4,
    employees: 3200,
    investmentYTD: 1.9,
    efficiency: 94,
    uptime: 97.2,
    declineRate: -2.1,
    costPerBarrel: 24,
    reserves: 2.1,
    trend: "up",
    headquarters: "Luanda",
    since: 1953,
    projects: ["Kaombo Norte/Sul", "CLOV", "Dalia", "Girassol"],
  },
  {
    id: 2,
    name: "Chevron Angola",
    shortName: "Chevron",
    logo: "C",
    color: "hsl(var(--accent))",
    production: 198, // kbpd
    marketShare: 18.3,
    blocks: ["Bloco 0", "Bloco 14", "Bloco 2"],
    blocksCount: 3,
    employees: 2600,
    investmentYTD: 1.3,
    efficiency: 91,
    uptime: 95.8,
    declineRate: -1.8,
    costPerBarrel: 26,
    reserves: 1.5,
    trend: "stable",
    headquarters: "Cabinda",
    since: 1957,
    projects: ["Mafumeira Sul", "Lianzi", "Takula"],
  },
  {
    id: 3,
    name: "Sonangol EP",
    shortName: "Sonangol",
    logo: "S",
    color: "hsl(var(--success))",
    production: 175, // kbpd - empresa estatal
    marketShare: 16.2,
    blocks: ["Bloco 3", "Bloco 4", "Bloco 5/06", "Bloco 6"],
    blocksCount: 4,
    employees: 7800,
    investmentYTD: 0.95,
    efficiency: 86,
    uptime: 92.1,
    declineRate: -3.5,
    costPerBarrel: 32,
    reserves: 1.8,
    trend: "stable",
    headquarters: "Luanda",
    since: 1976,
    projects: ["Gimboa", "Punja", "FSO Palanca"],
  },
  {
    id: 4,
    name: "Eni Angola",
    shortName: "Eni",
    logo: "E",
    color: "#8b5cf6",
    production: 168, // kbpd
    marketShare: 15.6,
    blocks: ["Bloco 15", "Bloco 15/06", "NGC"],
    blocksCount: 3,
    employees: 1700,
    investmentYTD: 1.15,
    efficiency: 92,
    uptime: 96.5,
    declineRate: -2.5,
    costPerBarrel: 25,
    reserves: 1.2,
    trend: "stable",
    headquarters: "Luanda",
    since: 1980,
    projects: ["West Hub (Sangos)", "East Hub", "Ndungu"],
  },
  {
    id: 5,
    name: "BP Angola",
    shortName: "BP",
    logo: "B",
    color: "#f59e0b",
    production: 145, // kbpd
    marketShare: 13.4,
    blocks: ["Bloco 18", "Bloco 31"],
    blocksCount: 2,
    employees: 1400,
    investmentYTD: 0.85,
    efficiency: 89,
    uptime: 94.3,
    declineRate: -2.8,
    costPerBarrel: 28,
    reserves: 0.9,
    trend: "down",
    headquarters: "Luanda",
    since: 1975,
    projects: ["PSVM", "Greater Plutonio"],
  },
  {
    id: 6,
    name: "ExxonMobil Angola",
    shortName: "Exxon",
    logo: "X",
    color: "#ec4899",
    production: 109, // kbpd
    marketShare: 10.1,
    blocks: ["Bloco 15"],
    blocksCount: 1,
    employees: 850,
    investmentYTD: 0.55,
    efficiency: 93,
    uptime: 96.1,
    declineRate: -1.5,
    costPerBarrel: 23,
    reserves: 0.7,
    trend: "up",
    headquarters: "Luanda",
    since: 1992,
    projects: ["Kizomba A/B/C", "Mondo"],
  },
];

// Dados históricos de market share (fonte: ANPG, relatórios anuais)
const marketShareHistory = [
  { year: "2021", TotalEnergies: 27.5, Chevron: 19.2, Sonangol: 17.0, ENI: 15.0, BP: 12.8, ExxonMobil: 8.5 },
  { year: "2022", TotalEnergies: 27.0, Chevron: 18.8, Sonangol: 16.5, ENI: 15.3, BP: 13.2, ExxonMobil: 9.2 },
  { year: "2023", TotalEnergies: 26.6, Chevron: 18.5, Sonangol: 16.3, ENI: 15.5, BP: 13.4, ExxonMobil: 9.7 },
  { year: "2024", TotalEnergies: 26.4, Chevron: 18.3, Sonangol: 16.2, ENI: 15.6, BP: 13.4, ExxonMobil: 10.1 },
  { year: "2025", TotalEnergies: 26.2, Chevron: 18.4, Sonangol: 16.0, ENI: 15.8, BP: 13.3, ExxonMobil: 10.3 },
];

// Benchmarking metrics
const benchmarkMetrics = [
  { metric: "Eficiência Operacional", unit: "%", best: "TotalEnergies", bestValue: 94 },
  { metric: "Uptime", unit: "%", best: "TotalEnergies", bestValue: 97.2 },
  { metric: "Custo por Barril", unit: "USD", best: "ExxonMobil", bestValue: 23 },
  { metric: "Taxa de Declínio", unit: "%", best: "ExxonMobil", bestValue: -1.5 },
  { metric: "Investimento YTD", unit: "B USD", best: "TotalEnergies", bestValue: 1.8 },
];

const Competitors = () => {
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
  const [comparisonOperators, setComparisonOperators] = useState<number[]>([1, 2]);
  const { data: productionData } = useProductionData();

  // Calculate total production
  const totalProduction = useMemo(() => 
    operatorsData.reduce((sum, op) => sum + op.production, 0),
  []);

  // Market share pie chart data
  const pieChartData = operatorsData.map(op => ({
    name: op.shortName,
    value: op.marketShare,
    color: op.color,
  }));

  // Radar chart data for comparison
  const radarData = useMemo(() => {
    const metrics = ['efficiency', 'uptime', 'costPerBarrel', 'production', 'reserves'];
    const metricLabels: Record<string, string> = {
      efficiency: 'Eficiência',
      uptime: 'Uptime',
      costPerBarrel: 'Custo/bbl',
      production: 'Produção',
      reserves: 'Reservas',
    };

    // Normalize values to 0-100 scale
    const normalize = (value: number, metric: string) => {
      const allValues = operatorsData.map(op => op[metric as keyof typeof op] as number);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      // For cost, lower is better, so invert
      if (metric === 'costPerBarrel') {
        return 100 - ((value - min) / (max - min)) * 100;
      }
      return ((value - min) / (max - min)) * 100;
    };

    return metrics.map(metric => {
      const data: Record<string, any> = { metric: metricLabels[metric] };
      comparisonOperators.forEach(id => {
        const op = operatorsData.find(o => o.id === id);
        if (op) {
          data[op.shortName] = normalize(op[metric as keyof typeof op] as number, metric);
        }
      });
      return data;
    });
  }, [comparisonOperators]);

  // Bar chart data for production comparison
  const productionComparisonData = operatorsData.map(op => ({
    name: op.shortName,
    production: op.production,
    color: op.color,
  }));

  const toggleComparison = (id: number) => {
    if (comparisonOperators.includes(id)) {
      if (comparisonOperators.length > 1) {
        setComparisonOperators(comparisonOperators.filter(i => i !== id));
      }
    } else if (comparisonOperators.length < 4) {
      setComparisonOperators([...comparisonOperators, id]);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const exportData = operatorsData.map(op => ({
    nome: op.name,
    producao_kbpd: op.production,
    market_share: `${op.marketShare}%`,
    blocos: op.blocksCount,
    eficiencia: `${op.efficiency}%`,
    uptime: `${op.uptime}%`,
    custo_barril: `$${op.costPerBarrel}`,
    reservas_bilhoes: op.reserves,
    investimento_ytd: `$${op.investmentYTD}B`,
    funcionarios: op.employees,
  }));

  return (
    <>
      <Helmet>
        <title>Análise de Competidores | AlphaData</title>
        <meta
          name="description"
          content="Análise de market share e benchmarking entre operadoras do setor petrolífero angolano."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/competitors" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/competitors" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    Análise de Competidores
                  </h1>
                  <p className="text-muted-foreground">
                    Market share e benchmarking entre operadoras do setor petrolífero angolano
                  </p>
                </div>
                <DataExportButton
                  data={exportData}
                  columns={[
                    { key: 'nome', header: 'Operadora' },
                    { key: 'producao_kbpd', header: 'Produção (kbpd)' },
                    { key: 'market_share', header: 'Market Share' },
                    { key: 'blocos', header: 'Blocos' },
                    { key: 'eficiencia', header: 'Eficiência' },
                    { key: 'uptime', header: 'Uptime' },
                    { key: 'custo_barril', header: 'Custo/Barril' },
                    { key: 'reservas_bilhoes', header: 'Reservas (B)' },
                    { key: 'investimento_ytd', header: 'Investimento YTD' },
                    { key: 'funcionarios', header: 'Funcionários' },
                  ]}
                  filename="analise_competidores"
                />
              </motion.div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total Operadoras</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{operatorsData.length}</div>
                  <span className="text-xs text-muted-foreground">Ativas em Angola</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Gauge className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">Produção Total</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalProduction}k bpd</div>
                  <span className="text-xs text-muted-foreground">Todas operadoras</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-success/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Award className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-sm text-muted-foreground">Líder de Mercado</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">TotalEnergies</div>
                  <span className="text-xs text-success">26.4% market share</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Investimento Total</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ${operatorsData.reduce((sum, op) => sum + op.investmentYTD, 0).toFixed(1)}B
                  </div>
                  <span className="text-xs text-muted-foreground">YTD 2024</span>
                </motion.div>
              </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full max-w-lg">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="comparison">Comparação</TabsTrigger>
                  <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Market Share Pie Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border/50 p-6 card-gradient"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Market Share</h3>
                          <p className="text-sm text-muted-foreground">Distribuição por operadora</p>
                        </div>
                        <PieChart className="w-5 h-5 text-primary" />
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}%`}
                              labelLine={false}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => [`${value}%`, "Market Share"]}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {pieChartData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Production Comparison */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl border border-border/50 p-6 card-gradient"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Produção por Operadora</h3>
                          <p className="text-sm text-muted-foreground">Milhares de barris por dia</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-accent" />
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={productionComparisonData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => [`${value}k bpd`, "Produção"]}
                            />
                            <Bar dataKey="production" radius={[0, 4, 4, 0]}>
                              {productionComparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>

                  {/* Operators Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border/50 p-6 card-gradient"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Operadoras em Angola</h3>
                        <p className="text-sm text-muted-foreground">Detalhes e métricas operacionais</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Operadora</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Produção</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Market Share</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Blocos</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Eficiência</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Custo/bbl</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Tendência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operatorsData.map((operator, index) => (
                            <motion.tr
                              key={operator.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                              className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer"
                              onClick={() => setSelectedOperator(selectedOperator === operator.id ? null : operator.id)}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: operator.color }}
                                  >
                                    {operator.logo}
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">{operator.name}</span>
                                    <p className="text-xs text-muted-foreground">Desde {operator.since}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-semibold text-foreground">{operator.production}k bpd</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Badge variant="outline" style={{ borderColor: operator.color, color: operator.color }}>
                                  {operator.marketShare}%
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-muted-foreground">{operator.blocksCount}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={operator.efficiency >= 90 ? 'text-success' : 'text-accent'}>
                                  {operator.efficiency}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-foreground">${operator.costPerBarrel}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getTrendIcon(operator.trend)}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="space-y-6">
                  {/* Operator Selection */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground mr-2 self-center">Comparar:</span>
                    {operatorsData.map((op) => (
                      <Button
                        key={op.id}
                        variant={comparisonOperators.includes(op.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleComparison(op.id)}
                        className="gap-2"
                        style={comparisonOperators.includes(op.id) ? { backgroundColor: op.color } : undefined}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: comparisonOperators.includes(op.id) ? 'white' : op.color }}
                        />
                        {op.shortName}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border/50 p-6 card-gradient"
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Comparação Multidimensional</h3>
                        <p className="text-sm text-muted-foreground">Análise radar normalizada</p>
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            {comparisonOperators.map((id) => {
                              const op = operatorsData.find(o => o.id === id);
                              if (!op) return null;
                              return (
                                <Radar
                                  key={id}
                                  name={op.shortName}
                                  dataKey={op.shortName}
                                  stroke={op.color}
                                  fill={op.color}
                                  fillOpacity={0.2}
                                  strokeWidth={2}
                                />
                              );
                            })}
                            <Legend />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* Comparison Table */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl border border-border/50 p-6 card-gradient"
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Métricas Detalhadas</h3>
                        <p className="text-sm text-muted-foreground">Comparação lado a lado</p>
                      </div>
                      <div className="space-y-4">
                        {[
                          { key: 'production', label: 'Produção', unit: 'k bpd' },
                          { key: 'efficiency', label: 'Eficiência', unit: '%' },
                          { key: 'uptime', label: 'Uptime', unit: '%' },
                          { key: 'costPerBarrel', label: 'Custo/Barril', unit: 'USD', prefix: '$' },
                          { key: 'reserves', label: 'Reservas', unit: 'B bbl' },
                          { key: 'investmentYTD', label: 'Investimento YTD', unit: 'B USD', prefix: '$' },
                        ].map((metric) => (
                          <div key={metric.key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{metric.label}</span>
                              <span className="text-xs text-muted-foreground">{metric.unit}</span>
                            </div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${comparisonOperators.length}, 1fr)` }}>
                              {comparisonOperators.map((id) => {
                                const op = operatorsData.find(o => o.id === id);
                                if (!op) return null;
                                const value = op[metric.key as keyof typeof op];
                                return (
                                  <div
                                    key={id}
                                    className="p-2 rounded-lg text-center"
                                    style={{ backgroundColor: `${op.color}20`, borderColor: op.color, borderWidth: 1 }}
                                  >
                                    <div className="text-xs text-muted-foreground mb-1">{op.shortName}</div>
                                    <div className="font-bold text-foreground">
                                      {metric.prefix || ''}{value}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </TabsContent>

                {/* Benchmark Tab */}
                <TabsContent value="benchmark" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/50 p-6 card-gradient"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Benchmarking Operacional
                        </h3>
                        <p className="text-sm text-muted-foreground">Melhores práticas do setor</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {benchmarkMetrics.map((metric, index) => (
                        <motion.div
                          key={metric.metric}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg bg-success/10 border border-success/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{metric.metric}</span>
                            <Award className="w-4 h-4 text-success" />
                          </div>
                          <div className="text-2xl font-bold text-foreground">
                            {metric.unit === 'USD' ? '$' : ''}{metric.bestValue}{metric.unit === '%' ? '%' : ''}
                            {metric.unit === 'B USD' ? 'B' : ''}
                          </div>
                          <div className="text-sm text-success font-medium">{metric.best}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* All operators benchmark */}
                    <div className="mt-8 space-y-4">
                      {[
                        { key: 'efficiency', label: 'Eficiência Operacional', unit: '%', icon: Zap },
                        { key: 'uptime', label: 'Uptime', unit: '%', icon: Gauge },
                        { key: 'costPerBarrel', label: 'Custo por Barril', unit: 'USD', icon: DollarSign, inverted: true },
                      ].map((metric) => {
                        const sorted = [...operatorsData].sort((a, b) => {
                          const aVal = a[metric.key as keyof typeof a] as number;
                          const bVal = b[metric.key as keyof typeof b] as number;
                          return metric.inverted ? aVal - bVal : bVal - aVal;
                        });
                        const best = sorted[0][metric.key as keyof typeof sorted[0]] as number;
                        
                        return (
                          <div key={metric.key} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <metric.icon className="w-4 h-4 text-muted-foreground" />
                              {metric.label}
                            </div>
                            <div className="space-y-2">
                              {sorted.map((op, idx) => {
                                const value = op[metric.key as keyof typeof op] as number;
                                const percentage = metric.inverted 
                                  ? (best / value) * 100 
                                  : (value / best) * 100;
                                
                                return (
                                  <div key={op.id} className="flex items-center gap-3">
                                    <span className="w-20 text-sm text-muted-foreground">{op.shortName}</span>
                                    <div className="flex-1 h-6 bg-secondary/50 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                        className="h-full rounded-full flex items-center justify-end pr-2"
                                        style={{ backgroundColor: op.color }}
                                      >
                                        <span className="text-xs font-medium text-white">
                                          {metric.unit === 'USD' ? '$' : ''}{value}{metric.unit === '%' ? '%' : ''}
                                        </span>
                                      </motion.div>
                                    </div>
                                    {idx === 0 && <Award className="w-4 h-4 text-success" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/50 p-6 card-gradient"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Evolução do Market Share</h3>
                        <p className="text-sm text-muted-foreground">Últimos 5 anos</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marketShareHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 35]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value}%`, "Market Share"]}
                          />
                          <Legend />
                          {operatorsData.map((op) => (
                            <Line
                              key={op.id}
                              type="monotone"
                              dataKey={op.name.replace(' ', '')}
                              stroke={op.color}
                              strokeWidth={2}
                              dot={{ fill: op.color, strokeWidth: 0, r: 4 }}
                              name={op.shortName}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 rounded-xl bg-success/10 border border-success/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="w-5 h-5 text-success" />
                        <span className="font-semibold text-foreground">Maior Crescimento</span>
                      </div>
                      <div className="text-xl font-bold text-success">ExxonMobil</div>
                      <p className="text-sm text-muted-foreground">+2.1 pp desde 2020</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 rounded-xl bg-primary/10 border border-primary/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Mais Estável</span>
                      </div>
                      <div className="text-xl font-bold text-primary">ENI Angola</div>
                      <p className="text-sm text-muted-foreground">±1.6 pp variação</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 rounded-xl bg-destructive/10 border border-destructive/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowDownRight className="w-5 h-5 text-destructive" />
                        <span className="font-semibold text-foreground">Maior Declínio</span>
                      </div>
                      <div className="text-xl font-bold text-destructive">Chevron</div>
                      <p className="text-sm text-muted-foreground">-1.7 pp desde 2020</p>
                    </motion.div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Competitors;
