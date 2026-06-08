import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Ship,
  AlertTriangle,
  Plus,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Share2,
  ArrowUpRight,
  Trash2,
  Terminal,
  Activity,
  Zap,
  Shield,
  Radio,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { downloadReport, ReportData } from "@/utils/generateReportDocument";
import { WorkspacePanel } from "@/components/workspace/WorkspacePanel";
import { useWorkspaces, useWorkspaceReports } from "@/hooks/useWorkspaces";
import { LanguageDownloadDialog } from "@/components/reports/LanguageDownloadDialog";
import { DocumentLanguageCode } from "@/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const reportCategories = [
  { name: "GERAL",        type: "general",    icon: FileText,      sig: "GRL" },
  { name: "PRODUÇÃO",     type: "production", icon: BarChart3,     sig: "PRD" },
  { name: "MERCADO",      type: "market",     icon: TrendingUp,    sig: "MKT" },
  { name: "EXPORTAÇÕES",  type: "exports",    icon: Ship,          sig: "EXP" },
  { name: "RISCO",        type: "risk",       icon: AlertTriangle, sig: "RSK" },
];

const getCategory  = (type: string) => reportCategories.find(c => c.type === type) ?? reportCategories[0];
const getTypeName  = (type: string) => getCategory(type).name;
const getSig       = (type: string) => getCategory(type).sig;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const translateReportTitle = (title: string, type: string, language: DocumentLanguageCode): string => {
  if (language === "pt") return title;
  const map: Record<string, Record<string, string>> = {
    en: { production: "Production Report", market: "Market & Price Analysis", exports: "Exports and Logistics", risk: "Risk Assessment", predictions: "AI Predictions", general: "General Report on the Angolan Oil Sector" },
    fr: { production: "Rapport de Production", market: "Analyse du Marché & des Prix", exports: "Exportations et Logistique", risk: "Évaluation des Risques", predictions: "Prévisions IA", general: "Rapport Général du Secteur Pétrolier Angolais" },
  };
  const base = map[language]?.[type];
  if (!base) return title;
  const dashIdx = title.lastIndexOf(" - ");
  return `${base}${dashIdx >= 0 ? title.substring(dashIdx) : ""}`;
};

const translateHighlights = (highlights: any[], language: DocumentLanguageCode): any[] => {
  if (!highlights || language === "pt") return highlights || [];
  const map: Record<string, Record<string, string>> = {
    en: { "Produção Total": "Total Production", "Preço Brent": "Brent Price", "Volume Exportado": "Export Volume", "Operadoras Ativas": "Active Operators", "Alertas de Risco": "Risk Alerts" },
    fr: { "Produção Total": "Production Totale", "Preço Brent": "Prix Brent", "Volume Exportado": "Volume Exporté", "Operadoras Ativas": "Opérateurs Actifs", "Alertas de Risco": "Alertes de Risque" },
  };
  return highlights.map((h: any) => ({ ...h, title: map[language]?.[h.title] || h.title }));
};

// ─── Animated Terminal Text ───────────────────────────────────────────────────
const TerminalLine = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        setDisplayed(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return <span>{displayed}<span className="animate-pulse">▌</span></span>;
};

// ─── Scanline Overlay ─────────────────────────────────────────────────────────
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
    }}
  />
);

