import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  MapPin,
  RefreshCw,
  Loader2,
  Clock,
  Minus
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskHistoryChart } from "@/components/dashboard/RiskHistoryChart";

interface RiskScore {
  category: string;
  score: number;
  trend: string;
  description: string;
}

interface RiskAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  impact: string;
  region: string;
  created_at: string;
}

interface CountryRisk {
  country: string;
  score: number;
  trend: string;
}

interface RegulatoryEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  status: string;
  impact_level: string;
}

const Risk = () => {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [countryRisks, setCountryRisks] = useState<CountryRisk[]>([]);
  const [regulatoryEvents, setRegulatoryEvents] = useState<RegulatoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const [riskResult, alertsResult, countryResult, regulatoryResult] = await Promise.all([
        supabase.from('risk_data').select('*').order('created_at', { ascending: false }),
        supabase.from('risk_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('country_risk').select('*').order('data_date', { ascending: false }),
        supabase.from('regulatory_events').select('*').order('event_date', { ascending: true }),
      ]);

      if (riskResult.data?.length) {
        // Get latest data for each category
        const latestByCategory = riskResult.data.reduce((acc: Record<string, RiskScore>, item) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              category: getCategoryName(item.category),
              score: item.score,
              trend: item.trend,
              description: item.description,
            };
          }
          return acc;
        }, {});
        setRiskScores(Object.values(latestByCategory));
        setLastUpdated(riskResult.data[0]?.updated_at);
      }

      if (alertsResult.data?.length) {
        setAlerts(alertsResult.data);
      }

      if (countryResult.data?.length) {
        // Get latest data for each country
        const latestByCountry = countryResult.data.reduce((acc: Record<string, CountryRisk>, item) => {
          if (!acc[item.country]) {
            acc[item.country] = {
              country: item.country,
              score: item.score,
              trend: item.trend,
            };
          }
          return acc;
        }, {});
        setCountryRisks(Object.values(latestByCountry));
      }

      if (regulatoryResult.data?.length) {
        setRegulatoryEvents(regulatoryResult.data);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisks = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-risks');

      if (error) throw error;

      if (data?.success) {
        toast.success("Análise de riscos atualizada com sucesso!");
        fetchRiskData();
      } else {
        throw new Error(data?.error || "Erro na análise");
      }
    } catch (error) {
      console.error('Error analyzing risks:', error);
      toast.error("Erro ao analisar riscos. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      geopolitical: "Geopolítico",
      regulatory: "Regulatório",
      fiscal: "Fiscal",
      operational: "Operacional",
      currency: "Cambial",
      environmental: "Ambiental",
    };
    return names[category] || category;
  };

  const getRiskColor = (value: number) => {
    if (value >= 70) return "hsl(var(--destructive))";
    if (value >= 50) return "hsl(var(--accent))";
    return "hsl(var(--success))";
  };

  const getImpactLabel = (impact: string) => {
    const labels: Record<string, string> = {
      high: "Alto",
      medium: "Médio",
      low: "Baixo",
    };
    return labels[impact] || impact;
  };

  // Calculate global risk index
  const globalRiskIndex = useMemo(() => {
    if (riskScores.length === 0) return 0;
    const weights: Record<string, number> = {
      "Geopolítico": 0.25,
      "Regulatório": 0.2,
      "Fiscal": 0.2,
      "Operacional": 0.15,
      "Cambial": 0.1,
      "Ambiental": 0.1,
    };
    const total = riskScores.reduce((sum, r) => sum + (r.score * (weights[r.category] || 0.15)), 0);
    return Math.round(total);
  }, [riskScores]);

  // Radar chart data
  const radarData = riskScores.map(r => ({
    category: r.category,
    value: r.score,
    fullMark: 100,
  }));

  // Time since last update
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `há ${Math.floor(hours / 24)} dias`;
    if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
    return `há ${minutes} min`;
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
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Risco & Geopolítica</h1>
                  <p className="text-muted-foreground">Monitorização de riscos regulatórios, fiscais e geopolíticos</p>
                </div>
                <div className="flex items-center gap-3">
                  {lastUpdated && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Atualizado {formatTimeAgo(lastUpdated)}
                    </span>
                  )}
                  <Button
                    onClick={analyzeRisks}
                    disabled={analyzing}
                    className="gap-2"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {analyzing ? "Analisando..." : "Atualizar Riscos"}
                  </Button>
                </div>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-accent/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <AlertTriangle className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">Índice de Risco Global</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{globalRiskIndex}/100</div>
                      <span className={`text-xs ${globalRiskIndex >= 60 ? 'text-destructive' : globalRiskIndex >= 40 ? 'text-accent' : 'text-success'}`}>
                        {globalRiskIndex >= 60 ? 'Elevado' : globalRiskIndex >= 40 ? 'Moderado' : 'Baixo'}
                      </span>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Risco Geopolítico</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {riskScores.find(r => r.category === 'Geopolítico')?.score || 0}/100
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {riskScores.find(r => r.category === 'Geopolítico')?.trend === 'up' && <TrendingUp className="w-3 h-3 text-destructive" />}
                        {riskScores.find(r => r.category === 'Geopolítico')?.trend === 'down' && <TrendingDown className="w-3 h-3 text-success" />}
                        {riskScores.find(r => r.category === 'Geopolítico')?.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-muted-foreground">
                          {riskScores.find(r => r.category === 'Geopolítico')?.trend === 'up' ? 'A subir' : 
                           riskScores.find(r => r.category === 'Geopolítico')?.trend === 'down' ? 'A descer' : 'Estável'}
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-primary/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Risco Regulatório</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {riskScores.find(r => r.category === 'Regulatório')?.score || 0}/100
                      </div>
                      <span className="text-xs text-muted-foreground">Moderado</span>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="text-sm text-muted-foreground">Alertas Ativos</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-10" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{alerts.length}</div>
                      <span className="text-xs text-muted-foreground">
                        {alerts.filter(a => a.alert_type === 'critical').length} críticos
                      </span>
                    </>
                  )}
                </motion.div>
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
                    {loading ? (
                      <Skeleton className="w-full h-full" />
                    ) : radarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
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
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Clique em "Atualizar Riscos" para gerar análise</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Risk descriptions */}
                  {riskScores.length > 0 && (
                    <div className="mt-4 space-y-2 text-xs">
                      {riskScores.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className={`font-medium ${r.score >= 70 ? 'text-destructive' : r.score >= 50 ? 'text-accent' : 'text-success'}`}>
                            {r.category}:
                          </span>
                          <span className="line-clamp-1">{r.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                    {alerts.length > 0 && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive/20 text-destructive">
                        {alerts.length} alertas
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                    {loading ? (
                      [...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))
                    ) : alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="p-3 rounded-lg bg-secondary/30 border border-border/30"
                        >
                          <div className="flex items-start gap-3">
                            {alert.alert_type === 'critical' && <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
                            {alert.alert_type === 'warning' && <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />}
                            {alert.alert_type === 'info' && <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-foreground truncate">{alert.title}</h4>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                  alert.impact === 'high' ? 'bg-destructive/20 text-destructive' :
                                  alert.impact === 'medium' ? 'bg-accent/20 text-accent' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {getImpactLabel(alert.impact)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{alert.description}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {alert.region}
                                </span>
                                <span>{formatTimeAgo(alert.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum alerta ativo</p>
                      </div>
                    )}
                  </div>
              </motion.div>
              </div>

              {/* Risk History Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
              >
                <RiskHistoryChart />
              </motion.div>

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
                    {loading ? (
                      <Skeleton className="w-full h-full" />
                    ) : countryRisks.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryRisks} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis dataKey="country" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {countryRisks.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getRiskColor(entry.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Sem dados disponíveis</p>
                      </div>
                    )}
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
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {loading ? (
                      [...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))
                    ) : regulatoryEvents.length > 0 ? (
                      regulatoryEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
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
                            {index < regulatoryEvents.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">{event.event_date}</span>
                              {event.status === 'completed' && <CheckCircle className="w-3 h-3 text-success" />}
                              {event.impact_level === 'high' && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-destructive/20 text-destructive">
                                  Alto impacto
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-foreground mb-1">{event.title}</h4>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Scale className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum evento regulatório</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Risk Trend Info */}
              {riskScores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Resumo de Riscos</h3>
                      <p className="text-sm text-muted-foreground">Análise detalhada por categoria</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {riskScores.map((risk, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{risk.category}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${
                              risk.score >= 70 ? 'text-destructive' :
                              risk.score >= 50 ? 'text-accent' : 'text-success'
                            }`}>
                              {risk.score}
                            </span>
                            {risk.trend === 'up' && <TrendingUp className="w-4 h-4 text-destructive" />}
                            {risk.trend === 'down' && <TrendingDown className="w-4 h-4 text-success" />}
                            {risk.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.description}</p>
                        <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${risk.score}%`,
                              backgroundColor: getRiskColor(risk.score),
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Risk;
