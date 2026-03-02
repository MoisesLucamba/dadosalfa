import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, AlertTriangle, TrendingUp, Ship, Globe,
  Plus, Settings, Trash2, Check, Mail, Smartphone,
  Clock, Search, ChevronRight, Activity, RefreshCw,
  Zap, Radio, Eye, EyeOff, SlidersHorizontal,
  Flame, Info, TriangleAlert, CheckCircle2,
} from "lucide-react";
import {
  useNotifications, useUserAlerts, useAddUserAlert,
  useUpdateUserAlert, useDeleteUserAlert, useMarkNotificationRead
} from "@/hooks/useData";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

/* ─── Severity config ──────────────────────── */
const SEVERITY: Record<string, { label: string; iconCls: string; bgCls: string; borderCls: string; icon: any }> = {
  alert:   { label: "Crítico",  iconCls: "text-destructive",  bgCls: "bg-destructive/10",  borderCls: "border-destructive/30", icon: Flame },
  warning: { label: "Aviso",    iconCls: "text-orange-500",   bgCls: "bg-orange-500/10",   borderCls: "border-orange-500/30",  icon: TriangleAlert },
  info:    { label: "Info",     iconCls: "text-primary",      bgCls: "bg-primary/10",      borderCls: "border-primary/30",     icon: Info },
  success: { label: "Sucesso",  iconCls: "text-muted-foreground", bgCls: "bg-muted",       borderCls: "border-border",         icon: CheckCircle2 },
};

/* ─── Alert type config ────────────────────── */
const ALERT_TYPES: Record<string, { label: string; iconCls: string; bgCls: string; borderCls: string; icon: any; desc: string }> = {
  price:        { label: "Preço Crude",  iconCls: "text-foreground",     bgCls: "bg-muted",       borderCls: "border-border",         icon: TrendingUp, desc: "Monitoriza variações de cotação no mercado" },
  production:   { label: "Produção",     iconCls: "text-primary",        bgCls: "bg-primary/10",  borderCls: "border-primary/30",     icon: Activity,   desc: "Volume diário por bloco e operadora" },
  export:       { label: "Exportação",   iconCls: "text-primary",        bgCls: "bg-primary/10",  borderCls: "border-primary/30",     icon: Ship,       desc: "Fluxos e rotas de exportação" },
  geopolitical: { label: "Geopolítico",  iconCls: "text-destructive",    bgCls: "bg-destructive/10", borderCls: "border-destructive/30", icon: Globe, desc: "Riscos e eventos geopolíticos regionais" },
};

/* ─── Pulse dot ────────────────────────────── */
const LiveDot = ({ className = "bg-destructive" }: { className?: string }) => (
  <span className="relative inline-flex w-2 h-2 shrink-0">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${className}`} />
    <span className={`relative inline-flex rounded-full w-2 h-2 ${className}`} />
  </span>
);

/* ─── KPI card ─────────────────────────────── */
const KPICard = ({
  label, value, icon: Icon, iconCls, bgCls, borderCls, sub
}: { label: string; value: number | string; icon: any; iconCls: string; bgCls: string; borderCls: string; sub?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 group cursor-default bg-card border border-border/50 hover:${borderCls} hover:bg-muted/50 transition-all`}
  >
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgCls}`}>
        <Icon className={`w-5 h-5 ${iconCls}`} />
      </div>
      {typeof value === "number" && value > 0 && <LiveDot className={bgCls.replace('/10', '')} />}
    </div>
    <div>
      <p className="text-3xl font-black text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] mt-0.5 text-muted-foreground">{sub}</p>}
    </div>
  </motion.div>
);

/* ─── Notification card ────────────────────── */
const NotificationCard = ({
  notification, onRead, index
}: { notification: any; onRead: () => void; index: number }) => {
  const sev     = SEVERITY[notification.type] || SEVERITY.info;
  const SevIcon = sev.icon;
  const isUnread = !notification.is_read;
  const timeAgo  = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.035 }}
      onClick={() => isUnread && onRead()}
      className="relative group cursor-pointer"
    >
      <div className={`rounded-2xl overflow-hidden transition-all duration-200 border hover:bg-muted/50 ${
        isUnread ? `bg-card ${sev.borderCls}` : "bg-card/50 border-border/50"
      }`}>
        {isUnread && (
          <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${sev.bgCls.replace('/10', '')}`} />
        )}
        <div className="flex items-start gap-4 p-4 pl-5">
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 ${sev.bgCls}`}>
            <SevIcon className={`w-5 h-5 ${sev.iconCls}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">{notification.title}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sev.bgCls} ${sev.iconCls} ${sev.borderCls}`}>
                  {sev.label}
                </span>
                {isUnread && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                    Novo
                  </span>
                )}
              </div>
              <span className="text-[10px] shrink-0 flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" /> {timeAgo}
              </span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-2 text-muted-foreground">
              {notification.message}
            </p>
          </div>
          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUnread
              ? <CheckCircle2 className="w-4 h-4 text-primary" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Trigger card ─────────────────────────── */
