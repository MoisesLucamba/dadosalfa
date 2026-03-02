import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Database, Bell, MessageSquare, BarChart3, Plus, Check, X,
  RefreshCw, Send, Edit, Trash2, Shield, Clock, TrendingUp,
  AlertTriangle, Globe, Eye, Mail, Crown, UserCog, Building2,
  Settings, Cog, ChevronRight, Search, Filter, Download, Activity,
  Zap, ArrowUpRight, MoreHorizontal, CheckCircle2, XCircle, ChevronDown
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

/* ─── Design tokens ──────────────────────────────────────── */
const ACCENT   = "#E8FF47";  // electric chartreuse
const PANEL_BG = "hsl(var(--card))";
const BORDER   = "hsl(var(--border))";

/* ─── Micro helpers ──────────────────────────────────────── */
const Dot = ({ color = ACCENT }: { color?: string }) => (
  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
);

const KPICard = ({
  label, value, icon: Icon, delta, color
}: {
  label: string; value: number | string; icon: any; delta?: string; color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl border border-border/50 p-6 flex flex-col gap-4 group bg-card"
  >
    {/* glow blob */}
    <div
      className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
      style={{ background: color }}
    />
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {delta && (
        <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color }}>
          <ArrowUpRight className="w-3 h-3" />{delta}
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5 uppercase tracking-widest">{label}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-xl font-black text-foreground">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{sub}</p>}
    </div>
    {action}
  </div>
);

/* ─── Pill tab trigger ───────────────────────────────────── */
const TabPill = ({ value, label }: { value: string; label: string }) => (
  <TabsTrigger
    value={value}
    className="
      px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full
      text-white/40 transition-all
      data-[state=active]:text-black data-[state=active]:shadow-lg
    "
    style={{
      // active state override via CSS variable trick (Radix sets data-state)
    } as any}
  >
    {label}
  </TabsTrigger>
);

/* ─── Status badge ───────────────────────────────────────── */
const StatusBadge = ({ approved }: { approved: boolean }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
    style={{
      background: approved ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
      color: approved ? "#4ade80" : "#fbbf24"
    }}
  >
    <Dot color={approved ? "#4ade80" : "#fbbf24"} />
    {approved ? "Aprovado" : "Pendente"}
  </span>
);

/* ─── Score ring ─────────────────────────────────────────── */
const ScorePill = ({ score }: { score: number }) => {
  const color = score > 70 ? "#f87171" : score > 40 ? "#fbbf24" : "#4ade80";
  return (
    <span
      className="font-black text-xs px-2 py-0.5 rounded-lg"
      style={{ background: `${color}15`, color }}
    >
      {score}/100
    </span>
  );
};

