import { useState } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import {
  Bell, AlertTriangle, TrendingUp, Ship, Globe,
  Plus, Settings, Trash2, Check, Mail, Smartphone,
  Clock, Search, ChevronRight, Activity, RefreshCw,
  Zap, Radio, Eye, EyeOff, SlidersHorizontal,
  Flame, Info, TriangleAlert, CheckCircle2, Terminal,
  Shield, BarChart3, X,
} from "lucide-react";
import {
  useNotifications, useUserAlerts, useAddUserAlert,
  useUpdateUserAlert, useDeleteUserAlert, useMarkNotificationRead
} from "@/hooks/useData";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const SEV = {
  alert:   { label: "CRÍTICO",  color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", icon: Flame },
  warning: { label: "AVISO",    color: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  icon: TriangleAlert },
  info:    { label: "INFO",     color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)",  icon: Info },
  success: { label: "OK",       color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)",  icon: CheckCircle2 },
} as const;

const ATYPE = {
  price:        { label: "PREÇO CRUDE",  sig: "PRC", color: "#fb923c", icon: TrendingUp, desc: "Monitoriza variações de cotação no mercado" },
  production:   { label: "PRODUÇÃO",     sig: "PRD", color: "#38bdf8", icon: BarChart3,  desc: "Volume diário por bloco e operadora" },
  export:       { label: "EXPORTAÇÃO",   sig: "EXP", color: "#a78bfa", icon: Ship,       desc: "Fluxos e rotas de exportação" },
  geopolitical: { label: "GEOPOLÍTICO",  sig: "GEO", color: "#f87171", icon: Globe,      desc: "Riscos e eventos geopolíticos regionais" },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */
const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.018]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.04) 2px,rgba(255,255,255,0.04) 4px)" }} />
);

const RadarPulse = ({ color = "#f87171" }: { color?: string }) => (
  <span className="relative inline-flex h-2 w-2 shrink-0">
    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
      style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
  </span>
);

/* ═══════════════════════════════════════════════════════════════════════════
   STAT COUNTER (animated)
   ═══════════════════════════════════════════════════════════════════════════ */
const StatCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useState(() => {
    if (value === 0) return;
    let start = 0;
    const step = Math.ceil(value / 20);
    const iv = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(iv);
    }, 40);
  });
  return <>{display}</>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════════════════ */
