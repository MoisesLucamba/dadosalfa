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
  Trash2
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
  { name: "Geral", type: "general", icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Produção", type: "production", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Mercado", type: "market", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Exportações", type: "exports", icon: Ship, color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Risco", type: "risk", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10" },
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
        case 'daily': nextRun.setDate(nextRun.getDate() + 1); break;
        case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
        case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
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
      
      await supabase.from('report_downloads').insert({
        report_id: report.id,
        user_id: user?.id,
      });

      await supabase
        .from('reports')
        .update({ download_count: (report.download_count || 0) + 1 })
        .eq('id', report.id);

      const reportData: ReportData = {
        title: report.title || 'Relatório AlphaData',
        type: report.type || 'production',
        period: report.period || 'Atual',
        summary: report.summary || 'Relatório gerado pela plataforma AlphaData.',
        content: report.content || { data: {} },
        highlights: report.content?.highlights || [],
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
      // Create a temporary workspace reports instance with the target workspaceId
      const { error } = await supabase
        .from('workspace_reports')
        .insert({
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
    if (activeTab === 'ai') filtered = filtered.filter(r => r.ai_generated);
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
    const total = reports.length;
    const aiGenerated = reports.filter(r => r.ai_generated).length;
    const downloads = reports.reduce((acc, r) => acc + (r.download_count || 0), 0);
    const aiPercentage = total > 0 ? Math.round((aiGenerated / total) * 100) : 0;
    return { total, aiGenerated, downloads, aiPercentage };
  }, [reports]);

  const categoryCounts = useMemo(() => {
    return reportCategories.map(cat => ({
      ...cat,
      count: reports.filter(r => r.type === cat.type).length
    }));
  }, [reports]);

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
          {/* Subtle background glow */}
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
                      Analytics Hub
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">Relatórios</h1>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Gerencie, visualize e automatize seus insights baseados em dados com inteligência artificial.
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
                    className="bg-muted/50 border-border hover:bg-muted text-muted-foreground"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Workspaces
                  </Button>
                  <Button 
                    onClick={() => setShowGenerateDialog(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Relatório
                  </Button>
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total de Relatórios", value: stats.total, icon: FileText, color: "text-blue-400" },
                  { label: "Downloads Realizados", value: stats.downloads, icon: Download, color: "text-emerald-400" },
                  { label: "Análises de IA", value: stats.aiGenerated, icon: Sparkles, color: "text-purple-400" },
                  { label: "Eficiência IA", value: `${stats.aiPercentage}%`, icon: BarChart3, color: "text-amber-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl bg-muted group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Categories & Filters */}
                <div className="lg:col-span-3 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-card border border-border"
                  >
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Categorias</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                          !selectedCategory ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                            selectedCategory === cat.type ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                              <cat.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <span className="text-xs opacity-60 group-hover:opacity-100">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Quick Insights */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">IA Insights</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Seus relatórios gerados por IA aumentaram <span className="text-primary font-bold">12%</span> este mês. A precisão dos dados está em <span className="text-white font-bold">98.4%</span>.
                    </p>
                  </motion.div>
                </div>

                {/* Right Column: Reports List */}
                <div className="lg:col-span-9 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="bg-[#0A0A0A] border border-zinc-800 p-1 h-11 rounded-xl">
                        <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Todos</TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-lg px-6 gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                          <Sparkles className="w-3 h-3" /> IA
                        </TabsTrigger>
                        <TabsTrigger value="normal" className="rounded-lg px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Padrão</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input 
                          placeholder="Pesquisar relatórios..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-[#0A0A0A] border-zinc-800 focus:ring-primary/50 h-11 rounded-xl"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchReports}
                        className="h-11 w-11 bg-[#0A0A0A] border-zinc-800 hover:bg-zinc-900 rounded-xl"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full rounded-2xl bg-zinc-900/50" />
                        ))
                      ) : filteredReports.length > 0 ? (
                        filteredReports.map((report, index) => (
                          <motion.div
                            key={report.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-[#0A0A0A] border border-zinc-800/50 hover:border-zinc-700 hover:bg-[#0D0D0D] transition-all duration-300"
                          >
                            <div className="flex items-center gap-5">
                              <div className={`hidden sm:flex p-3 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors`}>
                                {getTypeIcon(report.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">{report.title}</h4>
                                  {report.ai_generated && (
                                    <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5 px-1.5">
                                      <Sparkles className="w-2.5 h-2.5 mr-1" /> IA
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
                                  <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                    {getTypeName(report.type)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                    {report.period}
                                  </span>
                                  {report.pages && (
                                    <span className="flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                      {report.pages} pág.
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
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
                                    className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="h-9 px-4 bg-muted border-border hover:bg-muted/80 text-foreground rounded-lg gap-2"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span className="text-xs font-medium">Baixar</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground w-48 p-1">
                                      <DropdownMenuItem onClick={() => openDownloadDialog(report)} className="rounded-lg focus:bg-muted py-2.5">
                                        <Download className="w-4 h-4 mr-3 text-primary" /> Descarregar...
                                      </DropdownMenuItem>
                                      {workspaces.length > 0 && (
                                        <>
                                          <DropdownMenuSeparator className="bg-zinc-800" />
                                          {workspaces.map(ws => (
                                            <DropdownMenuItem 
                                              key={ws.id}
                                              onClick={() => handleShareToWorkspace(report, ws.id)}
                                              className="rounded-lg focus:bg-zinc-900 focus:text-white py-2.5"
                                            >
                                              <Share2 className="w-4 h-4 mr-3 text-zinc-500" /> Partilhar: {ws.name}
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
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-20 bg-[#0A0A0A] border border-dashed border-zinc-800 rounded-3xl"
                        >
                          <div className="p-4 rounded-full bg-zinc-900 w-fit mx-auto mb-4">
                            <FileText className="w-8 h-8 text-zinc-700" />
                          </div>
                          <h3 className="text-lg font-medium text-zinc-300">Nenhum relatório encontrado</h3>
                          <p className="text-sm text-zinc-500 mt-1">Tente ajustar seus filtros ou crie um novo relatório.</p>
                          <Button
                            variant="outline"
                            className="mt-6 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
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

              {/* Bottom Section: Schedules & Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scheduled Reports */}
                <Card className="bg-[#0A0A0A] border-zinc-800/50 rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-6">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Agendamentos</CardTitle>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Automação de dados</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowScheduleDialog(true)} className="hover:bg-zinc-800 rounded-xl">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {scheduledReports.length > 0 ? (
                        scheduledReports.map((report, index) => (
                          <div key={report.id} className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-zinc-900 text-primary">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-zinc-200">{report.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {report.frequency === 'daily' ? 'Diário' : report.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Próximo: {report.next_run ? formatDate(report.next_run) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteScheduledReport(report.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Calendar className="w-10 h-10 mx-auto mb-3 text-zinc-800" />
                          <p className="text-sm text-zinc-500">Nenhum agendamento ativo</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Highlights */}
                <Card className="bg-[#0A0A0A] border-zinc-800/50 rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-6">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Destaques</CardTitle>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Insights Recentes</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {reportHighlights.length > 0 ? (
                        reportHighlights.map((highlight, index) => (
                          <div key={index} className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex items-start gap-4">
                            <div className={`p-2 rounded-xl ${
                              highlight.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
                              highlight.trend === 'down' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {highlight.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                               highlight.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                               <BarChart3 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{highlight.title}</h4>
                                <span className="text-[10px] text-primary font-medium">{highlight.source}</span>
                              </div>
                              <p className="text-xl font-bold text-white mt-1">{highlight.value}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Sparkles className="w-10 h-10 mx-auto mb-3 text-zinc-800" />
                          <p className="text-sm text-zinc-500">Gere relatórios para ver insights</p>
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

      {/* --- Dialogs --- */}
      
      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gerar Novo Relatório</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Configure os parâmetros para a análise de dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo de Relatório</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-zinc-800 text-zinc-300">
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
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Período</label>
              <Input
                placeholder="Ex: Novembro 2024"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-primary/50"
              />
            </div>
            <div 
              onClick={() => setIsAiGenerated(!isAiGenerated)}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                isAiGenerated ? 'bg-primary/10 border-primary/30' : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAiGenerated ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Análise Inteligente</p>
                  <p className="text-[10px] text-zinc-500">Utilizar IA para gerar insights</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isAiGenerated ? 'bg-primary' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isAiGenerated ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowGenerateDialog(false)} className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={generateReport} disabled={generating} className="bg-white text-black hover:bg-zinc-200 rounded-xl px-8 font-bold">
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {generating ? "Gerando..." : "Gerar Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Agendar Relatório</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Configure a geração automática recorrente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Agendamento</label>
              <Input
                placeholder="Ex: Relatório Semanal de Preços"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Frequência</label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-zinc-800 text-zinc-300">
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Destinatários</label>
                <Input
                  type="number"
                  min={1}
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(parseInt(e.target.value) || 1)}
                  className="bg-zinc-900 border-zinc-800 h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowScheduleDialog(false)} className="text-zinc-500 hover:text-white rounded-xl">
              Cancelar
            </Button>
            <Button onClick={scheduleReport} className="bg-primary text-black hover:bg-primary/90 rounded-xl px-8 font-bold">
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