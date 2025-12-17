import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { 
  AlertTriangle, 
  Shield,
  Globe,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const riskRadarData = [
  { category: "Geopolítico", value: 72, fullMark: 100 },
  { category: "Regulatório", value: 45, fullMark: 100 },
  { category: "Fiscal", value: 58, fullMark: 100 },
  { category: "Operacional", value: 35, fullMark: 100 },
  { category: "Cambial", value: 68, fullMark: 100 },
  { category: "Ambiental", value: 42, fullMark: 100 },
];

const riskTrendData = [
  { month: "Jun", geopolitico: 65, regulatorio: 48, fiscal: 52 },
  { month: "Jul", geopolitico: 68, regulatorio: 45, fiscal: 55 },
  { month: "Ago", geopolitico: 70, regulatorio: 42, fiscal: 58 },
  { month: "Set", geopolitico: 72, regulatorio: 46, fiscal: 56 },
  { month: "Out", geopolitico: 75, regulatorio: 44, fiscal: 60 },
  { month: "Nov", geopolitico: 72, regulatorio: 45, fiscal: 58 },
];

const riskAlerts = [
  {
    id: 1,
    type: "critical",
    title: "Tensões no Mar Vermelho",
    description: "Ataques a navios-tanque aumentam custos de seguro e tempo de transporte para Europa.",
    impact: "Alto",
    region: "Médio Oriente",
    date: "há 2 horas",
  },
  {
    id: 2,
    type: "warning",
    title: "Revisão Fiscal em Discussão",
    description: "Governo angolano considera alterações aos royalties do setor petrolífero.",
    impact: "Médio",
    region: "Angola",
    date: "há 8 horas",
  },
  {
    id: 3,
    type: "warning",
    title: "Volatilidade Cambial Kwanza",
    description: "Desvalorização do Kwanza de 5% face ao USD impacta custos operacionais.",
    impact: "Médio",
    region: "Angola",
    date: "há 1 dia",
  },
  {
    id: 4,
    type: "info",
    title: "Nova Regulamentação Ambiental",
    description: "UE propõe novas métricas de emissões para importação de crude.",
    impact: "Baixo",
    region: "Europa",
    date: "há 2 dias",
  },
];

const countryRiskData = [
  { country: "Angola", score: 58, trend: "stable" },
  { country: "Nigéria", score: 72, trend: "up" },
  { country: "Líbia", score: 85, trend: "up" },
  { country: "Argélia", score: 52, trend: "down" },
  { country: "Guiné Eq.", score: 48, trend: "stable" },
];

const regulatoryTimeline = [
  {
    date: "Q1 2025",
    title: "Revisão Lei Petrolífera",
    status: "pending",
    description: "Atualização da Lei das Actividades Petrolíferas",
  },
  {
    date: "Q2 2025",
    title: "Novas Quotas OPEP+",
    status: "pending",
    description: "Revisão das quotas de produção para membros africanos",
  },
  {
    date: "2024",
    title: "Regulamento Conteúdo Local",
    status: "active",
    description: "Requisitos de participação angolana em projetos",
  },
  {
    date: "2023",
    title: "Reforma Fiscal Upstream",
    status: "completed",
    description: "Alterações ao regime de tributação do setor",
  },
];

const Risk = () => {
  const getRiskColor = (value: number) => {
    if (value >= 70) return "hsl(var(--destructive))";
    if (value >= 50) return "hsl(var(--accent))";
    return "hsl(var(--success))";
  };

  return (
    <>
      <Helmet>
        <title>Risco & Geopolítica | AlphaData</title>
        <meta
          name="description"
          content="Análise de riscos geopolíticos, regulatórios e fiscais para o setor petrolífero angolano."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/risk" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/risk" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-2xl font-bold text-foreground">Risco & Geopolítica</h1>
                <p className="text-muted-foreground">Monitorização de riscos regulatórios, fiscais e geopolíticos</p>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Índice de Risco Global"
                  value="58/100"
                  change={3}
                  changeLabel="vs. mês anterior"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  variant="accent"
                  delay={0}
                />
                <KPICard
                  title="Risco Geopolítico"
                  value="72/100"
                  change={5}
                  changeLabel="elevado"
                  icon={<Globe className="w-5 h-5" />}
                  delay={0.05}
                />
                <KPICard
                  title="Risco Regulatório"
                  value="45/100"
                  change={-2}
                  changeLabel="moderado"
                  icon={<Scale className="w-5 h-5" />}
                  variant="primary"
                  delay={0.1}
                />
                <KPICard
                  title="Alertas Ativos"
                  value="4"
                  change={1}
                  changeLabel="novo hoje"
                  icon={<AlertCircle className="w-5 h-5" />}
                  delay={0.15}
                />
              </div>

              {/* Risk Radar & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Radar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Perfil de Risco</h3>
                      <p className="text-sm text-muted-foreground">Análise multidimensional</p>
                    </div>
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={riskRadarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Radar
                          name="Risco"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Active Alerts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Alertas Activos</h3>
                      <p className="text-sm text-muted-foreground">Eventos de risco recentes</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive/20 text-destructive">
                      4 alertas
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                    {riskAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="p-3 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div className="flex items-start gap-3">
                          {alert.type === 'critical' && <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
                          {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />}
                          {alert.type === 'info' && <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-foreground truncate">{alert.title}</h4>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${
                                alert.impact === 'Alto' ? 'bg-destructive/20 text-destructive' :
                                alert.impact === 'Médio' ? 'bg-accent/20 text-accent' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {alert.impact}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{alert.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.region}
                              </span>
                              <span>{alert.date}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Country Risk & Regulatory Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Country Risk Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Risco por País</h3>
                      <p className="text-sm text-muted-foreground">Comparativo produtores africanos</p>
                    </div>
                    <Globe className="w-5 h-5 text-accent" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={countryRiskData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="country" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {countryRiskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getRiskColor(entry.score)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-muted-foreground">Baixo (&lt;50)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Médio (50-69)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">Alto (≥70)</span>
                    </div>
                  </div>
                </motion.div>

                {/* Regulatory Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Timeline Regulatório</h3>
                      <p className="text-sm text-muted-foreground">Eventos e alterações previstas</p>
                    </div>
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-4">
                    {regulatoryTimeline.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.status === 'completed' ? 'bg-success' :
                            event.status === 'active' ? 'bg-primary' : 'bg-muted-foreground'
                          }`} />
                          {index < regulatoryTimeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">{event.date}</span>
                            {event.status === 'completed' && <CheckCircle className="w-3 h-3 text-success" />}
                          </div>
                          <h4 className="text-sm font-medium text-foreground mb-1">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Risk Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-border/50 p-6 card-gradient"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Evolução de Riscos</h3>
                    <p className="text-sm text-muted-foreground">Tendência dos últimos 6 meses</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">Geopolítico</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Regulatório</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Fiscal</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="geopolitico" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="regulatorio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fiscal" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Risk;
