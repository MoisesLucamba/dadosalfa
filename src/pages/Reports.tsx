import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  FileSpreadsheet,
  FileType,
  Users,
  Share2,
  ArrowUpRight,
  MoreVertical,
  Trash2,
  Flame,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadReport, ReportData } from "@/utils/generateReportDocument";
import { WorkspacePanel } from "@/components/workspace/WorkspacePanel";
import { useWorkspaces, useWorkspaceReports } from "@/hooks/useWorkspaces";
import { LanguageDownloadDialog } from "@/components/reports/LanguageDownloadDialog";
import { DocumentLanguageCode } from "@/i18n";

// --- Interfaces ---
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

// --- Constants & Helpers ---
const reportCategories = [
  { name: "Geral",       type: "general",    icon: FileText,     color: "text-sky-400",    bg: "bg-sky-400/10"    },
  { name: "Produção",    type: "production", icon: BarChart3,    color: "text-violet-400", bg: "bg-violet-400/10" },
  { name: "Mercado",     type: "market",     icon: TrendingUp,   color: "text-emerald-400",bg: "bg-emerald-400/10"},
  { name: "Exportações", type: "exports",    icon: Ship,         color: "text-amber-400",  bg: "bg-amber-400/10"  },
  { name: "Risco",       type: "risk",       icon: AlertTriangle,color: "text-red-400",    bg: "bg-red-400/10"    },
];

const getTypeName = (type: string) => {
  const cat = reportCategories.find(c => c.type === type);
  return cat ? cat.name : type;
};

const getTypeIcon = (type: string) => {
  const cat = reportCategories.find(c => c.type === type);
  const Icon = cat ? cat.icon : FileText;
  return <Icon className="w-4 h-4" />;
};

