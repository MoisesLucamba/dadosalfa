import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  FileText, 
  Download,
  Calendar,
  Clock,
  Eye,
  Sparkles,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Ship,
  AlertTriangle,
  Plus,
  Loader2,
  RefreshCw,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Report {
  id: string;
  title: string;
  type: string;
  period: string | null;
  pages: number | null;
  status: string;
  ai_generated: boolean;
  summary: string | null;
  download_count: number;
  created_at: string;
  content: any;
}

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  next_run: string | null;
  recipients: number;
  is_active: boolean;
}

const reportCategories = [
  { name: "Produção", type: "production", icon: BarChart3, color: "bg-primary" },
  { name: "Mercado", type: "market", icon: TrendingUp, color: "bg-accent" },
  { name: "Exportações", type: "exports", icon: Ship, color: "bg-success" },
  { name: "Risco", type: "risk", icon: AlertTriangle, color: "bg-destructive" },
];

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Dialog states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("production");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(true);
  
  // Schedule dialog states
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleRecipients, setScheduleRecipients] = useState(1);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledReports(data || []);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchScheduledReports();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          reportType: selectedReportType,
          period: selectedPeriod || undefined,
          userId: user?.id,
          aiGenerated: isAiGenerated,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Relatório gerado com sucesso!");
        fetchReports();
        setShowGenerateDialog(false);
      } else {
        throw new Error(data?.error || "Erro ao gerar relatório");
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const scheduleReport = async () => {
    if (!scheduleName) {
      toast.error("Por favor, insira um nome para o agendamento");
      return;
    }

    try {
      const nextRun = new Date();
      switch (scheduleFrequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }

      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: user?.id,
          name: scheduleName,
          report_type: selectedReportType,
          frequency: scheduleFrequency,
          next_run: nextRun.toISOString(),
          recipients: scheduleRecipients,
        });

      if (error) throw error;

      toast.success("Relatório agendado com sucesso!");
      fetchScheduledReports();
      setShowScheduleDialog(false);
      setScheduleName("");
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error("Erro ao agendar relatório");
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      // Record download
      await supabase.from('report_downloads').insert({
        report_id: report.id,
        user_id: user?.id,
      });

      // Update download count
      await supabase
        .from('reports')
        .update({ download_count: (report.download_count || 0) + 1 })
        .eq('id', report.id);

      // Generate and download content
      const content = JSON.stringify(report.content, null, 2);
      const blob = new Blob([`${report.title}\n\n${report.summary || ''}\n\nDados:\n${content}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!");
      fetchReports();
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error("Erro no download");
    }
  };

  const deleteScheduledReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Agendamento removido");
      fetchScheduledReports();
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast.error("Erro ao remover agendamento");
    }
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by tab
    if (activeTab === 'ai') {
      filtered = filtered.filter(r => r.ai_generated);
    } else if (activeTab === 'normal') {
      filtered = filtered.filter(r => !r.ai_generated);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(r => r.type === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query) ||
        r.period?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, activeTab, selectedCategory, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalReports = reports.length;
    const totalDownloads = reports.reduce((sum, r) => sum + (r.download_count || 0), 0);
    const aiReports = reports.filter(r => r.ai_generated).length;
    const aiPercentage = totalReports > 0 ? Math.round((aiReports / totalReports) * 100) : 0;
    const activeSchedules = scheduledReports.filter(s => s.is_active).length;

    return { totalReports, totalDownloads, aiPercentage, activeSchedules };
  }, [reports, scheduledReports]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return reportCategories.map(cat => ({
      ...cat,
      count: reports.filter(r => r.type === cat.type).length,
    }));
  }, [reports]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "production": return <BarChart3 className="w-4 h-4" />;
      case "market": return <TrendingUp className="w-4 h-4" />;
      case "exports": return <Ship className="w-4 h-4" />;
      case "risk": return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "production": return "Produção";
      case "market": return "Mercado";
      case "exports": return "Exportações";
      case "risk": return "Risco";
      case "predictions": return "Previsões";
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Report highlights from recent reports
  const reportHighlights = useMemo(() => {
    return reports
      .filter(r => r.content?.highlights)
      .slice(0, 3)
      .flatMap(r => (r.content?.highlights || []).map((h: any) => ({
        ...h,
        source: r.title,
      })));
  }, [reports]);

  return (
    <>
      <Helmet>
        <title>Relatórios | AlphaData</title>
        <meta
          name="description"
          content="Relatórios inteligentes e automatizados sobre o setor petrolífero angolano. PDFs mensais com insights e análises."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/reports" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/reports" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Relatórios Inteligentes</h1>
                  <p className="text-muted-foreground">Análises automatizadas e insights gerados por IA</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowScheduleDialog(true)}
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar
                  </Button>
                  <Button
                    onClick={() => setShowGenerateDialog(true)}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar Novo Relatório
                  </Button>
                </div>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Relatórios Gerados</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalReports}</div>
                  <span className="text-xs text-muted-foreground">este mês</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl border border-primary/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Downloads</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalDownloads}</div>
                  <span className="text-xs text-muted-foreground">total</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-accent/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">Agendados</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.activeSchedules}</div>
                  <span className="text-xs text-muted-foreground">relatórios activos</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-border/50 p-4 card-gradient"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Gerados por IA</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.aiPercentage}%</div>
                  <span className="text-xs text-muted-foreground">dos relatórios</span>
                </motion.div>
              </div>

              {/* Categories & Search */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4">Categorias</h3>
                  <div className="space-y-3">
                    <motion.div
                      onClick={() => setSelectedCategory(null)}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                        !selectedCategory ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">Todos</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{reports.length}</span>
                    </motion.div>
                    {categoryCounts.map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                        onClick={() => setSelectedCategory(selectedCategory === category.type ? null : category.type)}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer group ${
                          selectedCategory === category.type ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category.color}/20`}>
                            <category.icon className={`w-4 h-4 ${category.color.replace('bg-', 'text-')}`} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{category.count}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="lg:col-span-3 rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Relatórios Recentes</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 w-48 bg-secondary/50 border-border/50"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchReports}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                    <TabsList className="bg-secondary/50">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="ai" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        IA
                      </TabsTrigger>
                      <TabsTrigger value="normal">Normais</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))
                    ) : filteredReports.length > 0 ? (
                      filteredReports.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                              {getTypeIcon(report.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{report.title}</h4>
                                {report.ai_generated && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-primary/20 text-primary">
                                    <Sparkles className="w-3 h-3" />
                                    IA
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{getTypeName(report.type)}</span>
                                <span>•</span>
                                <span>{report.period}</span>
                                {report.pages && (
                                  <>
                                    <span>•</span>
                                    <span>{report.pages} páginas</span>
                                  </>
                                )}
                                {report.download_count > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{report.download_count} downloads</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {report.status === 'ready' ? (
                              <>
                                <span className="text-xs text-muted-foreground">{formatDate(report.created_at)}</span>
                                <button 
                                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                  onClick={() => toast.info(report.summary || "Sem resumo disponível")}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  onClick={() => handleDownload(report)}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-2 text-xs text-accent">
                                <Clock className="w-3 h-3 animate-spin" />
                                A processar...
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum relatório encontrado</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setShowGenerateDialog(true)}
                        >
                          Gerar primeiro relatório
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Scheduled Reports & Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scheduled Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Relatórios Agendados</h3>
                      <p className="text-sm text-muted-foreground">Geração automática configurada</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {scheduledReports.length > 0 ? (
                      scheduledReports.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{report.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary capitalize">
                                {report.frequency === 'daily' ? 'Diário' : report.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                              </span>
                              <button 
                                onClick={() => deleteScheduledReport(report.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Próximo: {report.next_run ? formatDate(report.next_run) : 'N/A'}
                            </span>
                            <span>{report.recipients} destinatário(s)</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum agendamento</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowScheduleDialog(true)}
                        >
                          Criar agendamento
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Report Highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Destaques Recentes</h3>
                      <p className="text-sm text-muted-foreground">Principais insights dos relatórios</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-4">
                    {reportHighlights.length > 0 ? (
                      reportHighlights.map((highlight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-full ${
                              highlight.trend === 'up' ? 'bg-success/20 text-success' :
                              highlight.trend === 'down' ? 'bg-destructive/20 text-destructive' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {highlight.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                               highlight.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                               <BarChart3 className="w-3 h-3" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground mb-1">{highlight.title}</h4>
                              <p className="text-lg font-bold text-foreground">{highlight.value}</p>
                              <span className="text-xs text-primary">{highlight.source}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Gere relatórios para ver destaques</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Novo Relatório</DialogTitle>
            <DialogDescription>
              Selecione o tipo de relatório e período para gerar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="market">Mercado & Preços</SelectItem>
                  <SelectItem value="exports">Exportações</SelectItem>
                  <SelectItem value="risk">Avaliação de Riscos</SelectItem>
                  <SelectItem value="predictions">Previsões IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (opcional)</label>
              <Input
                placeholder="Ex: Novembro 2024"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aiGenerated"
                checked={isAiGenerated}
                onChange={(e) => setIsAiGenerated(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="aiGenerated" className="text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                Gerar com análise de IA
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={generateReport} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Relatório</DialogTitle>
            <DialogDescription>
              Configure a geração automática de relatórios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Agendamento</label>
              <Input
                placeholder="Ex: Relatório Semanal de Preços"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="market">Mercado & Preços</SelectItem>
                  <SelectItem value="exports">Exportações</SelectItem>
                  <SelectItem value="risk">Avaliação de Riscos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequência</label>
              <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destinatários</label>
              <Input
                type="number"
                min={1}
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={scheduleReport} className="gap-2">
              <Calendar className="w-4 h-4" />
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reports;
