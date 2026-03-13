import { useState, useEffect } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Database, Bell, MessageSquare, BarChart3, Plus, Check, X,
  RefreshCw, Send, Edit, Trash2, Shield, Clock, TrendingUp,
  AlertTriangle, Globe, Eye, Mail, Crown, UserCog, Building2,
  Settings, Cog, ChevronRight, Search, Filter, Download, Activity,
  Zap, ArrowUpRight, MoreHorizontal, CheckCircle2, XCircle, ChevronDown,
  Terminal, Radio, Lock,
} from "lucide-react";
import {
  useIsAdmin, useIsSuperAdmin, useAllUsers, useAllUsersWithEmail,
  useUserRequests, useDataUpdates, useUpdateUserApproval,
  useSendNotification, useRespondToRequest, usePromoteToAdmin,
  useDemoteFromAdmin, usePendingOrganizations, useUpdateOrganizationApproval
} from "@/hooks/useAdmin";
import {
  useProductionData, usePriceData, useExportData, useAddProductionData,
  useAddPriceData, useAddExportData, useDeleteProductionData,
  useDeletePriceData, useDeleteExportData, useUpdateProductionData,
  useUpdatePriceData, useUpdateExportData, useLogDataUpdate
} from "@/hooks/useData";
import {
  useRiskData, useRiskAlerts, useCountryRisk, useRegulatoryEvents,
  useAddRiskData, useAddRiskAlert, useAddCountryRisk, useAddRegulatoryEvent,
  useDeleteRiskData, useDeleteRiskAlert, useDeleteCountryRisk,
  useDeleteRegulatoryEvent, useUpdateRiskData, useUpdateRiskAlert
} from "@/hooks/useRiskData";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { AdminManagementPanel } from "@/components/admin/AdminManagementPanel";
import { useAuth } from "@/hooks/useAuth";

/* ─── Scanline Overlay ───────────────────────────────────────────────────── */
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }}
  />
);

/* ─── Radar Pulse ────────────────────────────────────────────────────────── */
const RadarPulse = ({ active }: { active: boolean }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500 animate-ping opacity-75" : "bg-slate-600"}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-red-500" : "bg-slate-600"}`} />
  </span>
);

/* ─── Stat Counter ───────────────────────────────────────────────────────── */
const StatCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const iv = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [value]);
  return <>{display}</>;
};

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
const KPICard = ({ label, value, icon: Icon, delta, color, tag }: {
  label: string; value: number | string; icon: any; delta?: string; color: string; tag: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded p-5 group cursor-default"
    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}33`}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
  >
    {/* Corner tag */}
    <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 tracking-widest"
      style={{ background: `${color}18`, color, borderBottomLeftRadius: "4px" }}>
      {tag}
    </div>

    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
    </div>

    <div className="flex items-end justify-between">
      <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
        {typeof value === "number" ? <StatCounter value={value} /> : value}
      </div>
      {delta && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold mb-1" style={{ color }}>
          <ArrowUpRight className="w-3 h-3" />{delta}
        </span>
      )}
    </div>

    {/* Bottom accent */}
    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
      style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
  </motion.div>
);

/* ─── Status Badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ approved }: { approved: boolean }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest"
    style={approved
      ? { background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }
      : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${approved ? "bg-green-400" : "bg-yellow-400"} ${!approved ? "animate-pulse" : ""}`} />
    {approved ? "APROVADO" : "PENDENTE"}
  </span>
);

/* ─── Score Pill ─────────────────────────────────────────────────────────── */
const ScorePill = ({ score }: { score: number }) => (
  <span
    className="font-bold text-[10px] px-2 py-0.5 rounded tabular-nums"
    style={score > 70
      ? { background: "rgba(220,38,38,0.12)", color: "#f87171" }
      : score > 40
      ? { background: "rgba(251,191,36,0.12)", color: "#fbbf24" }
      : { background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
  >
    {score}/100
  </span>
);

/* ─── Table Panel ────────────────────────────────────────────────────────── */
const TablePanel = ({ title, sig, desc, accentColor = "#dc2626", action, children }: {
  title: string; sig: string; desc?: string; accentColor?: string;
  action?: React.ReactNode; children: React.ReactNode;
}) => (
  <div
    className="relative rounded overflow-hidden group"
    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
  >
    {/* Corner sig */}
    <div className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1 tracking-widest z-10"
      style={{ background: `${accentColor}18`, color: accentColor, borderBottomLeftRadius: "4px" }}>
      {sig}
    </div>
    {/* Bottom accent on hover */}
    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
      style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

    <div className="px-5 py-4 flex items-center justify-between"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--foreground))" }}>{title}</p>
          {desc && <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>}
        </div>
      </div>
      {action}
    </div>

    <div className="overflow-x-auto">{children}</div>
  </div>
);

/* ─── Input style ────────────────────────────────────────────────────────── */
const inpStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "hsl(var(--foreground))",
  fontFamily: "'IBM Plex Mono', monospace",
  height: "44px",
  borderRadius: "4px",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "0.05em",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};