const getTypeColor = (type: string) => {
  const cat = reportCategories.find(c => c.type === type);
  return cat ? { color: cat.color, bg: cat.bg } : { color: "text-slate-400", bg: "bg-slate-400/10" };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// --- Main Component ---
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
  const [generateLanguage, setGenerateLanguage] = useState<DocumentLanguageCode>("pt");
  
  // Schedule dialog states
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleRecipients, setScheduleRecipients] = useState(1);

  // Workspace states
  const [showWorkspacePanel, setShowWorkspacePanel] = useState(false);
  const { workspaces } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const { shareReport } = useWorkspaceReports(selectedWorkspaceId);

  // Language download dialog state
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedReportForDownload, setSelectedReportForDownload] = useState<Report | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Data Fetching ---
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
      toast.error("Erro ao carregar relatórios");
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

  // --- Actions ---
  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          reportType: selectedReportType,
          period: selectedPeriod || undefined,
          userId: user?.id,
          aiGenerated: isAiGenerated,
          language: generateLanguage,
        },
      });
      if (error) throw error;
      if (data?.success) {
        const successMsg = { pt: "Relatório gerado com sucesso!", en: "Report generated successfully!", fr: "Rapport généré avec succès!" };
        toast.success(successMsg[generateLanguage] || successMsg.pt);
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
        case 'daily':   nextRun.setDate(nextRun.getDate() + 1);       break;
        case 'weekly':  nextRun.setDate(nextRun.getDate() + 7);       break;
        case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1);     break;
      }
      const { error } = await supabase.from('scheduled_reports').insert({
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

  const openDownloadDialog = (report: Report) => {
    setSelectedReportForDownload(report);
    setShowLanguageDialog(true);
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'excel', language: DocumentLanguageCode) => {
    if (!selectedReportForDownload) return;
    setIsDownloading(true);
    const loadingToast = toast.loading(`A gerar ${format.toUpperCase()} em ${language.toUpperCase()}...`);
    try {
      const report = selectedReportForDownload;
      await supabase.from('report_downloads').insert({ report_id: report.id, user_id: user?.id });
      await supabase.from('reports').update({ download_count: (report.download_count || 0) + 1 }).eq('id', report.id);
      const fallbacks = {
        pt: { title: 'Relatório AlphaData', period: 'Actual', summary: 'Relatório gerado pela plataforma AlphaData.' },
        en: { title: 'AlphaData Report', period: 'Current', summary: 'Report generated by the AlphaData platform.' },
        fr: { title: 'Rapport AlphaData', period: 'Actuel', summary: 'Rapport généré par la plateforme AlphaData.' },
      };
      const fb = fallbacks[language] || fallbacks.pt;
      const reportData: ReportData = {
        title:       report.title || fb.title,
        type:        report.type || 'production',
        period:      report.period || fb.period,
        summary:     report.summary || fb.summary,
        content:     report.content || { data: {} },
        highlights:  report.content?.highlights || [],
        generatedAt: report.created_at ? new Date(report.created_at) : new Date(),
        aiGenerated: report.ai_generated || false,
        language,
      };
      await downloadReport(reportData, format, language);
      toast.dismiss(loadingToast);
      toast.success(`Download ${format.toUpperCase()} concluído!`);
      setShowLanguageDialog(false);
      setSelectedReportForDownload(null);
      fetchReports();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error downloading:', error);
      toast.error(`Erro no download: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const deleteScheduledReport = async (id: string) => {
    try {
      const { error } = await supabase.from('scheduled_reports').delete().eq('id', id);
      if (error) throw error;
      toast.success("Agendamento removido");
      fetchScheduledReports();
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast.error("Erro ao remover agendamento");
    }
  };

  const handleShareToWorkspace = async (report: Report, workspaceId: string) => {
    try {
      const { error } = await supabase.from('workspace_reports').insert({
        workspace_id: workspaceId,
        report_id: report.id,
        shared_by: user?.id,
      });
      if (error) throw error;
      toast.success("Relatório partilhado com sucesso!");
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error("Erro ao partilhar relatório");
    }
  };

  // --- Computed Data ---
  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (activeTab === 'ai')     filtered = filtered.filter(r => r.ai_generated);
    else if (activeTab === 'normal') filtered = filtered.filter(r => !r.ai_generated);
    if (selectedCategory) filtered = filtered.filter(r => r.type === selectedCategory);
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

  const stats = useMemo(() => {
    const total         = reports.length;
    const aiGenerated   = reports.filter(r => r.ai_generated).length;
    const downloads     = reports.reduce((acc, r) => acc + (r.download_count || 0), 0);
    const aiPercentage  = total > 0 ? Math.round((aiGenerated / total) * 100) : 0;
    return { total, aiGenerated, downloads, aiPercentage };
  }, [reports]);

  const categoryCounts = useMemo(() =>
    reportCategories.map(cat => ({
      ...cat,
      count: reports.filter(r => r.type === cat.type).length
    })), [reports]);

  const reportHighlights = useMemo(() => {
    const highlights: any[] = [];
    reports.slice(0, 3).forEach(report => {
      if (report.content?.highlights && Array.isArray(report.content.highlights)) {
        report.content.highlights.slice(0, 1).forEach((h: any) => {
          highlights.push({ ...h, source: report.title });
        });
      }
    });
    return highlights;
  }, [reports]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Helmet>
        <title>Relatórios | AlphaData</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Ambient glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/5 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-sky-900/5 blur-[120px] rounded-full pointer-events-none" />

          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* ── Page Header ── */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Petroleum sector badge */}
                    <Badge
                      variant="outline"
                      className="bg-red-600/10 text-red-500 border-red-600/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-bold gap-1.5"
                    >
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      Analytics Hub
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">Relatórios</h1>
                  <p className="text-muted-foreground mt-2 max-w-md leading-relaxed">
                    Gerencie, visualize e automatize os seus insights baseados em dados com inteligência artificial.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setShowWorkspacePanel(true)}
                    className="border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Workspaces
                  </Button>
                  <Button 
                    onClick={() => setShowGenerateDialog(true)}
                    className="bg-red-700 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-900/30 hover:shadow-red-700/40 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Relatório
                  </Button>
                </motion.div>
              </div>

              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total de Relatórios", value: stats.total,        icon: FileText,  colorCls: "text-sky-400",    bgCls: "bg-sky-400/10"    },
                  { label: "Downloads Realizados", value: stats.downloads,    icon: Download,  colorCls: "text-emerald-400",bgCls: "bg-emerald-400/10"},
                  { label: "Análises de IA",       value: stats.aiGenerated, icon: Sparkles,  colorCls: "text-violet-400", bgCls: "bg-violet-400/10" },
                  { label: "Eficiência IA",        value: `${stats.aiPercentage}%`, icon: BarChart3, colorCls: "text-amber-400", bgCls: "bg-amber-400/10"  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="group p-5 rounded-2xl bg-card border border-border hover:border-red-600/20 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${stat.bgCls} ${stat.colorCls} group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* ── Main Content Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Categories & Filters */}
                <div className="lg:col-span-3 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-card border border-border"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-5">Categorias</h3>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                          !selectedCategory
                            ? 'bg-red-700 text-white shadow-lg shadow-red-900/30'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">Todos</span>
                        </div>
                        <span className="text-xs opacity-60">{reports.length}</span>
                      </button>
                      
                      {categoryCounts.map((cat) => (
                        <button
                          key={cat.type}
                          onClick={() => setSelectedCategory(selectedCategory === cat.type ? null : cat.type)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                            selectedCategory === cat.type
                              ? 'bg-secondary text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                              <cat.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Quick Insights Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 via-red-950/10 to-transparent border border-red-900/20"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-red-400" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.15em]">IA Insights</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Os seus relatórios gerados por IA aumentaram{" "}
                      <span className="text-red-400 font-bold">12%</span> este mês. A precisão dos dados está em{" "}
                      <span className="text-foreground font-bold">98.4%</span>.
                    </p>
                  </motion.div>
                </div>

                {/* Right Column: Reports List */}
                <div className="lg:col-span-9 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="bg-card border border-border p-1 h-11 rounded-xl">
                        <TabsTrigger value="all"    className="rounded-lg px-6 data-[state=active]:bg-secondary data-[state=active]:text-foreground">Todos</TabsTrigger>
                        <TabsTrigger value="ai"     className="rounded-lg px-6 gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground">
                          <Sparkles className="w-3 h-3" /> IA
                        </TabsTrigger>
                        <TabsTrigger value="normal" className="rounded-lg px-6 data-[state=active]:bg-secondary data-[state=active]:text-foreground">Padrão</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar relatórios..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-card border-border focus:ring-red-600/30 h-11 rounded-xl"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchReports}
                        className="h-11 w-11 bg-card border-border hover:bg-secondary rounded-xl"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Report List */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                        ))
                      ) : filteredReports.length > 0 ? (
                        filteredReports.map((report, index) => {
                          const typeColors = getTypeColor(report.type);
                          return (
                            <motion.div
                              key={report.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97 }}
                              transition={{ delay: index * 0.04 }}
                              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-red-600/20 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-5">
                                <div className={`hidden sm:flex p-3 rounded-xl ${typeColors.bg} ${typeColors.color} border border-border group-hover:border-red-600/15 transition-colors`}>
                                  {getTypeIcon(report.type)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-foreground group-hover:text-foreground transition-colors">{report.title}</h4>
                                    {report.ai_generated && (
                                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] h-5 px-1.5 gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /> IA
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-border" />
                                      {getTypeName(report.type)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-border" />
                                      {report.period}
                                    </span>
                                    {report.pages && (
                                      <span className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-border" />
                                        {report.pages} pág.
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-border" />
                                      {formatDate(report.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-4 sm:mt-0 ml-auto sm:ml-0">
                                {report.status === 'ready' ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toast.info(report.summary || "Sem resumo disponível")}
                                      className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="h-9 px-4 bg-card border-border hover:bg-secondary text-foreground rounded-lg gap-2 hover:border-red-600/25 transition-all"
                                        >
                                          <Download className="w-4 h-4" />
                                          <span className="text-xs font-medium">Baixar</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-card border-border text-foreground w-48 p-1">
                                        <DropdownMenuItem onClick={() => openDownloadDialog(report)} className="rounded-lg focus:bg-secondary py-2.5">
                                          <Download className="w-4 h-4 mr-3 text-red-500" /> Descarregar...
                                        </DropdownMenuItem>
                                        {workspaces.length > 0 && (
                                          <>
                                            <DropdownMenuSeparator className="bg-border" />
                                            {workspaces.map(ws => (
                                              <DropdownMenuItem 
                                                key={ws.id}
                                                onClick={() => handleShareToWorkspace(report, ws.id)}
                                                className="rounded-lg focus:bg-secondary py-2.5"
                                              >
                                                <Share2 className="w-4 h-4 mr-3 text-muted-foreground" /> Partilhar: {ws.name}
                                              </DropdownMenuItem>
                                            ))}
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-2 py-1 px-3">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Processando
                                  </Badge>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-20 bg-card border border-dashed border-border rounded-3xl"
                        >
                          <div className="p-4 rounded-full bg-secondary/50 w-fit mx-auto mb-4">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground">Nenhum relatório encontrado</h3>
                          <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou crie um novo relatório.</p>
                          <Button
                            variant="outline"
                            className="mt-6 border-border hover:bg-secondary"
                            onClick={() => setShowGenerateDialog(true)}
                          >
                            Gerar primeiro relatório
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* ── Bottom Section: Schedules & Highlights ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Scheduled Reports */}
                <Card className="bg-card border-border rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-6">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Agendamentos</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Automação de dados</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowScheduleDialog(true)}
                      className="hover:bg-secondary hover:text-red-500 rounded-xl transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {scheduledReports.length > 0 ? (
                        scheduledReports.map((report) => (
                          <div key={report.id} className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between group hover:border-red-600/15 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-red-600/10 text-red-500">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{report.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                                    {report.frequency === 'daily' ? 'Diário' : report.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Próximo: {report.next_run ? formatDate(report.next_run) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteScheduledReport(report.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">Nenhum agendamento ativo</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Highlights */}
                <Card className="bg-card border-border rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-6">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Destaques</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Insights Recentes</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {reportHighlights.length > 0 ? (
                        reportHighlights.map((highlight, index) => (
                          <div key={index} className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-start gap-4 hover:border-border/80 transition-colors">
                            <div className={`p-2 rounded-xl ${
                              highlight.trend === 'up'   ? 'bg-emerald-500/10 text-emerald-500' :
                              highlight.trend === 'down' ? 'bg-red-500/10 text-red-500' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {highlight.trend === 'up'   ? <TrendingUp className="w-4 h-4" /> :
                               highlight.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                               <BarChart3 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{highlight.title}</h4>
                                <span className="text-[10px] text-red-500 font-medium">{highlight.source}</span>
                              </div>
                              <p className="text-xl font-bold text-foreground mt-1">{highlight.value}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">Gere relatórios para ver insights</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* ── Dialogs ── */}

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gerar Novo Relatório</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure os parâmetros para a análise de dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Tipo de Relatório</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger className="bg-secondary border-border h-12 rounded-xl focus:ring-red-600/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="general">📊 Relatório Geral (6+ páginas)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="market">Mercado & Preços</SelectItem>
                  <SelectItem value="exports">Exportações</SelectItem>
                  <SelectItem value="risk">Avaliação de Riscos</SelectItem>
                  <SelectItem value="predictions">Previsões IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Período</label>
              <Input
                placeholder="Ex: Novembro 2024"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-secondary border-border h-12 rounded-xl focus:ring-red-600/30"
              />
            </div>
            {/* AI Toggle */}
            <div 
              onClick={() => setIsAiGenerated(!isAiGenerated)}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                isAiGenerated ? 'bg-violet-500/10 border-violet-500/25' : 'bg-secondary/50 border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isAiGenerated ? 'bg-violet-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Análise Inteligente</p>
                  <p className="text-[10px] text-muted-foreground">Utilizar IA para gerar insights</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isAiGenerated ? 'bg-violet-500' : 'bg-border'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow transition-all ${isAiGenerated ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowGenerateDialog(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={generateReport}
              disabled={generating}
              className="bg-red-700 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-900/30 rounded-xl px-8 font-bold transition-all"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {generating ? "Gerando..." : "Gerar Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Agendar Relatório</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure a geração automática recorrente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Nome do Agendamento</label>
              <Input
                placeholder="Ex: Relatório Semanal de Preços"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="bg-secondary border-border h-12 rounded-xl focus:ring-red-600/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Frequência</label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger className="bg-secondary border-border h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Destinatários</label>
                <Input
                  type="number"
                  min={1}
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(parseInt(e.target.value) || 1)}
                  className="bg-secondary border-border h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowScheduleDialog(false)} className="text-muted-foreground hover:text-foreground rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={scheduleReport}
              className="bg-red-700 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-900/30 rounded-xl px-8 font-bold transition-all"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workspace Panel */}
      <WorkspacePanel 
        isOpen={showWorkspacePanel} 
        onClose={() => setShowWorkspacePanel(false)} 
      />

      {/* Language Download Dialog */}
      <LanguageDownloadDialog
        open={showLanguageDialog}
        onOpenChange={setShowLanguageDialog}
        onDownload={handleDownload}
        reportTitle={selectedReportForDownload?.title || 'Relatório'}
        isDownloading={isDownloading}
      />
    </div>
  );
};

export default Reports;