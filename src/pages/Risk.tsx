import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
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
  Info,
  MapPin,
  RefreshCw,
  Loader2,
  Clock,
  FileDown,
  ArrowUpRight,
  Activity,
  Zap,
  X,
  Flame,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskHistoryChart } from "@/components/dashboard/RiskHistoryChart";
import { RegulatoryImpactSimulator } from "@/components/dashboard/RegulatoryImpactSimulator";
import { EnergyTransitionRisk } from "@/components/dashboard/EnergyTransitionRisk";
import { DataDepthBadge } from "@/components/dashboard/DataDepthBadge";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { generateRiskPDF } from "@/utils/generateRiskPDF";

// --- Interfaces ---
interface RiskScore {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface RiskAlert {
  id: string;
  alert_type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  region: string;
  created_at: string;
}

interface CountryRisk {
  country: string;
  score: number;
  trend: string;
}

const Risk = () => {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [countryRisks, setCountryRisks] = useState<CountryRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [activeTab, setActiveTab] = useState<'risk' | 'transition'>('risk');

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const [riskResult, alertsResult, countryResult] = await Promise.all([
        supabase.from('risk_data').select('*').order('created_at', { ascending: false }),
        supabase.from('risk_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('country_risk').select('*').order('data_date', { ascending: false }),
      ]);

      if (riskResult.data?.length) {
        const latestByCategory = riskResult.data.reduce((acc: Record<string, RiskScore>, item) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              category: getCategoryName(item.category),
              score: item.score,
              trend: item.trend as any,
              description: item.description,
            };
          }
          return acc;
        }, {});
        setRiskScores(Object.values(latestByCategory));
        setLastUpdated(riskResult.data[0]?.updated_at);
      }

      if (alertsResult.data?.length) setAlerts(alertsResult.data as any);
      if (countryResult.data?.length) {
        const latestByCountry = countryResult.data.reduce((acc: Record<string, CountryRisk>, item) => {
          if (!acc[item.country]) {
            acc[item.country] = { country: item.country, score: item.score, trend: item.trend };
          }
          return acc;
        }, {});
        setCountryRisks(Object.values(latestByCountry));
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
      toast.error("Erro ao carregar dados de risco");
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
        toast.success("Análise de riscos atualizada!");
        fetchRiskData();
      }
    } catch (error) {
      toast.error("Erro ao processar análise");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { fetchRiskData(); }, []);

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

  const globalRiskIndex = useMemo(() => {
    if (riskScores.length === 0) return 0;
    const weights: Record<string, number> = {
      "Geopolítico": 0.25, "Regulatório": 0.2, "Fiscal": 0.2,
      "Operacional": 0.15, "Cambial": 0.1, "Ambiental": 0.1,
    };
    return Math.round(riskScores.reduce((sum, r) => sum + (r.score * (weights[r.category] || 0.15)), 0));
  }, [riskScores]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours > 24) return `há ${Math.floor(hours / 24)} dias`;
    if (hours > 0) return `há ${hours}h`;
    return `há ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] overflow-hidden font-sans">
      <Helmet>
        <title>Risk Intelligence | AlphaData</title>
      </Helmet>

      <Sidebar activeItem="/risk" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeItem="/risk" />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-none">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                {/* Sector badge */}
                <div className="flex items-center gap-2 font-semibold text-xs tracking-[0.15em] uppercase text-red-600 dark:text-red-500">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Petroleum Risk Intelligence
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Risco & Geopolítica</h1>
                <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
                  Monitorização avançada de ameaças regulatórias e dinâmicas de poder no setor energético.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(lastUpdated)}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-6 border-2 hover:bg-secondary/50 transition-all"
                  onClick={() => generateRiskPDF({ riskScores, alerts, countryRisks, geopoliticalForecasts: [], globalRiskIndex, lastUpdated: lastUpdated || undefined })}>
                  <FileDown className="w-4 h-4 mr-2" /> Exportar
                </Button>
                <Button
                  size="lg"
                  className="rounded-full px-6 bg-red-700 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white border-0 shadow-lg shadow-red-900/30 hover:shadow-red-700/40 transition-all"
                  onClick={analyzeRisks}
                  disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {analyzing ? "A processar..." : "Atualizar Inteligência"}
                </Button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <KPICard 
                title="Índice Global" 
                value={globalRiskIndex} 
                subtitle={
                  globalRiskIndex > 70 ? "Crítico" :
                  globalRiskIndex > 50 ? "Elevado" :
                  globalRiskIndex > 30 ? "Moderado" : "Estável"
                }
                icon={<Shield className="w-5 h-5" />}
                color={
                  globalRiskIndex > 70 ? "destructive" :
                  globalRiskIndex > 50 ? "warning" :
                  globalRiskIndex > 30 ? "caution" : "success"
                }
                loading={loading}
              />
              <KPICard 
                title="Geopolítico" 
                value={riskScores.find(r => r.category === 'Geopolítico')?.score || 0} 
                trend={riskScores.find(r => r.category === 'Geopolítico')?.trend}
                icon={<Globe className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard 
                title="Regulatório" 
                value={riskScores.find(r => r.category === 'Regulatório')?.score || 0} 
                subtitle="Impacto Médio"
                icon={<Scale className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard 
                title="Alertas Ativos" 
                value={alerts.length} 
                subtitle={`${alerts.filter(a => a.alert_type === 'critical').length} Críticos`}
                icon={<AlertTriangle className="w-5 h-5" />}
                color={
                  alerts.filter(a => a.alert_type === 'critical').length > 0 ? "destructive" :
                  alerts.length > 0 ? "warning" : "success"
                }
                loading={loading}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Radar Chart Section */}
              <div className="lg:col-span-7 space-y-8">
                <Card className="border border-border/50 shadow-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                    <div>
                      <CardTitle className="text-xl font-bold">Perfil de Risco Multidimensional</CardTitle>
                      <CardDescription>Análise vectorial por categoria de impacto</CardDescription>
                    </div>
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500 dark:text-red-400">
                      <Activity className="w-5 h-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="h-[400px] w-full">
                      {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={riskScores.map(r => ({ category: r.category, value: r.score }))}>
                            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                            <PolarAngleAxis
                              dataKey="category"
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                            />
                            <Radar
                              name="Risco"
                              dataKey="value"
                              stroke="#dc2626"
                              fill="#dc2626"
                              fillOpacity={0.12}
                              strokeWidth={2.5}
                            />
                            <Tooltip content={<CustomRadarTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                      {riskScores.map((risk, i) => {
                        // Semantic risk colors for petroleum sector
                        const scoreTextColor =
                          risk.score > 70 ? "text-red-600 dark:text-red-400" :
                          risk.score > 50 ? "text-orange-500 dark:text-orange-400" :
                          risk.score > 30 ? "text-amber-500 dark:text-amber-400" :
                          "text-emerald-600 dark:text-emerald-400";
                        const barColor =
                          risk.score > 70 ? "bg-red-600 dark:bg-red-500" :
                          risk.score > 50 ? "bg-orange-500 dark:bg-orange-400" :
                          risk.score > 30 ? "bg-amber-500 dark:bg-amber-400" :
                          "bg-emerald-600 dark:bg-emerald-400";
                        return (
                          <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-red-500/20 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em]">{risk.category}</span>
                              <span className={`text-sm font-black ${scoreTextColor}`}>{risk.score}</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                                style={{ width: `${risk.score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts & Simulator Section */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border border-border/50 shadow-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                    <div>
                      <CardTitle className="text-xl font-bold">Alertas de Segurança</CardTitle>
                      <CardDescription>Eventos críticos em tempo real</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5"
                    >
                      {alerts.length} Ativos
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                      <AnimatePresence>
                        {alerts.map((alert, i) => (
                          <motion.div 
                            key={alert.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="p-5 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer group"
                          >
                            <div className="flex gap-4">
                              <div className={`mt-0.5 p-2 rounded-lg h-fit shrink-0 ${
                                alert.alert_type === 'critical'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : alert.alert_type === 'warning'
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}>
                                {alert.alert_type === 'critical'
                                  ? <AlertTriangle className="w-4 h-4" />
                                  : alert.alert_type === 'warning'
                                  ? <AlertCircle className="w-4 h-4" />
                                  : <Info className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">{alert.title}</h4>
                                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap shrink-0">{formatTimeAgo(alert.created_at)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{alert.description}</p>
                                {alert.region && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono mt-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {alert.region}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                {/* SIMULATOR TRIGGER CARD */}
                <Card className="border border-red-900/20 dark:border-red-900/30 shadow-xl overflow-hidden relative bg-gradient-to-br from-red-950/40 via-[#1a0808]/60 to-background dark:from-red-950/50">
                  {/* Subtle noise texture overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      backgroundSize: '128px',
                    }}
                  />
                  <div className="absolute top-0 right-0 p-6 opacity-[0.07]">
                    <Activity className="w-28 h-28 text-red-500" />
                  </div>
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-red-500 dark:text-red-400 mb-1">
                      <Zap className="w-3 h-3 fill-current" />
                      Motor de Simulação
                    </div>
                    <CardTitle className="text-lg">Simulador de Impacto</CardTitle>
                    <CardDescription>Preveja mudanças regulatórias</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm mb-6 leading-relaxed text-muted-foreground">
                      Utilize o nosso motor de simulação para calcular o impacto de novas taxas e royalties no seu portfólio.
                    </p>
                    <Button 
                      className="w-full rounded-full font-bold bg-red-700 hover:bg-red-600 text-white border-0 shadow-md shadow-red-900/30 hover:shadow-red-700/40 transition-all group"
                      onClick={() => setShowSimulator(true)}
                    >
                      Abrir Simulador
                      <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* History Chart */}
            <div className="grid grid-cols-1 gap-8">
              <RiskHistoryChart />
            </div>

          </div>
        </main>
      </div>

      {/* --- MODAL DO SIMULADOR --- */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="bg-background w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-border scrollbar-none"
            >
              {/* Close button */}
              <button 
                onClick={() => setShowSimulator(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-secondary hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-2">
                <RegulatoryImpactSimulator />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---
const KPICard = ({ title, value, subtitle, trend, icon, color = "primary", loading }: any) => {
  // Semantic color map — petroleum risk perception
  const colorMap: Record<string, { iconCls: string; valCls: string; bgCls: string }> = {
    primary:     { iconCls: "text-primary",        valCls: "text-foreground",     bgCls: "bg-primary/10"      },
    destructive: { iconCls: "text-red-600 dark:text-red-400",    valCls: "text-red-600 dark:text-red-400",    bgCls: "bg-red-500/10"     },
    warning:     { iconCls: "text-orange-600 dark:text-orange-400", valCls: "text-orange-600 dark:text-orange-400", bgCls: "bg-orange-500/10" },
    caution:     { iconCls: "text-amber-600 dark:text-amber-400",  valCls: "text-amber-600 dark:text-amber-400",  bgCls: "bg-amber-500/10"  },
    success:     { iconCls: "text-emerald-600 dark:text-emerald-400", valCls: "text-emerald-600 dark:text-emerald-400", bgCls: "bg-emerald-500/10" },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-black/40 backdrop-blur-md group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className={`p-3 rounded-2xl ${c.bgCls} ${c.iconCls}`}>
            {icon}
          </div>
          {trend && (
            <div className={`p-1.5 rounded-lg ${
              trend === 'up'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              {trend === 'up'
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
          {loading ? <Skeleton className="h-9 w-16" /> : (
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-black tracking-tighter ${c.valCls}`}>{value}</h3>
              <span className="text-xs font-bold text-muted-foreground">/100</span>
            </div>
          )}
          {subtitle && <p className="text-xs font-semibold text-muted-foreground/70">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const CustomRadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const color =
    score > 70 ? "#dc2626" :
    score > 50 ? "#f97316" :
    score > 30 ? "#f59e0b" :
    "#10b981";
  return (
    <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 font-mono">
        {payload[0].payload.category}
      </p>
      <p className="text-2xl font-black" style={{ color }}>
        {score}
        <span className="text-xs ml-1 text-muted-foreground font-normal">Score</span>
      </p>
    </div>
  );
};

export default Risk;