// ─── Radar Pulse ──────────────────────────────────────────────────────────────
const RadarPulse = ({ active }: { active: boolean }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500" : "bg-slate-600"} ${active ? "animate-ping opacity-75" : ""}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-red-500" : "bg-slate-600"}`} />
  </span>
);

// ─── Stat Counter ─────────────────────────────────────────────────────────────
const StatCounter = ({ value }: { value: string | number }) => {
  const [display, setDisplay] = useState(0);
  const num = typeof value === "string" ? parseInt(value) || 0 : value;
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(num / 40);
    const iv = setInterval(() => {
      start = Math.min(start + step, num);
      setDisplay(start);
      if (start >= num) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [num]);
  if (typeof value === "string" && value.includes("%")) return <>{display}%</>;
  return <>{display}</>;
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports]                 = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [generating, setGenerating]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<"all" | "ai" | "normal">("all");
  const [bootDone, setBootDone]               = useState(false);
  const [selectedRow, setSelectedRow]         = useState<string | null>(null);

  const [showGenerateDialog, setShowGenerateDialog]   = useState(false);
  const [showScheduleDialog, setShowScheduleDialog]   = useState(false);
  const [selectedReportType, setSelectedReportType]   = useState("production");
  const [selectedPeriod, setSelectedPeriod]           = useState("");
  const [isAiGenerated, setIsAiGenerated]             = useState(true);
  const [generateLanguage, setGenerateLanguage]       = useState<DocumentLanguageCode>("pt");
  const [scheduleName, setScheduleName]               = useState("");
  const [scheduleFrequency, setScheduleFrequency]     = useState("weekly");
  const [scheduleRecipients, setScheduleRecipients]   = useState(1);
  const [showWorkspacePanel, setShowWorkspacePanel]   = useState(false);
  const { workspaces }                                = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const { shareReport }                               = useWorkspaceReports(selectedWorkspaceId);
  const [showLanguageDialog, setShowLanguageDialog]   = useState(false);
  const [selectedReportForDownload, setSelectedReportForDownload] = useState<Report | null>(null);
  const [isDownloading, setIsDownloading]             = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 1200); }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch { toast.error("FALHA NO SISTEMA — Relatórios indisponíveis"); }
    finally { setLoading(false); }
  };

  const fetchScheduledReports = async () => {
    try {
      const { data, error } = await supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setScheduledReports(data || []);
    } catch {}
  };

  useEffect(() => { fetchReports(); fetchScheduledReports(); }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { reportType: selectedReportType, period: selectedPeriod || undefined, userId: user?.id, aiGenerated: isAiGenerated, language: generateLanguage },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("RELATÓRIO GERADO // SISTEMA OK");
        fetchReports();
        setShowGenerateDialog(false);
      } else throw new Error(data?.error || "Falha");
    } catch { toast.error("ERRO CRÍTICO — Tentativa falhada"); }
    finally { setGenerating(false); }
  };

  const scheduleReport = async () => {
    if (!scheduleName) { toast.error("CAMPO OBRIGATÓRIO: Nome do agendamento"); return; }
    try {
      const nextRun = new Date();
      if (scheduleFrequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
      else if (scheduleFrequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
      else nextRun.setMonth(nextRun.getMonth() + 1);
      const { error } = await supabase.from("scheduled_reports").insert({ user_id: user?.id, name: scheduleName, report_type: selectedReportType, frequency: scheduleFrequency, next_run: nextRun.toISOString(), recipients: scheduleRecipients });
      if (error) throw error;
      toast.success("AGENDAMENTO CONFIRMADO // CRON ACTIVO");
      fetchScheduledReports();
      setShowScheduleDialog(false);
      setScheduleName("");
    } catch { toast.error("ERRO — Agendamento não criado"); }
  };

  const deleteScheduledReport = async (id: string) => {
    try {
      const { error } = await supabase.from("scheduled_reports").delete().eq("id", id);
      if (error) throw error;
      toast.success("ENTRY REMOVED");
      fetchScheduledReports();
    } catch { toast.error("DELETE FAILED"); }
  };

  const handleShareToWorkspace = async (report: Report, workspaceId: string) => {
    try {
      const { error } = await supabase.from("workspace_reports").insert({ workspace_id: workspaceId, report_id: report.id, shared_by: user?.id });
      if (error) throw error;
      toast.success("REPORT SHARED // ACK");
    } catch { toast.error("SHARE FAILED"); }
  };

  const openDownloadDialog = (report: Report) => { setSelectedReportForDownload(report); setShowLanguageDialog(true); };

  const handleDownload = async (format: "pdf" | "docx" | "excel", language: DocumentLanguageCode) => {
    if (!selectedReportForDownload) return;
    setIsDownloading(true);
    const loadingToast = toast.loading(`COMPILANDO ${format.toUpperCase()}...`);
    try {
      const report = selectedReportForDownload;
      await Promise.all([
        supabase.from("report_downloads").insert({ report_id: report.id, user_id: user?.id }),
        supabase.from("reports").update({ download_count: (report.download_count || 0) + 1 }).eq("id", report.id),
      ]);
      const fb = { pt: { title: "Relatório Elastra", period: "Actual", summary: "Relatório Elastra." }, en: { title: "Elastra Report", period: "Current", summary: "Elastra report." }, fr: { title: "Rapport Elastra", period: "Actuel", summary: "Rapport Elastra." } }[language] ?? { title: "Elastra Report", period: "Current", summary: "" };
      const reportData: ReportData = {
        title: translateReportTitle(report.title || fb.title, report.type || "production", language),
        type: report.type || "production",
        period: report.period || fb.period,
        summary: report.summary || fb.summary,
        content: report.content || { data: {} },
        highlights: translateHighlights(report.content?.highlights || [], language),
        generatedAt: report.created_at ? new Date(report.created_at) : new Date(),
        aiGenerated: report.ai_generated || false,
        language,
      };
      await downloadReport(reportData, format, language);
      toast.dismiss(loadingToast);
      toast.success(`${format.toUpperCase()} DOWNLOAD OK`);
      setShowLanguageDialog(false);
      setSelectedReportForDownload(null);
      fetchReports();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`DOWNLOAD ERROR: ${error instanceof Error ? error.message : "UNKNOWN"}`);
    } finally { setIsDownloading(false); }
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    let f = reports;
    if (activeTab === "ai") f = f.filter(r => r.ai_generated);
    else if (activeTab === "normal") f = f.filter(r => !r.ai_generated);
    if (selectedCategory) f = f.filter(r => r.type === selectedCategory);
    if (searchQuery) { const q = searchQuery.toLowerCase(); f = f.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.period?.toLowerCase().includes(q)); }
    return f;
  }, [reports, activeTab, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = reports.length;
    const aiGenerated = reports.filter(r => r.ai_generated).length;
    const downloads = reports.reduce((a, r) => a + (r.download_count || 0), 0);
    const aiPercentage = total > 0 ? Math.round((aiGenerated / total) * 100) : 0;
    return { total, aiGenerated, downloads, aiPercentage };
  }, [reports]);

  const categoryCounts = useMemo(() => reportCategories.map(cat => ({ ...cat, count: reports.filter(r => r.type === cat.type).length })), [reports]);

  const reportHighlights = useMemo(() => {
    const h: any[] = [];
    reports.slice(0, 3).forEach(r => { if (r.content?.highlights) r.content.highlights.slice(0, 1).forEach((x: any) => h.push({ ...x, source: r.title })); });
    return h;
  }, [reports]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-foreground selection:bg-red-500/30"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // RELATÓRIOS</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <ScanlineOverlay />

      {/* Boot screen */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: "#000", fontFamily: "'IBM Plex Mono', monospace" }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <div className="text-red-500 text-xs space-y-1 w-96 max-w-full px-8">
              <p className="text-red-400 text-lg font-bold mb-4">&gt; ALPHADAT-OS v3.2.1</p>
              <p className="opacity-70">LOADING INTELLIGENCE KERNEL............... OK</p>
              <p className="opacity-70">MOUNTING PETROLEUM DATABASE............... OK</p>
              <p className="opacity-70">AUTHENTICATING OPERATOR SESSION........... OK</p>
              <p className="text-red-500 animate-pulse">INITIALIZING REPORTS MODULE............... ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-[50%] h-[35%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[40%] h-[30%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.03) 0%, transparent 70%)" }} />

          <Header />

          <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: "0" }}>

            {/* ── System Status Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -8 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between px-6 py-2 border-b"
              style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}
            >
              <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="flex items-center gap-1.5 text-red-500">
                  <RadarPulse active={true} />
                  SISTEMA ONLINE
                </span>
                <span className="opacity-40">|</span>
                <span>OPERATOR: {user?.email?.split("@")[0].toUpperCase() ?? "ANON"}</span>
                <span className="opacity-40">|</span>
                <span>CLASSIFICAÇÃO: RESTRITO</span>
              </div>
              <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span style={{ color: "hsl(var(--foreground))" }}>
                  {now.toLocaleTimeString("pt-BR", { hour12: false })}
                </span>
                <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
              </div>
            </motion.div>

            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

              {/* ── Header ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>INTELLIGENCE</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>RELATÓRIOS</span>
                  </div>

                  {/* Title */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                        MÓDULO-04 // ANÁLISE DOCUMENTAL
                      </div>
                      <h1
                        className="font-bold leading-none"
                        style={{
                          fontSize: "clamp(2rem, 4vw, 3.5rem)",
                          letterSpacing: "-0.02em",
                          color: "hsl(var(--foreground))",
                        }}
                      >
                        RELATÓRIOS
                      </h1>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="h-[1px] w-12 bg-red-600" />
                        <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                          GERENCIE, VISUALIZE E AUTOMATIZE INSIGHTS BASEADOS EM DADOS
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowWorkspacePanel(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold tracking-widest transition-all duration-200 border"
                    style={{
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "hsl(var(--muted-foreground))",
                      background: "transparent",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    WORKSPACE
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowGenerateDialog(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold tracking-widest transition-all"
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #991b1b)",
                      color: "white",
                      boxShadow: "0 0 20px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                      border: "1px solid rgba(220,38,38,0.5)",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    NOVO RELATÓRIO
                  </motion.button>
                </div>
              </motion.div>

              {/* ── Stats ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 16 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {[
                  { label: "TOTAL RELATÓRIOS", value: stats.total,        suffix: "",   icon: FileText,  color: "#38bdf8", tag: "CNT" },
                  { label: "DOWNLOADS",         value: stats.downloads,    suffix: "",   icon: Download,  color: "#4ade80", tag: "DWN" },
                  { label: "ANÁLISES IA",        value: stats.aiGenerated, suffix: "",   icon: Sparkles,  color: "#a78bfa", tag: "AIS" },
                  { label: "EFICIÊNCIA IA",      value: stats.aiPercentage,suffix: "%",  icon: Activity,  color: "#fb923c", tag: "EFF" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="relative overflow-hidden rounded p-5 group cursor-default"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${s.color}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    {/* Corner tag */}
                    <div
                      className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5"
                      style={{ background: `${s.color}18`, color: s.color, borderBottomLeftRadius: "4px" }}
                    >
                      {s.tag}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <div className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {s.label}
                      </div>
                    </div>

                    <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
                      <StatCounter value={s.value} />{s.suffix}
                    </div>

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                      style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* ── Main Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── Left Panel ── */}
                <motion.div
                  className="lg:col-span-3 space-y-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : -16 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Categories */}
                  <div
                    className="rounded overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}
                  >
                    <div
                      className="px-4 py-3 flex items-center gap-2"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        CATEGORIAS // FILTROS
                      </span>
                    </div>

                    <div className="p-3 space-y-1">
                      {/* All */}
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded text-[11px] font-bold tracking-wider transition-all duration-150"
                        style={!selectedCategory ? {
                          background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(220,38,38,0.08))",
                          color: "#f87171",
                          border: "1px solid rgba(220,38,38,0.2)",
                        } : {
                          background: "transparent",
                          color: "hsl(var(--muted-foreground))",
                          border: "1px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-3.5 h-3.5" />
                          ALL
                        </div>
                        <span className="text-[9px] opacity-60 tabular-nums">{String(reports.length).padStart(3, "0")}</span>
                      </button>

                      {categoryCounts.map((cat) => (
                        <button
                          key={cat.type}
                          onClick={() => setSelectedCategory(selectedCategory === cat.type ? null : cat.type)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded text-[11px] font-bold tracking-wider transition-all duration-150"
                          style={selectedCategory === cat.type ? {
                            background: "rgba(255,255,255,0.05)",
                            color: "hsl(var(--foreground))",
                            border: "1px solid rgba(255,255,255,0.1)",
                          } : {
                            background: "transparent",
                            color: "hsl(var(--muted-foreground))",
                            border: "1px solid transparent",
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.name}
                          </div>
                          <span className="text-[9px] opacity-50 tabular-nums">{String(cat.count).padStart(3, "0")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Signal panel */}
                  <div
                    className="rounded p-5 relative overflow-hidden"
                    style={{
                      border: "1px solid rgba(220,38,38,0.15)",
                      background: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.03) 50%, transparent 100%)",
                    }}
                  >
                    <div className="absolute top-3 right-3 opacity-10">
                      <Zap className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[9px] font-bold tracking-[0.25em] text-red-500">IA // SIGNAL REPORT</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Relatórios gerados por IA aumentaram{" "}
                      <span className="text-red-400 font-bold">+12%</span> este mês.
                      Precisão dos dados:{" "}
                      <span style={{ color: "hsl(var(--foreground))" }} className="font-bold">98.4%</span>.
                    </p>
                    <div className="mt-4 h-[1px]" style={{ background: "linear-gradient(90deg, rgba(220,38,38,0.4), transparent)" }} />
                  </div>

                  {/* Schedules compact */}
                  <div
                    className="rounded overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-red-500" />
                        <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>CRON // AGENDAMENTOS</span>
                      </div>
                      <button
                        onClick={() => setShowScheduleDialog(true)}
                        className="w-5 h-5 flex items-center justify-center rounded transition-colors"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      {scheduledReports.length > 0 ? scheduledReports.map(r => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded group"
                          style={{ border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}
                        >
                          <div>
                            <div className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{r.name}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {r.frequency === "daily" ? "DIÁRIO" : r.frequency === "weekly" ? "SEMANAL" : "MENSAL"}
                              {" · "}
                              {r.next_run ? formatDate(r.next_run) : "—"}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteScheduledReport(r.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )) : (
                        <div className="py-6 text-center text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          NENHUM CRON ACTIVO
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ── Right: Reports Table ── */}
                <div className="lg:col-span-9 space-y-4">

                  {/* Toolbar */}
                  <motion.div
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: bootDone ? 1 : 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    {/* Tabs */}
                    <div
                      className="flex rounded overflow-hidden text-[10px] font-bold tracking-widest"
                      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "hsl(var(--card))" }}
                    >
                      {(["all", "ai", "normal"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className="flex items-center gap-2 px-4 py-2.5 transition-all duration-150"
                          style={activeTab === tab ? {
                            background: "rgba(255,255,255,0.07)",
                            color: "hsl(var(--foreground))",
                          } : {
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          {tab === "ai" && <Sparkles className="w-3 h-3" />}
                          {tab === "all" ? "TODOS" : tab === "ai" ? "IA" : "PADRÃO"}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                        <input
                          type="text"
                          placeholder="PESQUISAR RELATÓRIOS..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full h-10 pl-9 pr-4 rounded text-[11px] font-bold tracking-wider transition-colors outline-none"
                          style={{
                            background: "hsl(var(--card))",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "hsl(var(--foreground))",
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                          onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                          onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.07)"}
                        />
                      </div>
                      <button
                        onClick={fetchReports}
                        className="h-10 w-10 flex items-center justify-center rounded transition-all duration-200"
                        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </motion.div>

                  {/* Table header */}
                  <div
                    className="hidden sm:grid px-4 py-2.5 rounded text-[9px] font-bold tracking-[0.2em]"
                    style={{
                      gridTemplateColumns: "48px 1fr 80px 80px 80px 100px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    <span>SIG</span>
                    <span>TÍTULO</span>
                    <span>TIPO</span>
                    <span>PERÍODO</span>
                    <span>DATA</span>
                    <span className="text-right">ACÇÕES</span>
                  </div>

                  {/* Table rows */}
                  <div className="space-y-1.5">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 rounded animate-pulse" style={{ background: "hsl(var(--card))", opacity: 1 - i * 0.15 }} />
                        ))
                      ) : filteredReports.length > 0 ? (
                        filteredReports.map((report, index) => {
                          const cat = getCategory(report.type);
                          const isSelected = selectedRow === report.id;

                          return (
                            <motion.div
                              key={report.id}
                              layout
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => setSelectedRow(isSelected ? null : report.id)}
                              className="group relative flex flex-col sm:grid px-4 py-4 rounded cursor-pointer transition-all duration-150"
                              style={{
                                gridTemplateColumns: "48px 1fr 80px 80px 80px 100px",
                                alignItems: "center",
                                background: isSelected ? "rgba(220,38,38,0.06)" : "hsl(var(--card))",
                                border: `1px solid ${isSelected ? "rgba(220,38,38,0.2)" : "rgba(255,255,255,0.05)"}`,
                              }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                            >
                              {/* Left accent */}
                              {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l" style={{ background: "#dc2626" }} />
                              )}

                              {/* SIG */}
                              <div className="hidden sm:block text-[10px] font-bold tabular-nums" style={{ color: isSelected ? "#f87171" : "hsl(var(--muted-foreground))", letterSpacing: "0.1em" }}>
                                {getSig(report.type)}
                              </div>

                              {/* Title */}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "0.02em" }}>
                                    {report.title}
                                  </span>
                                  {report.ai_generated && (
                                    <span
                                      className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded"
                                      style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}
                                    >
                                      <Sparkles className="w-2 h-2" />
                                      AI
                                    </span>
                                  )}
                                </div>
                                {report.pages && (
                                  <div className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    {report.pages} PÁG.
                                  </div>
                                )}
                              </div>

                              {/* Type */}
                              <div className="hidden sm:block text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {getTypeName(report.type)}
                              </div>

                              {/* Period */}
                              <div className="hidden sm:block text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {report.period ?? "—"}
                              </div>

                              {/* Date */}
                              <div className="hidden sm:block text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {formatDate(report.created_at)}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-2 mt-3 sm:mt-0" onClick={e => e.stopPropagation()}>
                                {report.status === "ready" ? (
                                  <>
                                    <button
                                      onClick={() => toast.info(report.summary || "SEM RESUMO DISPONÍVEL")}
                                      className="h-8 w-8 flex items-center justify-center rounded transition-all"
                                      style={{ color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.07)" }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className="flex items-center gap-1.5 h-8 px-3 rounded text-[10px] font-bold tracking-wider transition-all"
                                          style={{
                                            background: "rgba(220,38,38,0.1)",
                                            border: "1px solid rgba(220,38,38,0.2)",
                                            color: "#f87171",
                                          }}
                                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.2)"; }}
                                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.1)"; }}
                                        >
                                          <Download className="w-3 h-3" />
                                          EXP
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="text-[11px] font-bold tracking-wider"
                                        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}
                                      >
                                        <DropdownMenuItem onClick={() => openDownloadDialog(report)} className="focus:bg-secondary gap-2 cursor-pointer py-2.5">
                                          <Download className="w-3 h-3 text-red-500" />
                                          DESCARREGAR...
                                        </DropdownMenuItem>
                                        {workspaces.length > 0 && (
                                          <>
                                            <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.06)" }} />
                                            {workspaces.map(ws => (
                                              <DropdownMenuItem key={ws.id} onClick={() => handleShareToWorkspace(report, ws.id)} className="focus:bg-secondary gap-2 cursor-pointer py-2.5">
                                                <Share2 className="w-3 h-3" />
                                                PARTILHAR: {ws.name.toUpperCase()}
                                              </DropdownMenuItem>
                                            ))}
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                ) : (
                                  <div
                                    className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider px-3 py-1.5 rounded"
                                    style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", color: "#fb923c" }}
                                  >
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    PROCESSANDO
                                  </div>
                                )}
                              </div>

                              {/* Download count */}
                              {report.download_count > 0 && (
                                <div className="absolute bottom-1.5 right-14 text-[8px] tabular-nums" style={{ color: "rgba(255,255,255,0.15)" }}>
                                  {report.download_count}× DWN
                                </div>
                              )}
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-20 rounded flex flex-col items-center gap-4"
                          style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
                        >
                          <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            // NENHUM REGISTO ENCONTRADO
                          </div>
                          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            AJUSTE OS FILTROS OU GERE UM NOVO RELATÓRIO
                          </div>
                          <button
                            onClick={() => setShowGenerateDialog(true)}
                            className="mt-2 flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all"
                            style={{ border: "1px solid rgba(220,38,38,0.3)", color: "#f87171", background: "rgba(220,38,38,0.06)" }}
                          >
                            <Plus className="w-3 h-3" />
                            INICIALIZAR PRIMEIRO RELATÓRIO
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Highlights */}
                  {reportHighlights.length > 0 && (
                    <motion.div
                      className="rounded overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: bootDone ? 1 : 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div
                        className="px-4 py-3 flex items-center gap-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          SIGNAL HIGHLIGHTS // INSIGHTS RECENTES
                        </span>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {reportHighlights.map((h, i) => (
                          <div
                            key={i}
                            className="p-3 rounded flex items-center gap-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <div
                              className="w-8 h-8 flex items-center justify-center rounded shrink-0"
                              style={{
                                background: h.trend === "up" ? "rgba(74,222,128,0.1)" : h.trend === "down" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.05)",
                                color: h.trend === "up" ? "#4ade80" : h.trend === "down" ? "#f87171" : "hsl(var(--muted-foreground))",
                              }}
                            >
                              {h.trend === "up" ? <TrendingUp className="w-4 h-4" /> : h.trend === "down" ? <TrendingDown className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{h.title}</div>
                              <div className="text-base font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{h.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════ DIALOGS ═══════════════════════════════ */}

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent
          className="max-w-md"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-red-500" />
              <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)" }}>NOVO RELATÓRIO // CONFIG</span>
            </div>
            <DialogTitle className="text-lg font-bold" style={{ letterSpacing: "0.05em" }}>GERAR RELATÓRIO</DialogTitle>
            <DialogDescription className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              Configure os parâmetros para a análise de dados petrolíferos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Report type */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>TIPO DE RELATÓRIO</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger className="h-11 rounded text-[11px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  <SelectItem value="general" className="text-[11px]">📊 GERAL (6+ PÁGINAS)</SelectItem>
                  <SelectItem value="production" className="text-[11px]">PRODUÇÃO</SelectItem>
                  <SelectItem value="market" className="text-[11px]">MERCADO & PREÇOS</SelectItem>
                  <SelectItem value="exports" className="text-[11px]">EXPORTAÇÕES</SelectItem>
                  <SelectItem value="risk" className="text-[11px]">AVALIAÇÃO DE RISCOS</SelectItem>
                  <SelectItem value="predictions" className="text-[11px]">PREVISÕES IA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>PERÍODO</label>
              <input
                type="text"
                placeholder="EX: NOVEMBRO 2024"
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full h-11 px-3 rounded text-[11px] font-bold tracking-wider outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono', monospace" }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>IDIOMA</label>
              <Select value={generateLanguage} onValueChange={v => setGenerateLanguage(v as DocumentLanguageCode)}>
                <SelectTrigger className="h-11 rounded text-[11px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  <SelectItem value="pt" className="text-[11px]">🇵🇹 PORTUGUÊS</SelectItem>
                  <SelectItem value="en" className="text-[11px]">🇬🇧 ENGLISH</SelectItem>
                  <SelectItem value="fr" className="text-[11px]">🇫🇷 FRANÇAIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI toggle */}
            <button
              onClick={() => setIsAiGenerated(!isAiGenerated)}
              className="w-full flex items-center justify-between p-4 rounded transition-all duration-200"
              style={{
                background: isAiGenerated ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isAiGenerated ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: isAiGenerated ? "#7c3aed" : "rgba(255,255,255,0.05)", color: "white" }}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>ANÁLISE INTELIGENTE</div>
                  <div className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>UTILIZAR IA PARA GERAR INSIGHTS</div>
                </div>
              </div>
              <div className="w-9 h-5 rounded-full relative transition-colors" style={{ background: isAiGenerated ? "#7c3aed" : "rgba(255,255,255,0.1)" }}>
                <div className="absolute top-1 w-3 h-3 rounded-full bg-white shadow transition-all" style={{ left: isAiGenerated ? "20px" : "4px" }} />
              </div>
            </button>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowGenerateDialog(false)}
              className="px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              CANCELAR
            </button>
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
              style={{
                background: "linear-gradient(135deg, #dc2626, #991b1b)",
                color: "white",
                boxShadow: "0 0 16px rgba(220,38,38,0.3)",
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generating ? "GERANDO..." : "EXECUTAR"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent
          className="max-w-md"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)" }}>CRON // NOVA ENTRADA</span>
            </div>
            <DialogTitle className="text-lg font-bold" style={{ letterSpacing: "0.05em" }}>AGENDAR RELATÓRIO</DialogTitle>
            <DialogDescription className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              Configure a geração automática recorrente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>NOME DO AGENDAMENTO</label>
              <input
                type="text"
                placeholder="EX: RELATÓRIO SEMANAL DE PREÇOS"
                value={scheduleName}
                onChange={e => setScheduleName(e.target.value)}
                className="w-full h-11 px-3 rounded text-[11px] font-bold tracking-wider outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono', monospace" }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>FREQUÊNCIA</label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger className="h-11 rounded text-[11px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}>
                    <SelectItem value="daily" className="text-[11px]">DIÁRIO</SelectItem>
                    <SelectItem value="weekly" className="text-[11px]">SEMANAL</SelectItem>
                    <SelectItem value="monthly" className="text-[11px]">MENSAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>DESTINATÁRIOS</label>
                <input
                  type="number"
                  min={1}
                  value={scheduleRecipients}
                  onChange={e => setScheduleRecipients(parseInt(e.target.value) || 1)}
                  className="w-full h-11 px-3 rounded text-[11px] font-bold tracking-wider outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowScheduleDialog(false)} className="px-4 py-2 rounded text-[10px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              CANCELAR
            </button>
            <button
              onClick={scheduleReport}
              className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", boxShadow: "0 0 16px rgba(220,38,38,0.25)" }}
            >
              <Calendar className="w-3 h-3" />
              CONFIRMAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workspace Panel */}
      <WorkspacePanel isOpen={showWorkspacePanel} onClose={() => setShowWorkspacePanel(false)} />

      {/* Language Download Dialog */}
      <LanguageDownloadDialog
        open={showLanguageDialog}
        onOpenChange={setShowLanguageDialog}
        onDownload={handleDownload}
        reportTitle={selectedReportForDownload?.title ?? "Relatório"}
        isDownloading={isDownloading}
      />

      <MobileBottomNav />
    </div>
  );
};

export default Reports;