/* ─── Main component ─────────────────────────────────────── */
const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: isSuperAdmin } = useIsSuperAdmin();

  const { data: users } = useAllUsers();
  const { data: usersWithRoles } = useAllUsersWithEmail();
  const { data: requests } = useUserRequests();
  const { data: dataUpdates } = useDataUpdates();
  const { data: productionData } = useProductionData();
  const { data: priceData } = usePriceData();
  const { data: exportData } = useExportData();
  const { data: riskData } = useRiskData();
  const { data: riskAlerts } = useRiskAlerts();
  const { data: countryRisk } = useCountryRisk();
  const { data: regulatoryEvents } = useRegulatoryEvents();
  const { data: organizations } = usePendingOrganizations();

  const updateApproval      = useUpdateUserApproval();
  const updateOrgApproval   = useUpdateOrganizationApproval();
  const sendNotification    = useSendNotification();
  const respondToRequest    = useRespondToRequest();
  const promoteToAdmin      = usePromoteToAdmin();
  const demoteFromAdmin     = useDemoteFromAdmin();
  const addProduction       = useAddProductionData();
  const addPrice            = useAddPriceData();
  const addExport           = useAddExportData();
  const deleteProduction    = useDeleteProductionData();
  const deletePrice         = useDeletePriceData();
  const deleteExport        = useDeleteExportData();
  const updateProduction    = useUpdateProductionData();
  const updatePrice         = useUpdatePriceData();
  const updateExport        = useUpdateExportData();
  const logUpdate           = useLogDataUpdate();
  const addRisk             = useAddRiskData();
  const addRiskAlert        = useAddRiskAlert();
  const addCountry          = useAddCountryRisk();
  const addRegulatory       = useAddRegulatoryEvent();
  const deleteRisk          = useDeleteRiskData();
  const deleteRiskAlertMutation = useDeleteRiskAlert();
  const deleteCountry       = useDeleteCountryRisk();
  const deleteRegulatory    = useDeleteRegulatoryEvent();

  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  const [productionForm, setProductionForm]     = useState({ operator: "", block: "", field: "", daily_production: "", monthly_production: "", decline_rate: "", data_date: new Date().toISOString().split("T")[0] });
  const [priceForm, setPriceForm]               = useState({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  const [exportForm, setExportForm]             = useState({ destination: "", volume: "", value_usd: "", tanker_name: "", status: "in_transit", data_date: new Date().toISOString().split("T")[0] });
  const [riskForm, setRiskForm]                 = useState({ category: "", score: "", trend: "stable", description: "", source: "", data_date: new Date().toISOString().split("T")[0] });
  const [alertForm, setAlertForm]               = useState({ title: "", description: "", alert_type: "geopolitical", region: "", impact: "medium" });
  const [countryForm, setCountryForm]           = useState({ country: "", score: "", trend: "stable", data_date: new Date().toISOString().split("T")[0] });
  const [regulatoryForm, setRegulatoryForm]     = useState({ title: "", description: "", event_date: "", status: "upcoming", impact_level: "medium" });
  const [responseForm, setResponseForm]         = useState({ requestId: "", response: "", status: "resolved" });

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) navigate("/");
  }, [checkingAdmin, isAdmin, navigate]);

  if (checkingAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10">
          <RefreshCw className="w-7 h-7 animate-spin text-accent" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">A carregar…</p>
      </div>
    </div>
  );

  if (!isAdmin) return null;

  /* handlers (unchanged logic) */
  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) return;
    sendNotification.mutate({ title: notificationForm.title, message: notificationForm.message, type: notificationForm.type, isGlobal: notificationForm.isGlobal, userId: notificationForm.isGlobal ? undefined : notificationForm.userId });
    setNotificationForm({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  };
  const handleAddProduction = () => {
    if (!productionForm.operator || !productionForm.block) return;
    addProduction.mutate({ operator: productionForm.operator, block: productionForm.block, field: productionForm.field || undefined, daily_production: parseFloat(productionForm.daily_production) || 0, monthly_production: parseFloat(productionForm.monthly_production) || 0, decline_rate: parseFloat(productionForm.decline_rate) || 0, data_date: productionForm.data_date });
    logUpdate.mutate({ data_type: "production", source: "Admin Manual Entry", records_updated: 1 });
    setProductionForm({ operator: "", block: "", field: "", daily_production: "", monthly_production: "", decline_rate: "", data_date: new Date().toISOString().split("T")[0] });
  };
  const handleAddPrice = () => {
    if (!priceForm.crude_type || !priceForm.price) return;
    addPrice.mutate({ crude_type: priceForm.crude_type, price: parseFloat(priceForm.price), change_percent: parseFloat(priceForm.change_percent) || 0, data_date: priceForm.data_date });
    logUpdate.mutate({ data_type: "price", source: "Admin Manual Entry", records_updated: 1 });
    setPriceForm({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  };
  const handleAddRisk = () => {
    if (!riskForm.category || !riskForm.score) return;
    addRisk.mutate({ category: riskForm.category, score: parseInt(riskForm.score), trend: riskForm.trend, description: riskForm.description, source: riskForm.source, data_date: riskForm.data_date });
    logUpdate.mutate({ data_type: "risk", source: "Admin Manual Entry", records_updated: 1 });
    setRiskForm({ category: "", score: "", trend: "stable", description: "", source: "", data_date: new Date().toISOString().split("T")[0] });
  };
  const handleRespondToRequest = () => {
    if (!responseForm.requestId || !responseForm.response) return;
    respondToRequest.mutate({ requestId: responseForm.requestId, response: responseForm.response, status: responseForm.status });
    setResponseForm({ requestId: "", response: "", status: "resolved" });
  };
  const handleSendUserAlert = (userId: string, userName: string) => {
    sendNotification.mutate({ userId, title: "Alerta do Administrador", message: `Prezado(a) ${userName}, o administrador enviou um alerta para sua conta.`, type: "warning", isGlobal: false });
  };

  const stats = [
    { label: "Utilizadores Ativos", value: users?.length || 0,                                                     icon: Users,        delta: "+4%",  color: "#60a5fa" },
    { label: "Solicitações Pendentes", value: requests?.filter(r => r.status === "pending").length || 0,            icon: MessageSquare, delta: "–2%", color: "#fbbf24" },
    { label: "Alertas de Risco",     value: riskAlerts?.length || 0,                                               icon: AlertTriangle, delta: "+1",  color: "#f87171" },
    { label: "Orgs. Pendentes",      value: organizations?.length || 0,                                            icon: Building2,    delta: "–",   color: ACCENT    },
  ];

  /* ── shared table head style ── */
  const TH = "py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground";
  const TD = "py-3.5 px-4 text-sm";

  /* ── shared input/textarea style ── */
  const inputCls = "bg-muted/50 border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:border-accent/40 focus:ring-0";

  return (
    <div
      className="flex h-screen overflow-hidden font-sans bg-background text-foreground"
    >
      <Sidebar activeItem="/admin" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeItem="/admin" />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-thin">
          <div className="max-w-[1400px] mx-auto space-y-10">

            {/* ── Hero header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
                  >
                    <Shield className="w-3 h-3" /> Painel Admin
                  </span>
                  <Dot color="#4ade80" />
                  <span className="text-[11px] text-muted-foreground font-medium">Sistema operacional</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-foreground">
                  Gestão do<br />
                  <span className="text-accent">Sistema</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-md font-medium">
                  Controle centralizado de utilizadores, dados energéticos, riscos e configurações globais da plataforma.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 gap-2 border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold"
                >
                  <Download className="w-4 h-4" /> Exportar Logs
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl h-10 gap-2 text-black font-black text-xs uppercase tracking-widest"
                  style={{ background: ACCENT }}
                >
                  <Plus className="w-4 h-4" /> Novo Registo
                </Button>
              </div>
            </div>

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <KPICard key={i} {...s} />
              ))}
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="users" className="space-y-8">
              {/* Tab list — must use TabsList so Radix RovingFocusGroup context is provided */}
              <TabsList
                className="flex items-center gap-1 p-1.5 rounded-2xl w-fit overflow-x-auto h-auto"
                style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}
              >
                {(
                  [
                    ["users",         "Utilizadores"],
                    ["orgs",          "Organizações"],
                    ["production",    "Produção"],
                    ["prices",        "Preços"],
                    ["exports",       "Exportação"],
                    ["risks",         "Riscos"],
                    ["notifications", "Notificações"],
                    ["requests",      "Solicitações"],
                    ["logs",          "Logs"],
                    ...(isSuperAdmin ? [["admins", "Admins"]] : []),
                  ] as [string, string][]
                ).map(([v, l]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="
                      px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest
                      text-white/30 transition-all whitespace-nowrap
                      data-[state=active]:text-black data-[state=active]:shadow-md
                    "
                  >
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ══ USERS ══ */}
              <TabsContent value="users" className="mt-0">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="font-black text-white">Gestão de Utilizadores</p>
                      <p className="text-xs text-white/30 font-medium mt-0.5">Aprovação e controlo de acesso à plataforma</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        placeholder="Procurar utilizador…"
                        className={`pl-9 h-9 ${inputCls}`}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Utilizador</th>
                          <th className={`${TH} text-left`}>Status</th>
                          <th className={`${TH} text-left`}>Função</th>
                          <th className={`${TH} text-left`}>Registo</th>
                          <th className={`${TH} text-right`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithRoles?.map((user) => (
                          <tr
                            key={user.id}
                            className="group transition-colors"
                            style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td className={TD}>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0"
                                  style={{ background: `${ACCENT}18`, color: ACCENT }}
                                >
                                  {user.contact_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{user.contact_name || "Sem nome"}</p>
                                  <p className="text-[11px] text-white/30">{user.company_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className={TD}><StatusBadge approved={!!user.is_approved} /></td>
                            <td className={TD}>
                              <div className="flex items-center gap-1.5">
                                {user.roles?.[0]?.role === "admin"
                                  ? <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                                  : <UserCog className="w-3.5 h-3.5 text-white/30" />}
                                <span className="text-xs font-bold capitalize text-white/60">{user.roles?.[0]?.role || "viewer"}</span>
                              </div>
                            </td>
                            <td className={`${TD} text-white/30 text-xs font-medium`}>
                              {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "N/A"}
                            </td>
                            <td className={`${TD} text-right`}>
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!user.is_approved && (
                                  <button
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ color: "#4ade80" }}
                                    onClick={() => updateApproval.mutate({ userId: user.id, isApproved: true })}
                                    title="Aprovar"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-amber-400 hover:bg-amber-400/10"
                                  onClick={() => handleSendUserAlert(user.id, user.contact_name || user.company_name)}
                                  title="Enviar alerta"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                                <button
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-red-400 hover:bg-red-400/10"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ ORGS ══ */}
              <TabsContent value="orgs" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  <div className="px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <p className="font-black text-white">Organizações Pendentes</p>
                    <p className="text-xs text-white/30 font-medium mt-0.5">Valide entidades que solicitam acesso à plataforma</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Organização</th>
                          <th className={`${TH} text-left`}>NIF / Reg.</th>
                          <th className={`${TH} text-left`}>Setor</th>
                          <th className={`${TH} text-left`}>Solicitação</th>
                          <th className={`${TH} text-right`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizations?.map((org) => (
                          <tr key={org.id} className="group" style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className={TD}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                                  <Building2 className="w-4 h-4 text-white/40" />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{org.name}</p>
                                  <p className="text-[11px] text-white/30">{org.contact_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`${TD} font-mono text-white/50 text-xs`}>{org.nif || "N/A"}</td>
                            <td className={TD}>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest text-white/50 border border-white/10">
                                {org.sector || "Empresa"}
                              </span>
                            </td>
                            <td className={`${TD} text-white/30 text-xs`}>{format(new Date(org.created_at), "dd/MM/yyyy")}</td>
                            <td className={`${TD} text-right`}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors"
                                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
                                  onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: true })}
                                >
                                  Aprovar
                                </button>
                                <button
                                  className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-colors"
                                  onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: false })}
                                >
                                  Rejeitar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!organizations || organizations.length === 0) && (
                          <tr><td colSpan={5} className="py-16 text-center text-white/20 text-sm font-medium">
                            <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            Nenhuma organização pendente de aprovação.
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ PRODUCTION ══ */}
              <TabsContent value="production" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="font-black text-white">Dados de Produção</p>
                      <p className="text-xs text-white/30 font-medium mt-0.5">Histórico de extração por operadora e bloco</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-9 rounded-xl gap-2 text-black font-black text-xs uppercase tracking-widest" style={{ background: ACCENT }}>
                          <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl border" style={{ background: "#0f1015", borderColor: BORDER }}>
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-white">Nova Produção</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Operadora</label>
                              <Input placeholder="Ex: TotalEnergies" value={productionForm.operator} onChange={e => setProductionForm({...productionForm, operator: e.target.value})} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Bloco</label>
                              <Input placeholder="Ex: Bloco 17" value={productionForm.block} onChange={e => setProductionForm({...productionForm, block: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Campo (Opcional)</label>
                            <Input placeholder="Ex: Dalia" value={productionForm.field} onChange={e => setProductionForm({...productionForm, field: e.target.value})} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Prod. Diária (bpd)</label>
                              <Input type="number" placeholder="0" value={productionForm.daily_production} onChange={e => setProductionForm({...productionForm, daily_production: e.target.value})} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Data</label>
                              <Input type="date" value={productionForm.data_date} onChange={e => setProductionForm({...productionForm, data_date: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddProduction} disabled={addProduction.isPending} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-black" style={{ background: ACCENT }}>
                            Salvar Registo
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Operadora</th>
                          <th className={`${TH} text-left`}>Bloco / Campo</th>
                          <th className={`${TH} text-left`}>Produção Diária</th>
                          <th className={`${TH} text-left`}>Data</th>
                          <th className={`${TH} text-right`}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {productionData?.slice(0, 15).map(item => (
                          <tr key={item.id} className="group" style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className={`${TD} font-bold text-white`}>{item.operator}</td>
                            <td className={TD}>
                              <p className="text-white text-sm font-medium">{item.block}</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">{item.field || "N/A"}</p>
                            </td>
                            <td className={TD}>
                              <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                                <span className="font-mono font-black text-white">{Number(item.daily_production).toLocaleString()}</span>
                                <span className="text-[10px] text-white/30">bpd</span>
                              </div>
                            </td>
                            <td className={`${TD} text-white/30 text-xs font-medium`}>{format(new Date(item.data_date), "dd/MM/yyyy")}</td>
                            <td className={`${TD} text-right`}>
                              <button className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all ml-auto"
                                onClick={() => deleteProduction.mutate(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ PRICES ══ */}
              <TabsContent value="prices" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="font-black text-white">Dados de Preço</p>
                      <p className="text-xs text-white/30 font-medium mt-0.5">Cotações do mercado petrolífero</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-9 rounded-xl gap-2 text-black font-black text-xs uppercase tracking-widest" style={{ background: ACCENT }}>
                          <Plus className="w-4 h-4" /> Adicionar Preço
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl border" style={{ background: "#0f1015", borderColor: BORDER }}>
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black text-white">Novo Preço</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tipo de Crude</label>
                            <Select value={priceForm.crude_type} onValueChange={v => setPriceForm({...priceForm, crude_type: v})}>
                              <SelectTrigger className={`${inputCls} h-11`}><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                              <SelectContent style={{ background: "#0f1015", borderColor: BORDER }}>
                                {["Brent","Cabinda","Girassol","Dalia","Nemba"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Preço (USD)</label>
                              <Input type="number" placeholder="0.00" value={priceForm.price} onChange={e => setPriceForm({...priceForm, price: e.target.value})} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Variação (%)</label>
                              <Input type="number" placeholder="0.00" value={priceForm.change_percent} onChange={e => setPriceForm({...priceForm, change_percent: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Data</label>
                            <Input type="date" value={priceForm.data_date} onChange={e => setPriceForm({...priceForm, data_date: e.target.value})} className={inputCls} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddPrice} disabled={addPrice.isPending} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-black" style={{ background: ACCENT }}>
                            Atualizar Cotação
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Tipo de Crude</th>
                          <th className={`${TH} text-left`}>Preço Atual</th>
                          <th className={`${TH} text-left`}>Variação</th>
                          <th className={`${TH} text-left`}>Data</th>
                          <th className={`${TH} text-right`}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceData?.slice(0, 15).map(item => {
                          const up = Number(item.change_percent) >= 0;
                          return (
                            <tr key={item.id} className="group" style={{ borderBottom: `1px solid ${BORDER}` }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <td className={`${TD} font-bold text-white`}>{item.crude_type}</td>
                              <td className={TD}>
                                <span className="font-mono font-black text-xl text-white">${Number(item.price).toFixed(2)}</span>
                              </td>
                              <td className={TD}>
                                <span
                                  className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-lg"
                                  style={{ background: up ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: up ? "#4ade80" : "#f87171" }}
                                >
                                  <TrendingUp className={`w-3 h-3 ${!up ? "rotate-180" : ""}`} />
                                  {up ? "+" : ""}{Number(item.change_percent).toFixed(2)}%
                                </span>
                              </td>
                              <td className={`${TD} text-white/30 text-xs font-medium`}>{format(new Date(item.data_date), "dd/MM/yyyy")}</td>
                              <td className={`${TD} text-right`}>
                                <button className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all ml-auto"
                                  onClick={() => deletePrice.mutate(item.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ EXPORTS ══ */}
              <TabsContent value="exports" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="font-black text-white">Dados de Exportação</p>
                      <p className="text-xs text-white/30 font-medium mt-0.5">Embarques e destinos de exportação</p>
                    </div>
                    <Button size="sm" className="h-9 rounded-xl gap-2 text-black font-black text-xs uppercase tracking-widest" style={{ background: ACCENT }}>
                      <Plus className="w-4 h-4" /> Adicionar
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Destino</th>
                          <th className={`${TH} text-left`}>Volume</th>
                          <th className={`${TH} text-left`}>Valor (USD)</th>
                          <th className={`${TH} text-left`}>Status</th>
                          <th className={`${TH} text-left`}>Data</th>
                          <th className={`${TH} text-right`}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportData?.slice(0, 15).map(item => (
                          <tr key={item.id} className="group" style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className={`${TD} font-bold text-white`}>{item.destination}</td>
                            <td className={`${TD} font-mono font-bold text-white/80`}>{Number(item.volume).toLocaleString()} <span className="text-white/30 text-xs">bbl</span></td>
                            <td className={`${TD} font-mono text-white/80`}>${Number(item.value_usd).toLocaleString()}</td>
                            <td className={TD}>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40">
                                {item.status}
                              </span>
                            </td>
                            <td className={`${TD} text-white/30 text-xs font-medium`}>{format(new Date(item.data_date), "dd/MM/yyyy")}</td>
                            <td className={`${TD} text-right`}>
                              <button className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all ml-auto"
                                onClick={() => deleteExport.mutate(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ RISKS ══ */}
              <TabsContent value="risks" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk indices */}
                  <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                      <p className="font-black text-white">Índices de Risco</p>
                      <button className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5">
                        <Plus className="w-3 h-3" /> Novo
                      </button>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH} text-left`}>Categoria</th>
                          <th className={`${TH} text-left`}>Score</th>
                          <th className={`${TH} text-left`}>Tendência</th>
                          <th className={`${TH} text-right`}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskData?.slice(0, 10).map(item => (
                          <tr key={item.id} className="group" style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className={`${TD} capitalize text-white/80 font-medium text-sm`}>{item.category}</td>
                            <td className={TD}><ScorePill score={item.score} /></td>
                            <td className={TD}>
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                {item.trend === "up"
                                  ? <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                                  : item.trend === "down"
                                  ? <TrendingUp className="w-3.5 h-3.5 text-green-400 rotate-180" />
                                  : <div className="w-3.5 h-0.5 bg-white/20 rounded" />}
                                <span className="text-white/30 capitalize">{item.trend}</span>
                              </div>
                            </td>
                            <td className={`${TD} text-right`}>
                              <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all ml-auto"
                                onClick={() => deleteRisk.mutate(item.id)}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Risk alerts */}
                  <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                      <p className="font-black text-white">Alertas Ativos</p>
                      <button className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5">
                        <Plus className="w-3 h-3" /> Novo
                      </button>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                      {riskAlerts?.slice(0, 5).map(alert => (
                        <div
                          key={alert.id}
                          className="flex items-start justify-between p-4 rounded-xl group transition-colors"
                          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                        >
                          <div className="flex gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                background: alert.impact === "high" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.12)",
                                color: alert.impact === "high" ? "#f87171" : "#fbbf24"
                              }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-sm">{alert.title}</p>
                              <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{alert.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/10 text-white/30">
                                  {alert.region || "Global"}
                                </span>
                                <span
                                  className="text-[9px] font-black uppercase tracking-widest"
                                  style={{ color: alert.impact === "high" ? "#f87171" : "#fbbf24" }}
                                >
                                  {alert.impact}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                            onClick={() => deleteRiskAlertMutation.mutate(alert.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ══ NOTIFICATIONS ══ */}
              <TabsContent value="notifications" className="mt-0 max-w-2xl">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  {/* panel header with icon */}
                  <div
                    className="px-8 py-7 flex items-center gap-4 border-b relative overflow-hidden"
                    style={{ borderColor: BORDER }}
                  >
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{ background: `radial-gradient(ellipse at top left, ${ACCENT}, transparent 60%)` }}
                    />
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative" style={{ background: `${ACCENT}18` }}>
                      <Bell className="w-6 h-6" style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg">Enviar Notificação</p>
                      <p className="text-xs text-white/30 font-medium mt-0.5">Comunique com todos ou utilizadores específicos</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Título</label>
                      <Input placeholder="Ex: Manutenção do Sistema" value={notificationForm.title} onChange={e => setNotificationForm({...notificationForm, title: e.target.value})} className={`${inputCls} h-12`} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Conteúdo</label>
                      <Textarea placeholder="Digite a mensagem aqui…" rows={4} value={notificationForm.message} onChange={e => setNotificationForm({...notificationForm, message: e.target.value})} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tipo</label>
                        <Select value={notificationForm.type} onValueChange={v => setNotificationForm({...notificationForm, type: v})}>
                          <SelectTrigger className={`${inputCls} h-11`}><SelectValue /></SelectTrigger>
                          <SelectContent style={{ background: "#0f1015", borderColor: BORDER }}>
                            {[["info","Informação"],["warning","Aviso"],["alert","Crítico"],["success","Sucesso"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Destinatários</label>
                        <Select value={notificationForm.isGlobal ? "global" : "specific"} onValueChange={v => setNotificationForm({...notificationForm, isGlobal: v === "global"})}>
                          <SelectTrigger className={`${inputCls} h-11`}><SelectValue /></SelectTrigger>
                          <SelectContent style={{ background: "#0f1015", borderColor: BORDER }}>
                            <SelectItem value="global">Todos os Utilizadores</SelectItem>
                            <SelectItem value="specific">Utilizador Específico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      onClick={handleSendNotification}
                      disabled={sendNotification.isPending}
                      className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-black gap-2"
                      style={{ background: ACCENT }}
                    >
                      <Send className="w-4 h-4" /> Disparar Notificação
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ══ REQUESTS ══ */}
              <TabsContent value="requests" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {requests?.map(request => (
                    <div
                      key={request.id}
                      className="rounded-2xl overflow-hidden flex flex-col group transition-all"
                      style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                    >
                      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
                        <StatusBadge approved={request.status !== "pending"} />
                        <span className="text-[10px] text-white/20 font-medium">{format(new Date(request.created_at), "dd/MM HH:mm")}</span>
                      </div>
                      <div className="p-5 flex-1">
                        <p className="font-bold text-white text-sm mb-2 line-clamp-1">{request.subject}</p>
                        <p className="text-xs text-white/30 leading-relaxed line-clamp-3">{request.message}</p>
                        {request.admin_response && (
                          <div className="mt-4 p-3 rounded-xl" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Resposta Admin</p>
                            <p className="text-[11px] text-white/50 italic line-clamp-2">{request.admin_response}</p>
                          </div>
                        )}
                      </div>
                      {request.status === "pending" && (
                        <div className="p-5 pt-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="w-full h-9 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}18`; e.currentTarget.style.color = ACCENT; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                              >
                                Responder <ChevronRight className="w-3 h-3" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl border" style={{ background: "#0f1015", borderColor: BORDER }}>
                              <DialogHeader>
                                <DialogTitle className="text-xl font-black text-white">Responder Solicitação</DialogTitle>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div className="p-4 rounded-xl text-xs text-white/40" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                                  {request.message}
                                </div>
                                <Textarea
                                  placeholder="Resposta oficial…"
                                  className={`${inputCls} min-h-[120px] resize-none`}
                                  value={responseForm.requestId === request.id ? responseForm.response : ""}
                                  onChange={e => setResponseForm({...responseForm, requestId: request.id, response: e.target.value})}
                                />
                              </div>
                              <DialogFooter>
                                <Button onClick={handleRespondToRequest} disabled={!responseForm.response} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-black" style={{ background: ACCENT }}>
                                  Enviar Resposta
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!requests || requests.length === 0) && (
                    <div className="col-span-full py-20 text-center">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-white/10" />
                      <p className="text-sm text-white/20 font-medium">Nenhuma solicitação encontrada.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ══ LOGS ══ */}
              <TabsContent value="logs" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: PANEL_BG, border: `1px solid ${BORDER}` }}>
                  <div className="px-6 py-5 border-b" style={{ borderColor: BORDER }}>
                    <p className="font-black text-white">Histórico de Atividade</p>
                    <p className="text-xs text-white/30 font-medium mt-0.5">Rastreamento de todas as alterações de dados</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: BORDER }}>
                    {dataUpdates?.map((update, i) => (
                      <div
                        key={update.id}
                        className="flex items-center justify-between px-6 py-4 transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="flex items-center gap-4">
                          {/* timeline dot */}
                          <div className="relative flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                            {i < (dataUpdates.length - 1) && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 mt-0.5" style={{ background: BORDER }} />
                            )}
                          </div>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <Database className="w-4 h-4 text-white/30" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white capitalize">
                              {update.data_type} <span className="text-white/30 font-normal">atualizado</span>
                            </p>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mt-0.5">{update.source}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-black mb-1"
                            style={{ background: `${ACCENT}12`, color: ACCENT }}
                          >
                            +{update.records_updated} registros
                          </span>
                          <p className="text-[10px] text-white/20 font-medium">{format(new Date(update.created_at), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                    {(!dataUpdates || dataUpdates.length === 0) && (
                      <div className="py-12 text-center text-white/20 text-sm font-medium">Nenhum log registado.</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Tab active style override */}
      <style>{`
        [role="tab"][data-state="active"] {
          background: ${ACCENT} !important;
          color: #000 !important;
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default Admin;