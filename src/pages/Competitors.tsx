import { useState, useMemo } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
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
  Globe,
  ExternalLink,
  Mail,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  Flame,
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
  AreaChart,
  Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProductionData } from "@/hooks/useData";

// --- Dados REAIS de operadoras petrolíferas em Angola ---
const operatorsData = [
  {
    id: 1,
    name: "TotalEnergies EP Angola",
    shortName: "Total",
    logo: "T",
    color: "#3b82f6",
    production: 285,
    marketShare: 22.8,
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
    website: "https://totalenergies.com/angola",
    contact: "https://services.totalenergies.co.ao/pt/contate-nos",
  },
  {
    id: 2,
    name: "Chevron Angola",
    shortName: "Chevron",
    logo: "C",
    color: "#0ea5e9",
    production: 198,
    marketShare: 15.8,
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
    website: "https://angola.chevron.com",
    contact: "https://angola.chevron.com/en/contact",
  },
  {
    id: 3,
    name: "Sonangol E.P.",
    shortName: "Sonangol",
    logo: "S",
    color: "#10b981",
    production: 175,
    marketShare: 14.0,
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
    website: "http://www.sonangol.co.ao/",
    contact: "secretariageral@sonangol.co.ao",
  },
  {
    id: 4,
    name: "Eni Angola",
    shortName: "Eni",
    logo: "E",
    color: "#8b5cf6",
    production: 168,
    marketShare: 13.4,
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
    website: "https://www.eni.com/",
    contact: null,
  },
  {
    id: 5,
    name: "BP Angola",
    shortName: "BP",
    logo: "B",
    color: "#f59e0b",
    production: 145,
    marketShare: 11.6,
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
    website: "https://www.bp.com/",
    contact: null,
  },
  {
    id: 6,
    name: "ExxonMobil Angola",
    shortName: "Exxon",
    logo: "X",
    color: "#ec4899",
    production: 109,
    marketShare: 8.7,
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
    website: "https://corporate.exxonmobil.com/locations/angola",
    contact: null,
  },
  {
    id: 7,
    name: "Azule Energy",
    shortName: "Azule",
    logo: "A",
    color: "#06b6d4",
    production: 85,
    marketShare: 6.8,
    blocks: ["Bloco 18", "Bloco 15/06"],
    blocksCount: 2,
    employees: 1200,
    investmentYTD: 0.7,
    efficiency: 90,
    uptime: 95.0,
    declineRate: -2.0,
    costPerBarrel: 27,
    reserves: 0.6,
    trend: "up",
    headquarters: "Luanda",
    since: 2022,
    projects: ["Agogo", "PAJ"],
    website: "https://www.azule-energy.com",
    contact: null,
  },
];

const marketShareHistory = [
  { year: "2021", TotalEnergies: 24.0, Chevron: 17.0, Sonangol: 15.0, ENI: 14.0, BP: 12.0, ExxonMobil: 9.5, Outros: 8.5 },
  { year: "2022", TotalEnergies: 23.5, Chevron: 16.5, Sonangol: 14.5, ENI: 13.8, BP: 12.2, ExxonMobil: 9.2, Outros: 10.3 },
  { year: "2023", TotalEnergies: 23.2, Chevron: 16.2, Sonangol: 14.2, ENI: 13.6, BP: 11.8, ExxonMobil: 9.0, Outros: 12.0 },
  { year: "2024", TotalEnergies: 22.8, Chevron: 15.8, Sonangol: 14.0, ENI: 13.4, BP: 11.6, ExxonMobil: 8.7, Outros: 13.7 },
];