const TriggerCard = ({
  trigger, onToggle, onDelete
}: { trigger: any; onToggle: (v: boolean) => void; onDelete: () => void }) => {
  const type    = ALERT_TYPES[trigger.alert_type] || ALERT_TYPES.price;
  const TypeIcon = type.icon;
  const active  = trigger.is_enabled;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl overflow-hidden group bg-card border ${active ? type.borderCls : "border-border/50"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? type.bgCls : "bg-muted"}`}>
            <TypeIcon className={`w-4 h-4 ${active ? type.iconCls : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-foreground">{type.label}</span>
              {active && <LiveDot className={type.bgCls.replace('/10', '')} />}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">{type.desc}</p>
            {trigger.threshold_value && (
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-[10px] font-black ${type.bgCls} ${type.iconCls}`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Limite: {trigger.threshold_value}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Switch checked={active} onCheckedChange={onToggle} />
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
          <span className="text-[9px] font-bold uppercase tracking-widest mr-1 text-muted-foreground">via</span>
          {trigger.notify_email && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-border text-muted-foreground">
              <Mail className="w-2.5 h-2.5" /> Email
            </span>
          )}
          {trigger.notify_app && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-border text-muted-foreground">
              <Smartphone className="w-2.5 h-2.5" /> App
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main page ────────────────────────────── */
const Alerts = () => {
  const { data: notifications, isLoading: loadingNotifications } = useNotifications();
  const { data: userAlerts,    isLoading: loadingAlerts }        = useUserAlerts();
  const addAlert    = useAddUserAlert();
  const updateAlert = useUpdateUserAlert();
  const deleteAlert = useDeleteUserAlert();
  const markRead    = useMarkNotificationRead();

  const [newTrigger, setNewTrigger] = useState({
    alert_type: "", threshold_value: "", notify_email: true, notify_app: true,
  });
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [showAll,        setShowAll]        = useState(false);

  const handleCreateTrigger = () => {
    if (!newTrigger.alert_type) return;
    addAlert.mutate({
      alert_type: newTrigger.alert_type,
      threshold_value: parseFloat(newTrigger.threshold_value) || undefined,
      notify_email: newTrigger.notify_email,
      notify_app:   newTrigger.notify_app,
    });
    setNewTrigger({ alert_type: "", threshold_value: "", notify_email: true, notify_app: true });
  };

  const unreadCount         = notifications?.filter(n => !n.is_read).length || 0;
  const criticalCount       = notifications?.filter(n => n.type === "alert").length || 0;
  const activeTriggersCount = userAlerts?.filter(a => a.is_enabled).length || 0;

  const displayedNotifications = notifications?.filter(n => {
    const matchesSev    = filterSeverity === "all" || n.type === filterSeverity;
    const matchesSearch = !searchQuery
      || n.title.toLowerCase().includes(searchQuery.toLowerCase())
      || n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRead   = showAll ? true : !n.is_read;
    return matchesSev && matchesSearch && matchesRead;
  });

  const inputCls = "h-11 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-0 bg-muted/50 border border-border focus:border-primary/40";

  const sevFilters = [
    { key: "all",     label: "Todos",   cls: "text-muted-foreground bg-muted border-border" },
    { key: "alert",   label: "Crítico", cls: "text-destructive bg-destructive/10 border-destructive/30" },
    { key: "warning", label: "Aviso",   cls: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
    { key: "info",    label: "Info",    cls: "text-primary bg-primary/10 border-primary/30" },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-background text-foreground">
      <Sidebar activeItem="/alerts" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeItem="/alerts" />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin">
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-destructive/10 text-destructive border border-destructive/30">
                    <Radio className="w-3 h-3 animate-pulse" /> Sistema de Alertas
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-destructive">
                      <LiveDot /> {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-foreground">
                  Central de<br />
                  <span className="text-destructive">Inteligência</span>
                </h1>
                <p className="text-sm max-w-md font-medium text-muted-foreground">
                  Monitorização em tempo real de eventos críticos, preços, produção e riscos geopolíticos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAll(p => !p)}
                  className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-border ${
                    showAll ? "bg-muted text-muted-foreground" : "bg-transparent text-muted-foreground"
                  }`}
                >
                  {showAll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showAll ? "Todas" : "Não lidas"}
                </button>
                <button
                  onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                  className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar lidas
                </button>
              </div>
            </div>

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Não Lidas"       value={unreadCount}             icon={Bell}     iconCls="text-destructive"      bgCls="bg-destructive/10"  borderCls="border-destructive/30" sub={unreadCount > 0 ? "Requerem atenção" : "Tudo em dia"} />
              <KPICard label="Alta Prioridade" value={criticalCount}           icon={Flame}    iconCls="text-destructive"      bgCls="bg-destructive/10"  borderCls="border-destructive/30" />
              <KPICard label="Gatilhos Ativos" value={activeTriggersCount}     icon={Zap}      iconCls="text-primary"          bgCls="bg-primary/10"      borderCls="border-primary/30" sub="Em monitorização" />
              <KPICard label="Total Gatilhos"  value={userAlerts?.length || 0} icon={Settings} iconCls="text-muted-foreground" bgCls="bg-muted"           borderCls="border-border" />
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">

              {/* LEFT — feed */}
              <div className="space-y-5">

                {/* toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      placeholder="Procurar alertas…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 h-9 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 bg-muted/50 border border-border focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sevFilters.map(f => {
                      const isActive = filterSeverity === f.key;
                      return (
                        <button key={f.key} onClick={() => setFilterSeverity(f.key)}
                          className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                            isActive ? f.cls : "text-muted-foreground bg-transparent border-transparent"
                          }`}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* feed label */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-black text-sm text-foreground">Notificações Recentes</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {displayedNotifications?.length || 0} resultado{(displayedNotifications?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* feed list */}
                <div className="space-y-2.5">
                  {loadingNotifications ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse bg-card" />
                    ))
                  ) : displayedNotifications && displayedNotifications.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {displayedNotifications.map((n, i) => (
                        <NotificationCard key={n.id} notification={n} onRead={() => markRead.mutate(n.id)} index={i} />
                      ))}
                    </AnimatePresence>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="py-20 text-center rounded-2xl flex flex-col items-center gap-4 bg-card border border-border/50">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
                        <CheckCircle2 className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-foreground">Tudo em dia!</p>
                        <p className="text-xs mt-0.5 font-medium text-muted-foreground">
                          Não existem alertas para os filtros selecionados.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT — triggers panel */}
              <div className="space-y-6 sticky top-6">

                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-black text-sm text-foreground">Gatilhos Ativos</span>
                    </div>
                    {activeTriggersCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                        {activeTriggersCount} ativos
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {loadingAlerts ? (
                      <div className="h-32 rounded-2xl animate-pulse bg-card" />
                    ) : userAlerts && userAlerts.length > 0 ? (
                      <AnimatePresence>
                        {userAlerts.map(trigger => (
                          <TriggerCard key={trigger.id} trigger={trigger}
                            onToggle={checked => updateAlert.mutate({ id: trigger.id, is_enabled: checked })}
                            onDelete={() => deleteAlert.mutate(trigger.id)} />
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-border">
                        <Zap className="w-6 h-6 mx-auto mb-2 text-muted" />
                        <p className="text-xs font-medium text-muted-foreground">Nenhum gatilho configurado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* new trigger form */}
                <div className="rounded-2xl overflow-hidden bg-card/50 border border-border/50">
                  <div className="px-6 py-5 flex items-center gap-3 border-b border-border/50 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-primary/30 to-transparent" />
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative bg-primary/10">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">Novo Gatilho</p>
                      <p className="text-[10px] font-medium mt-0.5 text-muted-foreground">Configure monitorização automática</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Alerta</label>
                      <Select value={newTrigger.alert_type}
                        onValueChange={v => setNewTrigger({ ...newTrigger, alert_type: v })}>
                        <SelectTrigger className={inputCls}>
                          <SelectValue placeholder="Selecione o tipo…" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ALERT_TYPES).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-3.5 h-3.5 ${cfg.iconCls}`} />
                                  <span>{cfg.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {newTrigger.alert_type && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] pl-1 text-muted-foreground">
                          {ALERT_TYPES[newTrigger.alert_type]?.desc}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Valor Limite <span className="normal-case font-normal text-muted-foreground/40">(opcional)</span>
                      </label>
                      <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder={newTrigger.alert_type === "price" ? "Ex: 85.50 USD" : newTrigger.alert_type === "production" ? "Ex: 50000 bpd" : "Ex: 75"}
                          value={newTrigger.threshold_value}
                          onChange={e => setNewTrigger({ ...newTrigger, threshold_value: e.target.value })}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                      <p className="text-[10px] pl-1 text-muted-foreground/40">Notificar apenas quando ultrapassar este valor.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Canais de Notificação</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: "notify_email" as const, icon: Mail,       label: "Email"    },
                          { key: "notify_app"   as const, icon: Smartphone, label: "App Push" },
                        ]).map(({ key, icon: Icon, label }) => {
                          const active = newTrigger[key];
                          return (
                            <button key={key}
                              onClick={() => setNewTrigger(p => ({ ...p, [key]: !active }))}
                              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${
                                active ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground"
                              }`}>
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                              {active && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateTrigger}
                      disabled={!newTrigger.alert_type || addAlert.isPending}
                      className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-destructive-foreground bg-destructive hover:bg-destructive/90"
                    >
                      {addAlert.isPending
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> A ativar…</>
                        : <><Zap className="w-4 h-4" /> Ativar Gatilho</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