const KPICard = ({
  label, value, icon: Icon, color, sig, sub, delay = 0,
}: {
  label: string; value: number | string; icon: any;
  color: string; sig: string; sub?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="relative overflow-hidden rounded"
    style={{ background: "hsl(var(--card))", border: `1px solid rgba(255,255,255,0.06)` }}
  >
    {/* Top accent line */}
    <div className="absolute top-0 left-0 right-0 h-[2px]"
      style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

    {/* Corner tag */}
    <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-[0.2em]"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color, ...MONO }}>
      {sig}
    </div>

    <div className="p-5 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        {typeof value === "number" && value > 0 && <RadarPulse color={color} />}
      </div>
      <div className="text-[2rem] font-bold tabular-nums leading-none mb-1"
        style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em", ...MONO }}>
        {typeof value === "number" ? <StatCounter value={value} /> : value}
      </div>
      <div className="text-[9px] font-bold tracking-[0.25em] mt-2" style={{ color: "hsl(var(--muted-foreground))", ...MONO }}>
        {label}
      </div>
      {sub && (
        <div className="text-[9px] mt-1" style={{ color, opacity: 0.7, ...MONO }}>{sub}</div>
      )}
    </div>

    {/* Bottom accent on hover */}
    <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 hover:opacity-100 transition-opacity"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION CARD
   ═══════════════════════════════════════════════════════════════════════════ */
const NotificationCard = ({
  notification, onRead, index,
}: { notification: any; onRead: () => void; index: number }) => {
  const sev    = SEV[notification.type as keyof typeof SEV] || SEV.info;
  const Icon   = sev.icon;
  const unread = !notification.is_read;
  const ago    = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={() => unread && onRead()}
      className="relative group cursor-pointer rounded overflow-hidden transition-all duration-150"
      style={{
        background: unread ? sev.bg : "hsl(var(--card))",
        border: `1px solid ${unread ? sev.border : "rgba(255,255,255,0.06)"}`,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = sev.border}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = unread ? sev.border : "rgba(255,255,255,0.06)"}
    >
      {/* Left severity accent */}
      {unread && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: sev.color }} />
      )}

      <div className="flex items-start gap-4 p-4 pl-5">
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 rounded flex items-center justify-center mt-0.5"
          style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
          <Icon className="w-4 h-4" style={{ color: sev.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-bold tracking-wide" style={{ color: "hsl(var(--foreground))", ...MONO }}>
                {notification.title}
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 rounded"
                style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, ...MONO }}>
                {sev.label}
              </span>
              {unread && (
                <span className="text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 rounded"
                  style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#f87171", ...MONO }}>
                  NOVO
                </span>
              )}
            </div>
            <span className="text-[9px] shrink-0 flex items-center gap-1 tabular-nums"
              style={{ color: "hsl(var(--muted-foreground))", ...MONO }}>
              <Clock className="w-3 h-3" /> {ago}
            </span>
          </div>

          {/* Message */}
          <p className="text-[11px] leading-relaxed line-clamp-2"
            style={{ color: "hsl(var(--muted-foreground))", ...MONO }}>
            {notification.message}
          </p>
        </div>

        {/* Action icon */}
        <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          {unread
            ? <CheckCircle2 className="w-4 h-4" style={{ color: "#4ade80" }} />
            : <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TRIGGER CARD
   ═══════════════════════════════════════════════════════════════════════════ */
const TriggerCard = ({
  trigger, onToggle, onDelete,
}: { trigger: any; onToggle: (v: boolean) => void; onDelete: () => void }) => {
  const t      = ATYPE[trigger.alert_type as keyof typeof ATYPE] || ATYPE.price;
  const Icon   = t.icon;
  const active = trigger.is_enabled;

  return (
    <motion.div layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded overflow-hidden group"
      style={{
        background: "hsl(var(--card))",
        border: `1px solid ${active ? `${t.color}25` : "rgba(255,255,255,0.06)"}`,
      }}>
      {/* Accent */}
      {active && <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }} />}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{ background: `${t.color}12`, border: `1px solid ${t.color}25` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: t.color, ...MONO }}>
                {t.sig}
              </span>
              <span className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))", ...MONO }}>
                {t.label}
              </span>
              {active && <RadarPulse color={t.color} />}
            </div>
            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))", ...MONO }}>
              {t.desc}
            </p>
            {trigger.threshold_value && (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[9px] font-bold"
                style={{ background: `${t.color}10`, border: `1px solid ${t.color}20`, color: t.color, ...MONO }}>
                <SlidersHorizontal className="w-2.5 h-2.5" />
                LIMITE: {trigger.threshold_value}
              </div>
            )}
          </div>

          {/* Toggle + delete */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Custom toggle */}
            <button onClick={() => onToggle(!active)}
              className="relative w-10 h-5 rounded-full transition-all duration-200"
              style={{
                background: active ? `linear-gradient(135deg, ${t.color}, ${t.color}90)` : "rgba(255,255,255,0.08)",
                border: `1px solid ${active ? t.color : "rgba(255,255,255,0.1)"}`,
              }}>
              <span className="absolute top-0.5 transition-all duration-200 w-4 h-4 rounded-full"
                style={{
                  left: active ? "calc(100% - 18px)" : "2px",
                  background: active ? "white" : "rgba(255,255,255,0.4)",
                }} />
            </button>
            <button onClick={onDelete}
              className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Channel badges */}
        <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[8px] font-bold tracking-[0.2em] mr-1" style={{ color: "hsl(var(--muted-foreground))", ...MONO }}>
            VIA //
          </span>
          {trigger.notify_email && (
            <span className="flex items-center gap-1 text-[8px] font-bold tracking-wider px-2 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", ...MONO }}>
              <Mail className="w-2.5 h-2.5" /> EMAIL
            </span>
          )}
          {trigger.notify_app && (
            <span className="flex items-center gap-1 text-[8px] font-bold tracking-wider px-2 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", ...MONO }}>
              <Smartphone className="w-2.5 h-2.5" /> APP
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const Alerts = () => {
  const { data: notifications, isLoading: loadingN } = useNotifications();
  const { data: userAlerts,    isLoading: loadingA } = useUserAlerts();
  const addAlert    = useAddUserAlert();
  const updateAlert = useUpdateUserAlert();
  const deleteAlert = useDeleteUserAlert();
  const markRead    = useMarkNotificationRead();

  const [newTrigger, setNewTrigger] = useState({
    alert_type: "", threshold_value: "", notify_email: true, notify_app: true,
  });
  const [filterSev,   setFilterSev]   = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll,     setShowAll]     = useState(false);
  const [now]                         = useState(new Date());

  const unreadCount   = notifications?.filter(n => !n.is_read).length || 0;
  const criticalCount = notifications?.filter(n => n.type === "alert").length || 0;
  const activeCount   = userAlerts?.filter(a => a.is_enabled).length || 0;

  const displayed = notifications?.filter(n => {
    const mSev    = filterSev === "all" || n.type === filterSev;
    const mSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const mRead   = showAll ? true : !n.is_read;
    return mSev && mSearch && mRead;
  });

  const handleCreate = () => {
    if (!newTrigger.alert_type) return;
    addAlert.mutate({
      alert_type: newTrigger.alert_type,
      threshold_value: parseFloat(newTrigger.threshold_value) || undefined,
      notify_email: newTrigger.notify_email,
      notify_app: newTrigger.notify_app,
    });
    setNewTrigger({ alert_type: "", threshold_value: "", notify_email: true, notify_app: true });
  };

  const sevFilters = [
    { key: "all",     label: "TODOS",   color: "hsl(var(--muted-foreground))" },
    { key: "alert",   label: "CRÍTICO", color: "#f87171" },
    { key: "warning", label: "AVISO",   color: "#fb923c" },
    { key: "info",    label: "INFO",    color: "#38bdf8" },
  ];

  return (
    <div className="flex h-screen overflow-hidden text-foreground"
      style={{ background: "hsl(var(--background))", ...MONO }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
        .alerts-scroll::-webkit-scrollbar{width:4px}
        .alerts-scroll::-webkit-scrollbar-thumb{background:rgba(220,38,38,0.2);border-radius:10px}
        .sel-trigger{background:hsl(var(--card))!important;border:1px solid rgba(255,255,255,0.08)!important;border-radius:4px!important;color:hsl(var(--foreground))!important;font-family:'IBM Plex Mono',monospace!important;font-size:10px!important;font-weight:700!important;letter-spacing:0.1em!important}
        .sel-content{background:hsl(var(--card))!important;border:1px solid rgba(220,38,38,0.2)!important;border-radius:4px!important;font-family:'IBM Plex Mono',monospace!important;font-size:10px!important}
        .sel-item:hover{background:rgba(220,38,38,0.08)!important}
      `}</style>

      <ScanlineOverlay />
      <Sidebar activeItem="/alerts" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeItem="/alerts" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2"
          style={{ borderBottom: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1.5" style={{ color: "#f87171" }}>
              <RadarPulse color="#f87171" />
              SISTEMA DE ALERTAS ONLINE
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>MÓDULO-05 // INTELIGÊNCIA DE EVENTOS</span>
            {unreadCount > 0 && (
              <>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
                <span style={{ color: "#f87171" }}>{unreadCount} NÃO {unreadCount === 1 ? "LIDA" : "LIDAS"}</span>
              </>
            )}
          </div>
          <span className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
            {now.toLocaleTimeString("pt-BR", { hour12: false })}
          </span>
        </div>

        <main className="flex-1 overflow-y-auto alerts-scroll">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 space-y-8">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em]"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Terminal className="w-3 h-3 text-red-500" />
                  <span>ALPHADAT-OS</span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                  <span>EVENTOS</span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                  <span style={{ color: "hsl(var(--foreground))" }}>CENTRAL DE INTELIGÊNCIA</span>
                </div>

                {/* Title */}
                <div>
                  <div className="text-[9px] font-bold tracking-[0.3em] mb-2" style={{ color: "rgba(220,38,38,0.8)" }}>
                    MÓDULO-05 // ALERTAS & MONITORIZAÇÃO
                  </div>
                  <h1 className="font-bold leading-none" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                    CENTRAL DE<br />
                    <span style={{ color: "#f87171" }}>INTELIGÊNCIA</span>
                  </h1>
                </div>

                <p className="text-[11px] max-w-md" style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
                  MONITORIZAÇÃO EM TEMPO REAL DE EVENTOS CRÍTICOS,
                  PREÇOS, PRODUÇÃO E RISCOS GEOPOLÍTICOS.
                </p>
              </motion.div>

              {/* Action buttons */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="flex items-center gap-2">
                <button
                  onClick={() => setShowAll(p => !p)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"}>
                  {showAll ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showAll ? "TODAS" : "NÃO LIDAS"}
                </button>
                <button
                  onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.15)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.08)"}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACK ALL
                </button>
              </motion.div>
            </div>

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard label="NÃO LIDAS"       value={unreadCount}             icon={Bell}     color="#f87171" sig="EVT" sub={unreadCount > 0 ? "REQUEREM ATENÇÃO" : "TUDO EM DIA"} delay={0} />
              <KPICard label="ALTA PRIORIDADE" value={criticalCount}           icon={Flame}    color="#f87171" sig="CRT" delay={0.05} />
              <KPICard label="GATILHOS ATIVOS" value={activeCount}             icon={Zap}      color="#38bdf8" sig="ACT" sub="EM MONITORIZAÇÃO" delay={0.1} />
              <KPICard label="TOTAL GATILHOS"  value={userAlerts?.length || 0} icon={Settings} color="hsl(var(--muted-foreground))" sig="TOT" delay={0.15} />
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">

              {/* ──── LEFT — feed ──── */}
              <div className="space-y-4">

                {/* Panel header */}
                <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "rgba(220,38,38,0.8)" }}>
                    FEED // NOTIFICAÇÕES RECENTES
                  </span>
                  {unreadCount > 0 && (
                    <span className="ml-auto text-[8px] font-bold tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                      {unreadCount} NOVAS
                    </span>
                  )}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <input
                      placeholder="PESQUISAR ALERTAS..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 h-8 rounded outline-none text-[10px] font-bold tracking-wider transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--foreground))", caretColor: "#dc2626" }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.07)"}
                    />
                  </div>
                  {/* Severity filters */}
                  <div className="flex items-center gap-1">
                    {sevFilters.map(f => (
                      <button key={f.key} onClick={() => setFilterSev(f.key)}
                        className="h-8 px-3 rounded text-[9px] font-bold tracking-widest transition-all"
                        style={{
                          background: filterSev === f.key ? `${f.color}15` : "transparent",
                          border: `1px solid ${filterSev === f.key ? `${f.color}30` : "transparent"}`,
                          color: filterSev === f.key ? f.color : "hsl(var(--muted-foreground))",
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-red-500" />
                    <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      EVENTOS // {displayed?.length || 0} RESULTADOS
                    </span>
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}
                      className="flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded transition-all"
                      style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                      <X className="w-2.5 h-2.5" /> LIMPAR
                    </button>
                  )}
                </div>

                {/* Feed list */}
                <div className="space-y-2">
                  {loadingN ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 rounded animate-pulse" style={{ background: "hsl(var(--card))" }} />
                    ))
                  ) : displayed && displayed.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {displayed.map((n, i) => (
                        <NotificationCard key={n.id} notification={n} onRead={() => markRead.mutate(n.id)} index={i} />
                      ))}
                    </AnimatePresence>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="py-16 text-center rounded flex flex-col items-center gap-4"
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-12 h-12 rounded flex items-center justify-center"
                        style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
                        <CheckCircle2 className="w-6 h-6" style={{ color: "#4ade80" }} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--foreground))" }}>
                          SISTEMA NOMINAL
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                          NENHUM ALERTA PARA OS FILTROS SELECCIONADOS
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ──── RIGHT — triggers ──── */}
              <div className="space-y-5 sticky top-6">

                {/* Active triggers panel */}
                <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#38bdf8,transparent)" }} />

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#38bdf8" }} />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "#38bdf8" }}>
                        GATILHOS // ACTIVOS
                      </span>
                    </div>
                    {activeCount > 0 && (
                      <span className="text-[8px] font-bold tracking-wider px-2 py-0.5 rounded tabular-nums"
                        style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8" }}>
                        {activeCount} ONLINE
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    {loadingA ? (
                      <div className="h-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
                    ) : userAlerts && userAlerts.length > 0 ? (
                      <AnimatePresence>
                        {userAlerts.map(trigger => (
                          <TriggerCard key={trigger.id} trigger={trigger}
                            onToggle={checked => updateAlert.mutate({ id: trigger.id, is_enabled: checked })}
                            onDelete={() => deleteAlert.mutate(trigger.id)} />
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="py-8 text-center">
                        <Zap className="w-5 h-5 mx-auto mb-2 opacity-20" style={{ color: "hsl(var(--muted-foreground))" }} />
                        <p className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          SEM GATILHOS CONFIGURADOS
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── New trigger form ── */}
                <div className="rounded overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {/* Top accent */}
                  <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#dc2626,transparent)" }} />

                  {/* Form header */}
                  <div className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(220,38,38,0.04)" }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                      <Plus className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "rgba(220,38,38,0.8)" }}>
                        NOVO GATILHO // CONFIG
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Configure monitorização automática
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">

                    {/* Alert type selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        TIPO DE ALERTA
                      </label>
                      {/* Custom type picker */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(ATYPE).map(([key, cfg]) => {
                          const Icon = cfg.icon;
                          const selected = newTrigger.alert_type === key;
                          return (
                            <button key={key}
                              onClick={() => setNewTrigger({ ...newTrigger, alert_type: key })}
                              className="flex items-center gap-2 p-2.5 rounded transition-all text-left"
                              style={{
                                background: selected ? `${cfg.color}12` : "rgba(255,255,255,0.02)",
                                border: `1px solid ${selected ? `${cfg.color}30` : "rgba(255,255,255,0.06)"}`,
                              }}>
                              <Icon className="w-3 h-3 shrink-0" style={{ color: selected ? cfg.color : "hsl(var(--muted-foreground))" }} />
                              <div>
                                <div className="text-[8px] font-bold tracking-wider" style={{ color: selected ? cfg.color : "hsl(var(--muted-foreground))" }}>
                                  {cfg.sig}
                                </div>
                                <div className="text-[9px] font-bold" style={{ color: selected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                                  {cfg.label}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {newTrigger.alert_type && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="px-2 py-1.5 rounded text-[9px]"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))" }}>
                            {ATYPE[newTrigger.alert_type as keyof typeof ATYPE]?.desc}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Threshold */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        VALOR LIMITE <span className="opacity-40 normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                        <input
                          type="number"
                          placeholder={newTrigger.alert_type === "price" ? "EX: 85.50 USD" : newTrigger.alert_type === "production" ? "EX: 50000 BPD" : "EX: 75"}
                          value={newTrigger.threshold_value}
                          onChange={e => setNewTrigger({ ...newTrigger, threshold_value: e.target.value })}
                          className="w-full pl-9 pr-3 h-9 rounded outline-none text-[10px] font-bold tracking-wider transition-colors"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--foreground))", caretColor: "#dc2626" }}
                          onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                          onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.07)"}
                        />
                      </div>
                      <div className="text-[9px] opacity-40" style={{ color: "hsl(var(--muted-foreground))" }}>
                        NOTIFICAR APENAS QUANDO ULTRAPASSAR ESTE VALOR
                      </div>
                    </div>

                    {/* Channels */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        CANAIS DE NOTIFICAÇÃO
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { key: "notify_email" as const, icon: Mail,       label: "EMAIL",    sig: "MAL" },
                          { key: "notify_app"   as const, icon: Smartphone, label: "APP PUSH", sig: "PSH" },
                        ]).map(({ key, icon: Icon, label, sig }) => {
                          const active = newTrigger[key];
                          return (
                            <button key={key}
                              onClick={() => setNewTrigger(p => ({ ...p, [key]: !active }))}
                              className="flex items-center gap-2 p-2.5 rounded text-left transition-all"
                              style={{
                                background: active ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${active ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.06)"}`,
                              }}>
                              <Icon className="w-3 h-3 shrink-0" style={{ color: active ? "#38bdf8" : "hsl(var(--muted-foreground))" }} />
                              <div className="flex-1">
                                <div className="text-[8px] font-bold tracking-wider" style={{ color: active ? "#38bdf8" : "hsl(var(--muted-foreground))" }}>{sig}</div>
                                <div className="text-[9px] font-bold" style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>{label}</div>
                              </div>
                              {active && <Check className="w-3 h-3 ml-auto" style={{ color: "#38bdf8" }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={handleCreate}
                      disabled={!newTrigger.alert_type || addAlert.isPending}
                      className="w-full h-10 rounded text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", border: "1px solid rgba(220,38,38,0.5)", boxShadow: "0 0 16px rgba(220,38,38,0.15)" }}>
                      {addAlert.isPending
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> ACTIVANDO...</>
                        : <><Zap className="w-3.5 h-3.5" /> ACTIVAR GATILHO</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Alerts;