// --- Main Component ---
const Operators = () => {
  const [selectedOperator, setSelectedOperator] = useState(operatorsData[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: productionData } = useProductionData();

  const filteredOperators = useMemo(() => {
    return operatorsData.filter(
      (op) =>
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const radarData = useMemo(
    () => [
      { subject: "Eficiência", A: selectedOperator.efficiency, fullMark: 100 },
      { subject: "Uptime", A: selectedOperator.uptime, fullMark: 100 },
      { subject: "Investimento", A: (selectedOperator.investmentYTD / 2) * 100, fullMark: 100 },
      { subject: "Reservas", A: (selectedOperator.reserves / 2.5) * 100, fullMark: 100 },
      { subject: "Custos", A: (1 - selectedOperator.costPerBarrel / 40) * 100, fullMark: 100 },
    ],
    [selectedOperator]
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 selection:bg-primary/30">
      <Helmet>
        <title>Operadoras | AlphaData</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/operators" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Ambient glows — petroleum palette */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-red-900/5 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-sky-900/5 blur-[110px] rounded-full pointer-events-none" />

          <Header activeItem="/operators" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* ── Page Header ── */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Petroleum sector badge */}
                    <Badge
                      variant="outline"
                      className="bg-red-600/10 text-red-500 border-red-600/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-bold gap-1.5"
                    >
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      Market Intelligence
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-white">Operadoras Petrolíferas</h1>
                  <p className="text-zinc-400 mt-2 max-w-xl leading-relaxed">
                    Análise detalhada do desempenho, participação de mercado e indicadores operacionais das principais empresas em Angola.
                  </p>
                </motion.div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <Input
                      placeholder="Procurar operadora..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#16191E] border-zinc-800 w-64 h-11 rounded-xl focus:ring-red-600/30 focus:border-red-600/30"
                    />
                  </div>
                  <DataExportButton
                    data={operatorsData}
                    filename="operadoras_angola"
                    columns={[
                      { key: "name",        header: "Nome"               },
                      { key: "production",  header: "Produção (kbpd)"    },
                      { key: "marketShare", header: "Quota Mercado (%)"  },
                      { key: "efficiency",  header: "Eficiência (%)"     },
                      { key: "headquarters",header: "Sede"               },
                      { key: "since",       header: "Desde"              },
                      { key: "website",     header: "Website"            },
                    ]}
                  />
                </div>
              </div>

              {/* ── Market Overview Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Production */}
                <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden group hover:border-red-600/20 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-bold">+2.4% vs 2023</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      1.25M <span className="text-sm font-normal text-zinc-500">bpd</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Produção Total Nacional</div>
                  </CardContent>
                </Card>

                {/* Market Leader */}
                <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden group hover:border-red-600/20 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <Badge className="bg-sky-500/10 text-sky-400 border-none text-[10px] font-bold">14 Ativas</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white">TotalEnergies</div>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Líder de Mercado (22.8%)</div>
                  </CardContent>
                </Card>

                {/* Efficiency */}
                <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden group hover:border-red-600/20 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <Badge className="bg-violet-500/10 text-violet-400 border-none text-[10px] font-bold">Média 91%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white">94.2%</div>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Eficiência Operacional Média</div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Main Content Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Operators List */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em]">Lista de Operadoras</h3>
                    <span className="text-[10px] text-zinc-600 font-bold">{filteredOperators.length} EMPRESAS</span>
                  </div>
                  <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {filteredOperators.map((op) => (
                        <motion.button
                          key={op.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedOperator(op)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                            selectedOperator.id === op.id
                              ? "bg-red-700 text-white shadow-lg shadow-red-900/40"
                              : "bg-[#16191E] text-zinc-400 hover:bg-[#1C2026] border border-zinc-800/50 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                                selectedOperator.id === op.id
                                  ? "bg-white/20 text-white"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {op.logo}
                            </div>
                            <div className="text-left">
                              <div
                                className={`font-bold text-sm ${
                                  selectedOperator.id === op.id ? "text-white" : "text-zinc-200"
                                }`}
                              >
                                {op.shortName}
                              </div>
                              <div
                                className={`text-[10px] uppercase tracking-wider font-medium ${
                                  selectedOperator.id === op.id ? "text-white/65" : "text-zinc-500"
                                }`}
                              >
                                {op.production} kbpd • {op.marketShare}%
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              selectedOperator.id === op.id
                                ? "translate-x-1 opacity-100"
                                : "opacity-0 group-hover:opacity-60"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: Operator Details */}
                <div className="lg:col-span-8 space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedOperator.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-6"
                    >
                      {/* Operator Header Card */}
                      <Card className="bg-gradient-to-br from-[#16191E] to-[#0B0E14] border-zinc-800/50 rounded-3xl overflow-hidden relative">
                        {/* Subtle decorative BG icon */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.04]">
                          <Building2 className="w-32 h-32 text-white" />
                        </div>
                        {/* Gold top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

                        <CardContent className="p-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              {/* Logo badge — operator's own color */}
                              <div
                                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shrink-0"
                                style={{
                                  background: `linear-gradient(135deg, ${selectedOperator.color}cc, ${selectedOperator.color}88)`,
                                  boxShadow: `0 16px 40px ${selectedOperator.color}30`,
                                }}
                              >
                                {selectedOperator.logo}
                              </div>
                              <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">{selectedOperator.name}</h2>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                  <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                    {selectedOperator.headquarters}, Angola
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                                    Desde {selectedOperator.since}
                                  </span>
                                  {selectedOperator.website && (
                                    <a
                                      href={selectedOperator.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-red-300 hover:underline transition-colors"
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      Website
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Trend indicator */}
                            <div className="text-right shrink-0">
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tendência</div>
                              <div
                                className={`flex items-center justify-end gap-1.5 font-black text-sm ${
                                  selectedOperator.trend === "up"
                                    ? "text-emerald-400"
                                    : selectedOperator.trend === "down"
                                    ? "text-red-400"
                                    : "text-sky-400"
                                }`}
                              >
                                {selectedOperator.trend === "up" ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : selectedOperator.trend === "down" ? (
                                  <TrendingDown className="w-4 h-4" />
                                ) : (
                                  <Minus className="w-4 h-4" />
                                )}
                                {selectedOperator.trend.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {/* KPI row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-8 border-t border-zinc-800/60">
                            {[
                              { label: "Produção",    value: `${selectedOperator.production}k`, sub: "bpd",        icon: Droplets,   color: "text-sky-400"     },
                              { label: "Market Share",value: `${selectedOperator.marketShare}%`,sub: "Nacional",   icon: PieChart,   color: "text-emerald-400" },
                              { label: "Investimento",value: `$${selectedOperator.investmentYTD}B`, sub: "YTD 2024", icon: DollarSign, color: "text-amber-400"   },
                              { label: "Eficiência",  value: `${selectedOperator.efficiency}%`, sub: "Operacional", icon: Gauge,      color: "text-violet-400"  },
                            ].map((stat, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-black text-white">{stat.value}</span>
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{stat.sub}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Charts row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Performance Radar */}
                        <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-[0.15em]">Score de Performance</CardTitle>
                          </CardHeader>
                          <CardContent className="h-[300px] pt-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                <PolarAngleAxis
                                  dataKey="subject"
                                  tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
                                />
                                <Radar
                                  name={selectedOperator.shortName}
                                  dataKey="A"
                                  stroke={selectedOperator.color}
                                  fill={selectedOperator.color}
                                  fillOpacity={0.2}
                                  strokeWidth={2}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#111318",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "12px",
                                    color: "#fff",
                                  }}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Market Share History */}
                        <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-[0.15em]">Evolução Market Share</CardTitle>
                          </CardHeader>
                          <CardContent className="h-[300px] pt-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={marketShareHistory}>
                                <defs>
                                  <linearGradient id="colorMS" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={selectedOperator.color} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={selectedOperator.color} stopOpacity={0}    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="year" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#111318",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "12px",
                                    color: "#fff",
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey={selectedOperator.shortName.replace(" ", "")}
                                  stroke={selectedOperator.color}
                                  strokeWidth={2.5}
                                  fillOpacity={1}
                                  fill="url(#colorMS)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Projects & Blocks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-colors">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Factory className="w-4 h-4 text-red-500" />
                              <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-[0.15em]">Principais Projetos</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedOperator.projects.map((project, i) => (
                                <Badge
                                  key={i}
                                  className="bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 py-1.5 px-3 rounded-lg transition-colors"
                                >
                                  {project}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#16191E] border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-colors">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-[0.15em]">Blocos Operados</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedOperator.blocks.map((block, i) => (
                                <Badge
                                  key={i}
                                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/15 py-1.5 px-3 rounded-lg transition-colors"
                                >
                                  {block}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Operators;