const taStyle: React.CSSProperties = { ...inpStyle, height: "auto", padding: "10px 12px", resize: "none" };

const TermInput = ({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={inpStyle}
    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
  />
);

const TermArea = ({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) => (
  <textarea
    rows={rows}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={taStyle}
    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(220,38,38,0.4)"}
    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.08)"}
  />
);

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-bold tracking-[0.2em] block" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
    {children}
  </div>
);

/* ─── Dialog wrapper ─────────────────────────────────────────────────────── */
const TermDialog = ({ title, sig, children }: { title: string; sig: string; children: React.ReactNode }) => (
  <DialogContent
    style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
  >
    <DialogHeader>
      <div className="flex items-center gap-2 mb-1">
        <Terminal className="w-4 h-4 text-red-500" />
        <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)" }}>ADMIN // {sig}</span>
      </div>
      <DialogTitle className="text-[14px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{title}</DialogTitle>
    </DialogHeader>
    {children}
  </DialogContent>
);

/* ─── Shared table head/cell classes ─────────────────────────────────────── */
const TH = "py-3 px-4 text-[9px] font-bold tracking-[0.2em] text-left";
const TD = "py-3.5 px-4 text-[11px]";

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const Admin = () => {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { data: isAdmin,     isLoading: checkingAdmin } = useIsAdmin();
  const { data: isSuperAdmin } = useIsSuperAdmin();

  const { data: users }         = useAllUsers();
  const { data: usersWithRoles }= useAllUsersWithEmail();
  const { data: requests }      = useUserRequests();
  const { data: dataUpdates }   = useDataUpdates();
  const { data: productionData }= useProductionData();
  const { data: priceData }     = usePriceData();
  const { data: exportData }    = useExportData();
  const { data: riskData }      = useRiskData();
  const { data: riskAlerts }    = useRiskAlerts();
  const { data: organizations } = usePendingOrganizations();

  const updateApproval    = useUpdateUserApproval();
  const updateOrgApproval = useUpdateOrganizationApproval();
  const sendNotification  = useSendNotification();
  const respondToRequest  = useRespondToRequest();
  const addProduction     = useAddProductionData();
  const addPrice          = useAddPriceData();
  const deleteProduction  = useDeleteProductionData();
  const deletePrice       = useDeletePriceData();
  const deleteExport      = useDeleteExportData();
  const deleteRisk        = useDeleteRiskData();
  const deleteRiskAlertMutation = useDeleteRiskAlert();
  const logUpdate         = useLogDataUpdate();

  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  const [productionForm, setProductionForm]     = useState({ operator: "", block: "", field: "", daily_production: "", data_date: new Date().toISOString().split("T")[0] });
  const [priceForm, setPriceForm]               = useState({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  const [responseForm, setResponseForm]         = useState({ requestId: "", response: "", status: "resolved" });

  const [activeTab, setActiveTab] = useState("users");
  const [bootDone, setBootDone]   = useState(false);
  const [now, setNow]             = useState(new Date());

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 1200); }, []);
  useEffect(() => { if (!checkingAdmin && !isAdmin) navigate("/"); }, [checkingAdmin, isAdmin, navigate]);

  /* handlers */
  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) return;
    sendNotification.mutate({ title: notificationForm.title, message: notificationForm.message, type: notificationForm.type, isGlobal: notificationForm.isGlobal, userId: notificationForm.isGlobal ? undefined : notificationForm.userId });
    setNotificationForm({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  };
  const handleAddProduction = () => {
    if (!productionForm.operator || !productionForm.block) return;
    addProduction.mutate({ operator: productionForm.operator, block: productionForm.block, field: productionForm.field || undefined, daily_production: parseFloat(productionForm.daily_production) || 0, monthly_production: 0, decline_rate: 0, data_date: productionForm.data_date });
    logUpdate.mutate({ data_type: "production", source: "Admin Manual Entry", records_updated: 1 });
    setProductionForm({ operator: "", block: "", field: "", daily_production: "", data_date: new Date().toISOString().split("T")[0] });
  };
  const handleAddPrice = () => {
    if (!priceForm.crude_type || !priceForm.price) return;
    addPrice.mutate({ crude_type: priceForm.crude_type, price: parseFloat(priceForm.price), change_percent: parseFloat(priceForm.change_percent) || 0, data_date: priceForm.data_date });
    logUpdate.mutate({ data_type: "price", source: "Admin Manual Entry", records_updated: 1 });
    setPriceForm({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  };
  const handleRespondToRequest = () => {
    if (!responseForm.requestId || !responseForm.response) return;
    respondToRequest.mutate({ requestId: responseForm.requestId, response: responseForm.response, status: responseForm.status });
    setResponseForm({ requestId: "", response: "", status: "resolved" });
  };
  const handleSendUserAlert = (userId: string, userName: string) => {
    sendNotification.mutate({ userId, title: "ALERTA DO ADMINISTRADOR", message: `PREZADO(A) ${userName.toUpperCase()}, O ADMINISTRADOR ENVIOU UM ALERTA PARA A SUA CONTA.`, type: "warning", isGlobal: false });
    toast.success("ALERTA ENVIADO // ACK");
  };

  const TABS = [
    { id: "users",         label: "UTILIZADORES", sig: "USR" },
    { id: "orgs",          label: "ORGANIZAÇÕES", sig: "ORG" },
    { id: "production",    label: "PRODUÇÃO",      sig: "PRD" },
    { id: "prices",        label: "PREÇOS",        sig: "PRC" },
    { id: "exports",       label: "EXPORTAÇÃO",    sig: "EXP" },
    { id: "risks",         label: "RISCOS",        sig: "RSK" },
    { id: "notifications", label: "NOTIFICAÇÕES",  sig: "NTF" },
    { id: "requests",      label: "SOLICITAÇÕES",  sig: "REQ" },
    { id: "logs",          label: "LOGS",          sig: "LOG" },
    ...(isSuperAdmin ? [{ id: "admins", label: "ADMINS", sig: "ADM" }] : []),
  ];

  const stats = [
    { label: "UTILIZADORES ACTIVOS",  value: users?.length || 0,                                      icon: Users,        delta: "+4%", color: "#60a5fa", tag: "USR" },
    { label: "SOLICITAÇÕES PENDENTES",value: requests?.filter(r => r.status === "pending").length || 0,icon: MessageSquare, delta: "–",  color: "#fbbf24", tag: "REQ" },
    { label: "ALERTAS DE RISCO",      value: riskAlerts?.length || 0,                                 icon: AlertTriangle, delta: "+1", color: "#f87171", tag: "RSK" },
    { label: "ORGS. PENDENTES",       value: organizations?.length || 0,                              icon: Building2,    delta: "–",   color: "#a78bfa", tag: "ORG" },
  ];

  // Loading / auth guard
  if (checkingAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', monospace" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#dc2626" }} />
        </div>
        <p className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>VERIFICANDO PERMISSÕES…</p>
      </div>
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // ADMIN</title>
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
              <p className="opacity-70">LOADING ADMIN KERNEL..................... OK</p>
              <p className="opacity-70">VALIDATING OPERATOR CLEARANCE............ OK</p>
              <p className="opacity-70">MOUNTING SYSTEM DATABASES................ OK</p>
              <p className="text-red-500 animate-pulse">INITIALIZING CONTROL PANEL............... ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/admin" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-[50%] h-[35%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[40%] h-[30%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 70%)" }} />

          <Header activeItem="/admin" />

          {/* System Status Bar */}
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
              <span className="flex items-center gap-1 text-amber-400">
                <Shield className="w-3 h-3" />
                {isSuperAdmin ? "SUPER-ADMIN" : "ADMIN"}
              </span>
              <span className="opacity-40">|</span>
              <span>ACESSO: TOTAL</span>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span style={{ color: "hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12: false })}</span>
              <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
            </div>
          </motion.div>

          <main className="flex-1 overflow-y-auto" style={{ padding: 0 }}>
            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

              {/* ── Page Header ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>ROOT</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>PAINEL ADMIN</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                    MÓDULO-00 // CONTROLO TOTAL DO SISTEMA
                  </div>
                  <h1 className="font-bold leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                    ADMIN CONTROL
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-[1px] w-12 bg-red-600" />
                    <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                      UTILIZADORES, DADOS, RISCOS E CONFIGURAÇÕES GLOBAIS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold tracking-widest transition-all border"
                    style={{ borderColor: "rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", background: "transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--foreground))"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--muted-foreground))"; }}
                  >
                    <Download className="w-3.5 h-3.5" /> EXPORTAR LOGS
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold tracking-widest"
                    style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", boxShadow: "0 0 20px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.1)", border: "1px solid rgba(220,38,38,0.5)" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> NOVO REGISTO
                  </motion.button>
                </div>
              </motion.div>

              {/* ── KPI Strip ── */}
              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 16 }}
                transition={{ delay: 0.3 }}
              >
                {stats.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }} transition={{ delay: 0.33 + i * 0.06 }}>
                    <KPICard {...s} />
                  </motion.div>
                ))}
              </motion.div>

              {/* ── Tab Bar ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.4 }}
              >
                <div
                  className="flex items-center gap-0 rounded overflow-hidden overflow-x-auto text-[10px] font-bold tracking-widest mb-6"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "hsl(var(--card))", width: "fit-content", maxWidth: "100%" }}
                >
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-4 py-3 transition-all duration-150 whitespace-nowrap shrink-0"
                      style={activeTab === tab.id ? {
                        background: "rgba(255,255,255,0.07)",
                        color: "hsl(var(--foreground))",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                      } : {
                        color: "hsl(var(--muted-foreground))",
                        borderRight: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded tracking-widest"
                        style={{
                          background: activeTab === tab.id ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.05)",
                          color: activeTab === tab.id ? "#f87171" : "inherit",
                        }}
                      >{tab.sig}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">

                  {/* USERS */}
                  {activeTab === "users" && (
                    <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <TablePanel title="GESTÃO DE UTILIZADORES" sig="USR" desc="APROVAÇÃO E CONTROLO DE ACESSO À PLATAFORMA" accentColor="#60a5fa"
                        action={
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                            <input
                              placeholder="PROCURAR UTILIZADOR…"
                              style={{ ...inpStyle, height: "36px", paddingLeft: "32px", width: "220px", fontSize: "10px" }}
                              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(96,165,250,0.4)"}
                              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
                            />
                          </div>
                        }
                      >
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["UTILIZADOR", "STATUS", "FUNÇÃO", "REGISTO", ""].map((h, i) => (
                                <th key={i} className={`${TH} ${i === 4 ? "text-right" : ""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {usersWithRoles?.map(u => (
                              <tr key={u.id} className="group transition-colors"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <td className={TD}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center rounded text-[11px] font-bold shrink-0"
                                      style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                                      {u.contact_name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{u.contact_name?.toUpperCase() || "SEM NOME"}</p>
                                      <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{u.company_name}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className={TD}><StatusBadge approved={!!u.is_approved} /></td>
                                <td className={TD}>
                                  <div className="flex items-center gap-1.5">
                                    {u.roles?.[0]?.role === "admin"
                                      ? <Shield className="w-3 h-3 text-amber-400" />
                                      : <UserCog className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />}
                                    <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                      {(u.roles?.[0]?.role || "viewer").toUpperCase()}
                                    </span>
                                  </div>
                                </td>
                                <td className={`${TD} tabular-nums text-[10px]`} style={{ color: "hsl(var(--muted-foreground))" }}>
                                  {u.created_at ? format(new Date(u.created_at), "dd/MM/yyyy") : "N/A"}
                                </td>
                                <td className={`${TD} text-right`}>
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!u.is_approved && (
                                      <button className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                        style={{ color: "#4ade80" }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(74,222,128,0.1)"}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                        onClick={() => updateApproval.mutate({ userId: u.id, isApproved: true })}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                      style={{ color: "#fbbf24" }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(251,191,36,0.1)"}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                      onClick={() => handleSendUserAlert(u.id, u.contact_name || u.company_name)}
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                      style={{ color: "#f87171" }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TablePanel>
                    </motion.div>
                  )}

                  {/* ORGS */}
                  {activeTab === "orgs" && (
                    <motion.div key="orgs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <TablePanel title="ORGANIZAÇÕES PENDENTES" sig="ORG" desc="VALIDAR ENTIDADES A SOLICITAR ACESSO" accentColor="#a78bfa">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["ORGANIZAÇÃO", "NIF / REG.", "SECTOR", "SOLICITAÇÃO", ""].map((h, i) => (
                                <th key={i} className={`${TH} ${i === 4 ? "text-right" : ""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {organizations?.map(org => (
                              <tr key={org.id} className="group"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                              >
                                <td className={TD}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center rounded shrink-0"
                                      style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                                      <Building2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{org.name?.toUpperCase()}</p>
                                      <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{org.contact_email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className={`${TD} font-mono text-[10px]`} style={{ color: "hsl(var(--muted-foreground))" }}>{org.nif || "N/A"}</td>
                                <td className={TD}>
                                  <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded"
                                    style={{ background: "rgba(255,255,255,0.05)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    {(org.sector || "EMPRESA").toUpperCase()}
                                  </span>
                                </td>
                                <td className={`${TD} text-[10px] tabular-nums`} style={{ color: "hsl(var(--muted-foreground))" }}>
                                  {format(new Date(org.created_at), "dd/MM/yyyy")}
                                </td>
                                <td className={`${TD} text-right`}>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      className="h-7 px-3 rounded text-[9px] font-bold tracking-widest transition-all"
                                      style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(74,222,128,0.2)"}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(74,222,128,0.1)"}
                                      onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: true })}
                                    >APROVAR</button>
                                    <button
                                      className="h-7 px-3 rounded text-[9px] font-bold tracking-widest transition-all"
                                      style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.2)"}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                      onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: false })}
                                    >REJEITAR</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {(!organizations || organizations.length === 0) && (
                              <tr><td colSpan={5} className="py-16 text-center">
                                <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: "hsl(var(--muted-foreground))" }} />
                                <p className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>// NENHUMA ORGANIZAÇÃO PENDENTE</p>
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      </TablePanel>
                    </motion.div>
                  )}

                  {/* PRODUCTION */}
                  {activeTab === "production" && (
                    <motion.div key="production" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <TablePanel title="DADOS DE PRODUÇÃO" sig="PRD" desc="HISTÓRICO DE EXTRAÇÃO POR OPERADORA E BLOCO" accentColor="#4ade80"
                        action={
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="flex items-center gap-1.5 h-8 px-3 rounded text-[10px] font-bold tracking-widest transition-all"
                                style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(74,222,128,0.2)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(74,222,128,0.1)"}
                              >
                                <Plus className="w-3 h-3" /> ADICIONAR
                              </button>
                            </DialogTrigger>
                            <TermDialog title="NOVO REGISTO DE PRODUÇÃO" sig="INSERIR DADOS">
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="OPERADORA"><TermInput value={productionForm.operator} onChange={v => setProductionForm(p=>({...p,operator:v}))} placeholder="EX: TOTALENERGIES" /></Field>
                                  <Field label="BLOCO"><TermInput value={productionForm.block} onChange={v => setProductionForm(p=>({...p,block:v}))} placeholder="EX: BLOCO 17" /></Field>
                                </div>
                                <Field label="CAMPO (OPCIONAL)"><TermInput value={productionForm.field} onChange={v => setProductionForm(p=>({...p,field:v}))} placeholder="EX: DALIA" /></Field>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="PROD. DIÁRIA (BPD)"><TermInput type="number" value={productionForm.daily_production} onChange={v => setProductionForm(p=>({...p,daily_production:v}))} placeholder="0" /></Field>
                                  <Field label="DATA"><TermInput type="date" value={productionForm.data_date} onChange={v => setProductionForm(p=>({...p,data_date:v}))} /></Field>
                                </div>
                              </div>
                              <DialogFooter>
                                <button onClick={handleAddProduction} disabled={addProduction.isPending}
                                  className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest w-full justify-center"
                                  style={{ background: "linear-gradient(135deg, #4ade80, #16a34a)", color: "white" }}>
                                  <Check className="w-3 h-3" /> GUARDAR REGISTO
                                </button>
                              </DialogFooter>
                            </TermDialog>
                          </Dialog>
                        }
                      >
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["OPERADORA","BLOCO / CAMPO","PROD. DIÁRIA","DATA",""].map((h,i) => (
                                <th key={i} className={`${TH} ${i===4?"text-right":""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {productionData?.slice(0,15).map(item => (
                              <tr key={item.id} className="group"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                              >
                                <td className={`${TD} font-bold tracking-wider`} style={{ color: "hsl(var(--foreground))" }}>{item.operator?.toUpperCase()}</td>
                                <td className={TD}>
                                  <p className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{item.block}</p>
                                  <p className="text-[9px] tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{item.field || "N/A"}</p>
                                </td>
                                <td className={TD}>
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3" style={{ color: "#4ade80" }} />
                                    <span className="font-mono font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{Number(item.daily_production).toLocaleString()}</span>
                                    <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>BPD</span>
                                  </div>
                                </td>
                                <td className={`${TD} tabular-nums text-[10px]`} style={{ color: "hsl(var(--muted-foreground))" }}>{format(new Date(item.data_date), "dd/MM/yyyy")}</td>
                                <td className={`${TD} text-right`}>
                                  <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all ml-auto"
                                    style={{ color: "#f87171" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                    onClick={() => deleteProduction.mutate(item.id)}
                                  ><Trash2 className="w-3 h-3" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TablePanel>
                    </motion.div>
                  )}

                  {/* PRICES */}
                  {activeTab === "prices" && (
                    <motion.div key="prices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <TablePanel title="DADOS DE PREÇO" sig="PRC" desc="COTAÇÕES DO MERCADO PETROLÍFERO" accentColor="#38bdf8"
                        action={
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="flex items-center gap-1.5 h-8 px-3 rounded text-[10px] font-bold tracking-widest transition-all"
                                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(56,189,248,0.2)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(56,189,248,0.1)"}
                              >
                                <Plus className="w-3 h-3" /> ADICIONAR PREÇO
                              </button>
                            </DialogTrigger>
                            <TermDialog title="NOVA COTAÇÃO" sig="INSERIR PREÇO">
                              <div className="grid gap-4 py-4">
                                <Field label="TIPO DE CRUDE">
                                  <Select value={priceForm.crude_type} onValueChange={v => setPriceForm(p=>({...p,crude_type:v}))}>
                                    <SelectTrigger style={{ ...inpStyle, display:"flex", alignItems:"center" }}><SelectValue placeholder="SELECIONE O TIPO" /></SelectTrigger>
                                    <SelectContent style={{ background:"hsl(var(--card))", border:"1px solid rgba(255,255,255,0.08)", fontFamily:"'IBM Plex Mono',monospace" }}>
                                      {["Brent","Cabinda","Girassol","Dalia","Nemba"].map(t => <SelectItem key={t} value={t} className="text-[11px]">{t.toUpperCase()}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="PREÇO (USD)"><TermInput type="number" value={priceForm.price} onChange={v => setPriceForm(p=>({...p,price:v}))} placeholder="0.00" /></Field>
                                  <Field label="VARIAÇÃO (%)"><TermInput type="number" value={priceForm.change_percent} onChange={v => setPriceForm(p=>({...p,change_percent:v}))} placeholder="0.00" /></Field>
                                </div>
                                <Field label="DATA"><TermInput type="date" value={priceForm.data_date} onChange={v => setPriceForm(p=>({...p,data_date:v}))} /></Field>
                              </div>
                              <DialogFooter>
                                <button onClick={handleAddPrice} disabled={addPrice.isPending}
                                  className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest w-full justify-center"
                                  style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)", color: "white" }}>
                                  <Check className="w-3 h-3" /> ACTUALIZAR COTAÇÃO
                                </button>
                              </DialogFooter>
                            </TermDialog>
                          </Dialog>
                        }
                      >
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["TIPO DE CRUDE","PREÇO ACTUAL","VARIAÇÃO","DATA",""].map((h,i) => (
                                <th key={i} className={`${TH} ${i===4?"text-right":""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {priceData?.slice(0,15).map(item => {
                              const up = Number(item.change_percent) >= 0;
                              return (
                                <tr key={item.id} className="group"
                                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                  onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                                >
                                  <td className={`${TD} font-bold tracking-wider`} style={{ color: "hsl(var(--foreground))" }}>{item.crude_type?.toUpperCase()}</td>
                                  <td className={TD}>
                                    <span className="font-mono font-bold text-xl tabular-nums" style={{ color: "hsl(var(--foreground))" }}>${Number(item.price).toFixed(2)}</span>
                                  </td>
                                  <td className={TD}>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                                      style={{ background: up?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: up?"#4ade80":"#f87171" }}>
                                      <TrendingUp className={`w-3 h-3 ${!up?"rotate-180":""}`} />
                                      {up?"+":""}{Number(item.change_percent).toFixed(2)}%
                                    </span>
                                  </td>
                                  <td className={`${TD} tabular-nums text-[10px]`} style={{ color: "hsl(var(--muted-foreground))" }}>{format(new Date(item.data_date),"dd/MM/yyyy")}</td>
                                  <td className={`${TD} text-right`}>
                                    <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all ml-auto"
                                      style={{ color: "#f87171" }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                      onClick={() => deletePrice.mutate(item.id)}
                                    ><Trash2 className="w-3 h-3" /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </TablePanel>
                    </motion.div>
                  )}

                  {/* EXPORTS */}
                  {activeTab === "exports" && (
                    <motion.div key="exports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <TablePanel title="DADOS DE EXPORTAÇÃO" sig="EXP" desc="EMBARQUES E DESTINOS DE EXPORTAÇÃO" accentColor="#fb923c">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["DESTINO","VOLUME","VALOR (USD)","STATUS","DATA",""].map((h,i) => (
                                <th key={i} className={`${TH} ${i===5?"text-right":""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {exportData?.slice(0,15).map(item => (
                              <tr key={item.id} className="group"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                              >
                                <td className={`${TD} font-bold tracking-wider`} style={{ color: "hsl(var(--foreground))" }}>{item.destination?.toUpperCase()}</td>
                                <td className={`${TD} font-mono tabular-nums`} style={{ color: "hsl(var(--foreground))" }}>
                                  {Number(item.volume).toLocaleString()} <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>BBL</span>
                                </td>
                                <td className={`${TD} font-mono tabular-nums`} style={{ color: "hsl(var(--foreground))" }}>${Number(item.value_usd).toLocaleString()}</td>
                                <td className={TD}>
                                  <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded"
                                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"hsl(var(--muted-foreground))" }}>
                                    {item.status?.toUpperCase()}
                                  </span>
                                </td>
                                <td className={`${TD} tabular-nums text-[10px]`} style={{ color: "hsl(var(--muted-foreground))" }}>{format(new Date(item.data_date),"dd/MM/yyyy")}</td>
                                <td className={`${TD} text-right`}>
                                  <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all ml-auto"
                                    style={{ color: "#f87171" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                    onClick={() => deleteExport.mutate(item.id)}
                                  ><Trash2 className="w-3 h-3" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TablePanel>
                    </motion.div>
                  )}

                  {/* RISKS */}
                  {activeTab === "risks" && (
                    <motion.div key="risks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Risk indices */}
                      <TablePanel title="ÍNDICES DE RISCO" sig="IDX" accentColor="#f87171">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {["CATEGORIA","SCORE","TENDÊNCIA",""].map((h,i) => (
                                <th key={i} className={`${TH} ${i===3?"text-right":""}`} style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {riskData?.slice(0,10).map(item => (
                              <tr key={item.id} className="group"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                              >
                                <td className={`${TD} capitalize font-bold tracking-wider text-[10px]`} style={{ color: "hsl(var(--foreground))" }}>{item.category?.toUpperCase()}</td>
                                <td className={TD}><ScorePill score={item.score} /></td>
                                <td className={TD}>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                    {item.trend === "up"
                                      ? <TrendingUp className="w-3 h-3" style={{ color: "#f87171" }} />
                                      : item.trend === "down"
                                      ? <TrendingUp className="w-3 h-3 rotate-180" style={{ color: "#4ade80" }} />
                                      : <div className="w-3 h-0.5 rounded" style={{ background: "rgba(255,255,255,0.2)" }} />}
                                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{item.trend?.toUpperCase()}</span>
                                  </div>
                                </td>
                                <td className={`${TD} text-right`}>
                                  <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all ml-auto"
                                    style={{ color: "#f87171" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                    onClick={() => deleteRisk.mutate(item.id)}
                                  ><Trash2 className="w-3 h-3" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TablePanel>

                      {/* Alerts */}
                      <div className="relative rounded overflow-hidden group" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1 tracking-widest"
                          style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", borderBottomLeftRadius: "4px" }}>ALR</div>
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                          style={{ background: "linear-gradient(90deg, #f87171, transparent)" }} />

                        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500" />
                          <p className="text-[11px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--foreground))" }}>ALERTAS ACTIVOS</p>
                        </div>

                        <div className="p-4 space-y-2">
                          {riskAlerts?.slice(0,5).map(alert => (
                            <div key={alert.id}
                              className="flex items-start justify-between p-3 rounded group/a transition-all"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.05)"}
                            >
                              <div className="flex gap-3">
                                <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: alert.impact==="high"?"rgba(248,113,113,0.12)":"rgba(251,191,36,0.12)", color: alert.impact==="high"?"#f87171":"#fbbf24" }}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{alert.title?.toUpperCase()}</p>
                                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "hsl(var(--muted-foreground))" }}>{alert.description}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"hsl(var(--muted-foreground))" }}>
                                      {(alert.region || "GLOBAL").toUpperCase()}
                                    </span>
                                    <span className="text-[9px] font-bold tracking-widest"
                                      style={{ color: alert.impact==="high"?"#f87171":"#fbbf24" }}>
                                      {alert.impact?.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/a:opacity-100 transition-all shrink-0"
                                style={{ color: "#f87171" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.1)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                                onClick={() => deleteRiskAlertMutation.mutate(alert.id)}
                              ><Trash2 className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* NOTIFICATIONS */}
                  {activeTab === "notifications" && (
                    <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-2xl">
                      <div className="relative rounded overflow-hidden group" style={{ background: "hsl(var(--card))", border: "1px solid rgba(167,139,250,0.2)" }}>
                        <div className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1 tracking-widest"
                          style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", borderBottomLeftRadius: "4px" }}>NTF</div>
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                          style={{ background: "linear-gradient(90deg, #a78bfa, transparent)" }} />

                        <div className="px-6 py-5 flex items-center gap-4"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(167,139,250,0.03)" }}>
                          <div className="w-8 h-8 flex items-center justify-center rounded shrink-0" style={{ background: "rgba(167,139,250,0.12)" }}>
                            <Bell className="w-4 h-4" style={{ color: "#a78bfa" }} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--foreground))" }}>ENVIAR NOTIFICAÇÃO</p>
                            <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>COMUNICAR COM TODOS OU UTILIZADORES ESPECÍFICOS</p>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <Field label="TÍTULO">
                            <TermInput value={notificationForm.title} onChange={v => setNotificationForm(p=>({...p,title:v}))} placeholder="EX: MANUTENÇÃO DO SISTEMA" />
                          </Field>
                          <Field label="CONTEÚDO">
                            <TermArea value={notificationForm.message} onChange={v => setNotificationForm(p=>({...p,message:v}))} placeholder="MENSAGEM PARA OS UTILIZADORES…" rows={4} />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="TIPO">
                              <Select value={notificationForm.type} onValueChange={v => setNotificationForm(p=>({...p,type:v}))}>
                                <SelectTrigger style={{ ...inpStyle, display:"flex", alignItems:"center" }}><SelectValue /></SelectTrigger>
                                <SelectContent style={{ background:"hsl(var(--card))", border:"1px solid rgba(255,255,255,0.08)", fontFamily:"'IBM Plex Mono',monospace" }}>
                                  {[["info","INFORMAÇÃO"],["warning","AVISO"],["alert","CRÍTICO"],["success","SUCESSO"]].map(([v,l]) => <SelectItem key={v} value={v} className="text-[11px]">{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field label="DESTINATÁRIOS">
                              <Select value={notificationForm.isGlobal?"global":"specific"} onValueChange={v => setNotificationForm(p=>({...p,isGlobal:v==="global"}))}>
                                <SelectTrigger style={{ ...inpStyle, display:"flex", alignItems:"center" }}><SelectValue /></SelectTrigger>
                                <SelectContent style={{ background:"hsl(var(--card))", border:"1px solid rgba(255,255,255,0.08)", fontFamily:"'IBM Plex Mono',monospace" }}>
                                  <SelectItem value="global" className="text-[11px]">TODOS OS UTILIZADORES</SelectItem>
                                  <SelectItem value="specific" className="text-[11px]">UTILIZADOR ESPECÍFICO</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                          <button
                            onClick={handleSendNotification}
                            disabled={sendNotification.isPending}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
                            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "white", boxShadow: "0 0 16px rgba(167,139,250,0.25)", opacity: sendNotification.isPending?0.7:1 }}
                          >
                            <Send className="w-3 h-3" /> DISPARAR NOTIFICAÇÃO
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* REQUESTS */}
                  {activeTab === "requests" && (
                    <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {requests?.map(request => (
                        <div key={request.id}
                          className="relative rounded overflow-hidden flex flex-col group transition-all"
                          style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.12)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.06)"}
                        >
                          <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                            style={{ background: "linear-gradient(90deg, #fbbf24, transparent)" }} />

                          <div className="px-4 py-3 flex items-center justify-between"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <StatusBadge approved={request.status !== "pending"} />
                            <span className="text-[9px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {format(new Date(request.created_at), "dd/MM HH:mm")}
                            </span>
                          </div>

                          <div className="p-4 flex-1">
                            <p className="text-[11px] font-bold tracking-wider mb-2 line-clamp-1" style={{ color: "hsl(var(--foreground))" }}>
                              {request.subject?.toUpperCase()}
                            </p>
                            <p className="text-[10px] leading-relaxed line-clamp-3" style={{ color: "hsl(var(--muted-foreground))" }}>{request.message}</p>
                            {request.admin_response && (
                              <div className="mt-3 p-2.5 rounded"
                                style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                                <p className="text-[8px] font-bold tracking-widest mb-1" style={{ color: "#fbbf24" }}>RESPOSTA ADMIN</p>
                                <p className="text-[10px] italic line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>{request.admin_response}</p>
                              </div>
                            )}
                          </div>

                          {request.status === "pending" && (
                            <div className="p-4 pt-0">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="w-full h-8 rounded text-[10px] font-bold tracking-widest transition-all flex items-center justify-center gap-1.5"
                                    style={{ background: "rgba(255,255,255,0.04)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.07)" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(251,191,36,0.08)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(251,191,36,0.3)"; (e.currentTarget as HTMLElement).style.color="#fbbf24"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--muted-foreground))"; }}
                                  >
                                    RESPONDER <ChevronRight className="w-3 h-3" />
                                  </button>
                                </DialogTrigger>
                                <TermDialog title="RESPONDER SOLICITAÇÃO" sig="REPLY">
                                  <div className="py-4 space-y-4">
                                    <div className="p-3 rounded text-[10px]"
                                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))" }}>
                                      {request.message}
                                    </div>
                                    <Field label="RESPOSTA OFICIAL">
                                      <TermArea
                                        rows={4}
                                        placeholder="RESPOSTA OFICIAL…"
                                        value={responseForm.requestId === request.id ? responseForm.response : ""}
                                        onChange={v => setResponseForm(p=>({...p, requestId: request.id, response: v}))}
                                      />
                                    </Field>
                                  </div>
                                  <DialogFooter>
                                    <button onClick={handleRespondToRequest} disabled={!responseForm.response}
                                      className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest w-full justify-center"
                                      style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "black", opacity: !responseForm.response?0.5:1 }}>
                                      <Send className="w-3 h-3" /> ENVIAR RESPOSTA
                                    </button>
                                  </DialogFooter>
                                </TermDialog>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!requests || requests.length === 0) && (
                        <div className="col-span-full py-20 flex flex-col items-center gap-4" style={{ border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "4px" }}>
                          <MessageSquare className="w-8 h-8 opacity-20" style={{ color: "hsl(var(--muted-foreground))" }} />
                          <p className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>// NENHUMA SOLICITAÇÃO ENCONTRADA</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* LOGS */}
                  {activeTab === "logs" && (
                    <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <div className="relative rounded overflow-hidden group" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1 tracking-widest"
                          style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8", borderBottomLeftRadius: "4px" }}>LOG</div>
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                          style={{ background: "linear-gradient(90deg, #94a3b8, transparent)" }} />

                        <div className="px-5 py-4 flex items-center gap-2"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                          <p className="text-[11px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--foreground))" }}>HISTÓRICO DE ACTIVIDADE</p>
                        </div>

                        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                          {dataUpdates?.map((update, i) => (
                            <div key={update.id}
                              className="flex items-center justify-between px-5 py-4 transition-colors"
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                            >
                              <div className="flex items-center gap-4">
                                <div className="relative flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                </div>
                                <div className="w-8 h-8 flex items-center justify-center rounded shrink-0"
                                  style={{ background: "rgba(255,255,255,0.04)" }}>
                                  <Database className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                                    {update.data_type?.toUpperCase()} <span className="font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>ACTUALIZADO</span>
                                  </p>
                                  <p className="text-[9px] tracking-widest mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{update.source?.toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-widest mb-1"
                                  style={{ background: "rgba(220,38,38,0.1)", color: "#f87171" }}>
                                  +{update.records_updated} REG.
                                </span>
                                <p className="text-[9px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  {format(new Date(update.created_at), "dd/MM/yyyy HH:mm")}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!dataUpdates || dataUpdates.length === 0) && (
                            <div className="py-12 text-center text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              // NENHUM LOG REGISTADO
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Admin;