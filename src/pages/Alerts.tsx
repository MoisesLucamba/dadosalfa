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

/* ─────────────────────────────────────────────
   PALETTE  —  azul escuro · preto · vermelho · branco
───────────────────────────────────────────── */
const BG_DEEP  = "#04060D";                        // preto-azulado profundo
const BG_NAVY  = "#080D1A";                        // painel azul-marinho
const BG_CARD  = "#0D1526";                        // cartão ligeiramente mais claro
const BG_HOVER = "#111E33";                        // hover
const RED      = "#E8192C";                        // vermelho alerta
const RED_DIM  = "rgba(232,25,44,0.12)";
const RED_BDR  = "rgba(232,25,44,0.30)";
const BLUE     = "#1A5CFF";                        // azul elétrico
const BLUE_MID = "#3B7BFF";                        // azul secundário
const BLUE_DIM = "rgba(26,92,255,0.15)";
const BLUE_BDR = "rgba(59,123,255,0.30)";
const WHITE    = "#FFFFFF";
const W60      = "rgba(255,255,255,0.60)";
const W30      = "rgba(255,255,255,0.30)";
const W10      = "rgba(255,255,255,0.08)";
const BORDER   = "rgba(255,255,255,0.07)";

/* ─── Severity config ──────────────────────── */
const SEVERITY: Record<string, { label: string; color: string; bg: string; bdr: string; icon: any }> = {
  alert:   { label: "Crítico",  color: RED,       bg: RED_DIM,                         bdr: RED_BDR,  icon: Flame },
  warning: { label: "Aviso",    color: "#FF6B1A", bg: "rgba(255,107,26,0.12)",         bdr: "rgba(255,107,26,0.30)", icon: TriangleAlert },
  info:    { label: "Info",     color: BLUE_MID,  bg: BLUE_DIM,                        bdr: BLUE_BDR, icon: Info },
  success: { label: "Sucesso",  color: W60,       bg: W10,                             bdr: BORDER,   icon: CheckCircle2 },
};

/* ─── Alert type config ────────────────────── */
const ALERT_TYPES: Record<string, { label: string; color: string; bg: string; bdr: string; icon: any; desc: string }> = {
  price:        { label: "Preço Crude",  color: WHITE,    bg: W10,       bdr: BORDER,  icon: TrendingUp, desc: "Monitoriza variações de cotação no mercado" },
  production:   { label: "Produção",     color: BLUE_MID, bg: BLUE_DIM,  bdr: BLUE_BDR, icon: Activity, desc: "Volume diário por bloco e operadora" },
  export:       { label: "Exportação",   color: BLUE_MID, bg: BLUE_DIM,  bdr: BLUE_BDR, icon: Ship,     desc: "Fluxos e rotas de exportação" },
  geopolitical: { label: "Geopolítico",  color: RED,      bg: RED_DIM,   bdr: RED_BDR,  icon: Globe,    desc: "Riscos e eventos geopolíticos regionais" },
};

/* ─── Pulse dot ────────────────────────────── */
const LiveDot = ({ color = RED }: { color?: string }) => (
  <span className="relative inline-flex w-2 h-2 shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
      style={{ background: color }} />
    <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: color }} />
  </span>
);

