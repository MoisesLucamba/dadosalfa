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
  CheckCircle,
  Info,
  MapPin,
  RefreshCw,
  Loader2,
  Clock,
  Minus,
  FileDown,
  ArrowUpRight,
  Activity,
  Zap,
  X
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
import { Progress } from "@/components/ui/progress";
import { RiskHistoryChart } from "@/components/dashboard/RiskHistoryChart";
import { GeopoliticalForecast } from "@/components/dashboard/GeopoliticalForecast";
import { RegulatoryImpactSimulator } from "@/components/dashboard/RegulatoryImpactSimulator";
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
  
  // ESTADO PARA O SIMULADOR (Controla a visibilidade)
  const [showSimulator, setShowSimulator] = useState(false);

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
    const total = riskScores.reduce((sum, r) => sum + (r.score * (weights[r.category] || 0.15)), 0);
    return Math.round(total);
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
                <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wider uppercase">
                  <Zap className="w-4 h-4 fill-current" />
                  Real-time Intelligence
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Risco & Geopolítica</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Monitorização avançada de ameaças regulatórias e dinâmicas de poder no setor energético.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="lg" className="rounded-full px-6 border-2 hover:bg-secondary/50 transition-all" 
                  onClick={() => generateRiskPDF({ riskScores, alerts, countryRisks, globalRiskIndex, lastUpdated: lastUpdated || undefined })}>
                  <FileDown className="w-4 h-4 mr-2" /> Exportar
                </Button>
                <Button size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
                  onClick={analyzeRisks} disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {analyzing ? "A processar..." : "Atualizar Inteligência"}
                </Button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                title="Índice Global" 
                value={globalRiskIndex} 
                subtitle={globalRiskIndex > 60 ? "Crítico" : globalRiskIndex > 40 ? "Alerta" : "Estável"}
                icon={<Shield className="w-5 h-5" />}
                color={globalRiskIndex > 60 ? "destructive" : globalRiskIndex > 40 ? "warning" : "success"}
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
                color={alerts.length > 0 ? "destructive" : "success"}
                loading={loading}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Radar Chart Section */}
              <div className="lg:col-span-7 space-y-8">
                <Card className="border-none shadow-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                    <div>
                      <CardTitle className="text-xl font-bold">Perfil de Risco Multidimensional</CardTitle>
                      <CardDescription>Análise vetorial por categoria de impacto</CardDescription>
                    </div>
                    <Activity className="w-5 h-5 text-primary" />
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="h-[400px] w-full">
                      {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={riskScores.map(r => ({ category: r.category, value: r.score }))}>
                            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }} />
                            <Radar
                              name="Risco"
                              dataKey="value"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.15}
                              strokeWidth={3}
                            />
                            <Tooltip content={<CustomRadarTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                      {riskScores.map((risk, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{risk.category}</span>
                            <span className={`text-sm font-black ${risk.score > 60 ? 'text-destructive' : 'text-primary'}`}>{risk.score}</span>
                          </div>
                          <Progress value={risk.score} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts & Simulator Button Section */}
              <div className="lg:col-span-5 space-y-8">
                <Card className="border-none shadow-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                    <div>
                      <CardTitle className="text-xl font-bold">Alertas de Segurança</CardTitle>
                      <CardDescription>Eventos críticos em tempo real</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full">{alerts.length} Ativos</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                      <AnimatePresence>
                        {alerts.map((alert, i) => (
                          <motion.div 
                            key={alert.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-5 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer group"
                          >
                            <div className="flex gap-4">
                              <div className={`mt-1 p-2 rounded-full h-fit ${
                                alert.alert_type === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                              }`}>
                                {alert.alert_type === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{alert.title}</h4>
                                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap ml-2">{formatTimeAgo(alert.created_at)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{alert.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                {/* SIMULATOR TRIGGER CARD */}
                <Card className="border-none shadow-xl bg-primary text-primary-foreground overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">Simulador de Impacto</CardTitle>
                    <CardDescription className="text-primary-foreground/70">Preveja mudanças regulatórias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-6 leading-relaxed">
                      Utilize o nosso motor de simulação para calcular o impacto de novas taxas e royalties no seu portfólio.
                    </p>
                    <Button 
                      variant="secondary" 
                      className="w-full rounded-full font-bold group"
                      onClick={() => setShowSimulator(true)} // AÇÃO PARA ABRIR O SIMULADOR
                    >
                      Abrir Simulador <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-border"
            >
              {/* Botão para fechar o simulador */}
              <button 
                onClick={() => setShowSimulator(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-2">
                {/* O COMPONENTE DO SIMULADOR É RENDERIZADO AQUI */}
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
  const colorMap = {
    primary: "text-primary bg-primary/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
    success: "text-success bg-success/10",
  };

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-black/40 backdrop-blur-md group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${colorMap[color as keyof typeof colorMap]}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant={trend === 'up' ? 'destructive' : 'success'} className="rounded-full px-2 py-0">
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
          {loading ? <Skeleton className="h-9 w-16" /> : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
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
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.category}</p>
        <p className="text-xl font-black text-primary">{payload[0].value}<span className="text-xs ml-1">Score</span></p>
      </div>
    );
  }
  return null;
};

export default Risk;