/* ─── KPI card ─────────────────────────────── */
const KPICard = ({
  label, value, icon: Icon, color, bg, bdr, sub
}: { label: string; value: number | string; icon: any; color: string; bg: string; bdr: string; sub?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 group cursor-default"
    style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
    whileHover={{ borderColor: bdr, background: BG_HOVER }}
    transition={{ duration: 0.18 }}
  >
    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
      style={{ background: color }} />
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {typeof value === "number" && value > 0 && <LiveDot color={color} />}
    </div>
    <div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: W30 }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: W30 }}>{sub}</p>}
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
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{ background: isUnread ? BG_CARD : BG_NAVY, border: `1px solid ${isUnread ? sev.bdr : BORDER}` }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG_HOVER)}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = isUnread ? BG_CARD : BG_NAVY)}
      >
        {/* severity stripe */}
        {isUnread && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: sev.color }} />
        )}
        <div className="flex items-start gap-4 p-4 pl-5">
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5" style={{ background: sev.bg }}>
            <SevIcon className="w-5 h-5" style={{ color: sev.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white">{notification.title}</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.bdr}` }}>
                  {sev.label}
                </span>
                {isUnread && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}>
                    Novo
                  </span>
                )}
              </div>
              <span className="text-[10px] shrink-0 flex items-center gap-1" style={{ color: W30 }}>
                <Clock className="w-3 h-3" /> {timeAgo}
              </span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: W30 }}>
              {notification.message}
            </p>
          </div>
          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUnread
              ? <CheckCircle2 className="w-4 h-4" style={{ color: BLUE_MID }} />
              : <ChevronRight className="w-4 h-4" style={{ color: W30 }} />}
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
      className="rounded-2xl overflow-hidden group"
      style={{ background: BG_CARD, border: `1px solid ${active ? type.bdr : BORDER}` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: active ? type.bg : W10 }}>
            <TypeIcon className="w-4 h-4" style={{ color: active ? type.color : W30 }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-white">{type.label}</span>
              {active && <LiveDot color={type.color} />}
            </div>
            <p className="text-[10px] font-medium" style={{ color: W30 }}>{type.desc}</p>
            {trigger.threshold_value && (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-[10px] font-black"
                style={{ background: type.bg, color: type.color }}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Limite: {trigger.threshold_value}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Switch checked={active} onCheckedChange={onToggle} />
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              style={{ color: W30 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = RED; (e.currentTarget as HTMLElement).style.background = RED_DIM; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = W30;  (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* channels */}
        <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span className="text-[9px] font-bold uppercase tracking-widest mr-1" style={{ color: W30 }}>via</span>
          {trigger.notify_email && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ border: `1px solid ${BORDER}`, color: W30 }}>
              <Mail className="w-2.5 h-2.5" /> Email
            </span>
          )}
          {trigger.notify_app && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ border: `1px solid ${BORDER}`, color: W30 }}>
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

  const inputCls = "h-11 rounded-xl text-sm text-white placeholder:text-white/20 focus:ring-0 bg-white/5 border border-white/10 focus:border-blue-500/40";

  const sevFilters = [
    { key: "all",     label: "Todos",   color: W60,       bg: W10,     bdr: BORDER   },
    { key: "alert",   label: "Crítico", color: RED,       bg: RED_DIM, bdr: RED_BDR  },
    { key: "warning", label: "Aviso",   color: "#FF6B1A", bg: "rgba(255,107,26,0.12)", bdr: "rgba(255,107,26,0.30)" },
    { key: "info",    label: "Info",    color: BLUE_MID,  bg: BLUE_DIM,bdr: BLUE_BDR },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: BG_DEEP, color: WHITE }}>
      <Sidebar activeItem="/alerts" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeItem="/alerts" />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8" style={{ scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent` }}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background: RED_DIM, color: RED, border: `1px solid ${RED_BDR}` }}>
                    <Radio className="w-3 h-3 animate-pulse" /> Sistema de Alertas
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: RED }}>
                      <LiveDot color={RED} /> {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                  Central de<br />
                  <span style={{ color: RED }}>Inteligência</span>
                </h1>
                <p className="text-sm max-w-md font-medium" style={{ color: W30 }}>
                  Monitorização em tempo real de eventos críticos, preços, produção e riscos geopolíticos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAll(p => !p)}
                  className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border"
                  style={{ background: showAll ? W10 : "transparent", borderColor: BORDER, color: showAll ? W60 : W30 }}
                >
                  {showAll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showAll ? "Todas" : "Não lidas"}
                </button>
                <button
                  onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                  className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                  style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(26,92,255,0.25)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE_DIM)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar lidas
                </button>
              </div>
            </div>

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Não Lidas"       value={unreadCount}             icon={Bell}     color={RED}      bg={RED_DIM}  bdr={RED_BDR}  sub={unreadCount > 0 ? "Requerem atenção" : "Tudo em dia"} />
              <KPICard label="Alta Prioridade" value={criticalCount}           icon={Flame}    color={RED}      bg={RED_DIM}  bdr={RED_BDR} />
              <KPICard label="Gatilhos Ativos" value={activeTriggersCount}     icon={Zap}      color={BLUE_MID} bg={BLUE_DIM} bdr={BLUE_BDR} sub="Em monitorização" />
              <KPICard label="Total Gatilhos"  value={userAlerts?.length || 0} icon={Settings} color={W60}      bg={W10}      bdr={BORDER} />
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">

              {/* LEFT — feed */}
              <div className="space-y-5">

                {/* toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl"
                  style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W30 }} />
                    <input
                      placeholder="Procurar alertas…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 h-9 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sevFilters.map(f => {
                      const isActive = filterSeverity === f.key;
                      return (
                        <button key={f.key} onClick={() => setFilterSeverity(f.key)}
                          className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                          style={{
                            background: isActive ? f.bg : "transparent",
                            color: isActive ? f.color : W30,
                            border: `1px solid ${isActive ? f.bdr : "transparent"}`,
                          }}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* feed label */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: BLUE_MID }} />
                    <span className="font-black text-sm text-white">Notificações Recentes</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: RED_DIM, color: RED }}>
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: W30 }}>
                    {displayedNotifications?.length || 0} resultado{(displayedNotifications?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* feed list */}
                <div className="space-y-2.5">
                  {loadingNotifications ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: BG_CARD }} />
                    ))
                  ) : displayedNotifications && displayedNotifications.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {displayedNotifications.map((n, i) => (
                        <NotificationCard key={n.id} notification={n} onRead={() => markRead.mutate(n.id)} index={i} />
                      ))}
                    </AnimatePresence>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="py-20 text-center rounded-2xl flex flex-col items-center gap-4"
                      style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: BLUE_DIM }}>
                        <CheckCircle2 className="w-7 h-7" style={{ color: BLUE_MID }} />
                      </div>
                      <div>
                        <p className="font-black text-white">Tudo em dia!</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: W30 }}>
                          Não existem alertas para os filtros selecionados.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT — triggers panel */}
              <div className="space-y-6 sticky top-6">

                {/* active triggers list */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" style={{ color: BLUE_MID }} />
                      <span className="font-black text-sm text-white">Gatilhos Ativos</span>
                    </div>
                    {activeTriggersCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}>
                        {activeTriggersCount} ativos
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {loadingAlerts ? (
                      <div className="h-32 rounded-2xl animate-pulse" style={{ background: BG_CARD }} />
                    ) : userAlerts && userAlerts.length > 0 ? (
                      <AnimatePresence>
                        {userAlerts.map(trigger => (
                          <TriggerCard key={trigger.id} trigger={trigger}
                            onToggle={checked => updateAlert.mutate({ id: trigger.id, is_enabled: checked })}
                            onDelete={() => deleteAlert.mutate(trigger.id)} />
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="p-8 text-center rounded-2xl" style={{ border: `1px dashed ${BORDER}` }}>
                        <Zap className="w-6 h-6 mx-auto mb-2" style={{ color: W10 }} />
                        <p className="text-xs font-medium" style={{ color: W30 }}>Nenhum gatilho configurado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px" style={{ background: BORDER }} />

                {/* new trigger form */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}>
                  {/* header */}
                  <div className="px-6 py-5 flex items-center gap-3 border-b relative overflow-hidden"
                    style={{ borderColor: BORDER }}>
                    <div className="absolute inset-0 opacity-10"
                      style={{ background: `radial-gradient(ellipse at top left, ${BLUE}, transparent 60%)` }} />
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
                      style={{ background: BLUE_DIM }}>
                      <Plus className="w-4 h-4" style={{ color: BLUE_MID }} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">Novo Gatilho</p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: W30 }}>Configure monitorização automática</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: W30 }}>Tipo de Alerta</label>
                      <Select value={newTrigger.alert_type}
                        onValueChange={v => setNewTrigger({ ...newTrigger, alert_type: v })}>
                        <SelectTrigger className={inputCls}>
                          <SelectValue placeholder="Selecione o tipo…" />
                        </SelectTrigger>
                        <SelectContent style={{ background: BG_CARD, borderColor: BORDER }}>
                          {Object.entries(ALERT_TYPES).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                  <span>{cfg.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {newTrigger.alert_type && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] pl-1" style={{ color: W30 }}>
                          {ALERT_TYPES[newTrigger.alert_type]?.desc}
                        </motion.p>
                      )}
                    </div>

                    {/* threshold */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: W30 }}>
                        Valor Limite <span className="normal-case font-normal" style={{ color: W10 }}>(opcional)</span>
                      </label>
                      <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: W30 }} />
                        <Input
                          type="number"
                          placeholder={newTrigger.alert_type === "price" ? "Ex: 85.50 USD" : newTrigger.alert_type === "production" ? "Ex: 50000 bpd" : "Ex: 75"}
                          value={newTrigger.threshold_value}
                          onChange={e => setNewTrigger({ ...newTrigger, threshold_value: e.target.value })}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                      <p className="text-[10px] pl-1" style={{ color: W10 }}>Notificar apenas quando ultrapassar este valor.</p>
                    </div>

                    {/* channels */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: W30 }}>Canais de Notificação</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: "notify_email" as const, icon: Mail,       label: "Email"    },
                          { key: "notify_app"   as const, icon: Smartphone, label: "App Push" },
                        ]).map(({ key, icon: Icon, label }) => {
                          const active = newTrigger[key];
                          return (
                            <button key={key}
                              onClick={() => setNewTrigger(p => ({ ...p, [key]: !active }))}
                              className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border"
                              style={{
                                background: active ? BLUE_DIM : W10,
                                borderColor: active ? BLUE_BDR : BORDER,
                                color: active ? BLUE_MID : W30,
                              }}>
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                              {active && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleCreateTrigger}
                      disabled={!newTrigger.alert_type || addAlert.isPending}
                      className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                      style={{ background: RED }}
                      onMouseEnter={e => { if (!addAlert.isPending && newTrigger.alert_type) (e.currentTarget as HTMLElement).style.background = "#C4111F"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = RED; }}
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

      <style>{`
        [data-state="checked"] { background: ${BLUE} !important; }
      `}</style>
    </div>
  );
};

export default Alerts;