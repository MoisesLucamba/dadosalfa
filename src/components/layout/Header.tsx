import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, ChevronDown, LogOut, Sun, Moon,
  Settings, UserCircle, X, Check, AlertTriangle,
  Info, CreditCard, ChevronRight, Radio, HelpCircle, Terminal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { DataSyncButton } from "@/components/dashboard/DataSyncButton";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useData";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#04080f",
  card:     "#070d1a",
  hover:    "#0a1220",
  red:      "#ef4444",
  redDim:   "rgba(220,38,38,0.1)",
  redBdr:   "rgba(220,38,38,0.25)",
  sky:      "#38bdf8",
  skyDim:   "rgba(56,189,248,0.1)",
  skyBdr:   "rgba(56,189,248,0.25)",
  border:   "rgba(255,255,255,0.06)",
  w60:      "rgba(255,255,255,0.60)",
  w30:      "rgba(255,255,255,0.30)",
  w08:      "rgba(255,255,255,0.08)",
  mono:     "'IBM Plex Mono', monospace",
};

/* ─── Severity map ───────────────────────────────────────────────────────── */
const SEV: Record<string, { color: string; bg: string; icon: any }> = {
  alert:   { color: T.red,    bg: T.redDim,                      icon: AlertTriangle },
  warning: { color: "#fb923c",bg: "rgba(251,146,60,0.1)",        icon: AlertTriangle },
  info:    { color: T.sky,    bg: T.skyDim,                      icon: Info          },
  success: { color: "#4ade80",bg: "rgba(74,222,128,0.1)",        icon: Check         },
};

/* ─── Quick suggestions ──────────────────────────────────────────────────── */
const QUICK: Array<{ label: string; sig: string; path: string; tag: string }> = [
  { label: "BLOCO 17 — TOTALENERGIES", sig: "PRD", path: "/production", tag: "PRODUÇÃO"    },
  { label: "PREÇO BRENT HOJE",         sig: "MKT", path: "/prices",     tag: "PREÇOS"      },
  { label: "EXPORTAÇÕES DEZEMBRO",     sig: "EXP", path: "/exports",    tag: "EXPORTAÇÕES" },
  { label: "RISCO GEOPOLÍTICO ANGOLA", sig: "RSK", path: "/risk",       tag: "RISCO"       },
  { label: "RELATÓRIO MENSAL",         sig: "REP", path: "/reports",    tag: "RELATÓRIOS"  },
];

interface HeaderProps { activeItem?: string; onHelpClick?: () => void; }

export function Header({ activeItem = "/", onHelpClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser,   setShowUser]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState("");

  const notifsRef = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unread      = notifications?.filter(n => !n.is_read) ?? [];
  const unreadCount = unread.length;

  const displayName = user?.email?.split("@")[0]?.toUpperCase() || "OPERADOR";
  const initials    = displayName.substring(0, 2);

  /* Close on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setShowUser(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ⌘K shortcut */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchVal(""); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSignOut = async () => {
    setShowUser(false);
    await signOut();
    toast.success("SESSÃO TERMINADA // ACK");
    navigate("/auth");
  };

  const filtered = QUICK.filter(s =>
    !searchVal || s.label.toLowerCase().includes(searchVal.toLowerCase())
  );

  /* Shared input style for search overlay */
  const inpCls: React.CSSProperties = {
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    fontFamily: T.mono,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    outline: "none",
    flex: 1,
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`}</style>

      {/* ── Header bar ── */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-30"
        style={{
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
          fontFamily: T.mono,
        }}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MobileNav activeItem={activeItem} />

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative hidden sm:flex items-center gap-2.5 h-8 px-3 rounded text-left flex-1 max-w-xs transition-all"
            style={{ background: T.w08, border: `1px solid ${T.border}`, color: T.w30 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.redBdr; (e.currentTarget as HTMLElement).style.color = T.w60; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.w30; }}
          >
            <Search className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-bold tracking-wider flex-1 truncate">PESQUISAR BLOCOS, OPERADORES…</span>
            <kbd className="hidden md:flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: T.w08, color: T.w30, fontFamily: T.mono }}>
              ⌘K
            </kbd>
          </button>

          {/* Search — mobile */}
          <button
            className="sm:hidden w-8 h-8 rounded flex items-center justify-center"
            style={{ background: T.w08, color: T.w60 }}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-0.5 md:gap-1 ml-2">

          {/* Data sync */}
          <div className="hidden lg:block mr-1">
            <DataSyncButton variant="compact" />
          </div>

          {/* LIVE pill */}
          <div className="hidden md:flex items-center gap-1.5 h-6 px-2.5 rounded mr-1.5"
            style={{ background: T.redDim, border: `1px solid ${T.redBdr}` }}>
            <Radio className="w-2.5 h-2.5 animate-pulse" style={{ color: T.red }} />
            <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: T.red }}>LIVE</span>
          </div>

          {/* Help */}
          {onHelpClick && (
            <IconBtn onClick={onHelpClick} title="TOUR GUIADO">
              <HelpCircle className="w-3.5 h-3.5" />
            </IconBtn>
          )}

          {/* Theme */}
          <IconBtn onClick={toggleTheme} title={theme === "dark" ? "MODO CLARO" : "MODO ESCURO"}>
            <motion.div animate={{ rotate: theme === "dark" ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </motion.div>
          </IconBtn>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => { setShowNotifs(p => !p); setShowUser(false); }}
              className="relative w-8 h-8 rounded flex items-center justify-center transition-all"
              style={{
                background: showNotifs ? T.redDim : "transparent",
                color: showNotifs ? T.red : T.w30,
                border: `1px solid ${showNotifs ? T.redBdr : "transparent"}`,
              }}
              onMouseEnter={e => { if (!showNotifs) { (e.currentTarget as HTMLElement).style.background = T.w08; (e.currentTarget as HTMLElement).style.color = "white"; } }}
              onMouseLeave={e => { if (!showNotifs) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.w30; } }}
            >
              <Bell className="w-3.5 h-3.5" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: T.red, fontFamily: T.mono }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notifs dropdown */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-10 w-80 rounded overflow-hidden shadow-2xl z-50"
                  style={{ background: T.card, border: `1px solid rgba(220,38,38,0.2)`, fontFamily: T.mono }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: T.border, background: "rgba(220,38,38,0.04)" }}>
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3" style={{ color: T.red }} />
                      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.9)" }}>NOTIFICAÇÕES</span>
                      {unreadCount > 0 && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded tracking-widest"
                          style={{ background: T.redDim, color: T.red }}>
                          {unreadCount} NOVAS
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                        className="text-[8px] font-bold tracking-widest transition-colors"
                        style={{ color: T.w30 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.sky}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.w30}
                      >
                        MARCAR LIDAS
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 7).map(n => {
                        const sev = SEV[n.type] || SEV.info;
                        const SIcon = sev.icon;
                        return (
                          <div
                            key={n.id}
                            className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                            style={{ borderBottom: `1px solid ${T.border}` }}
                            onClick={() => { markRead.mutate(n.id); setShowNotifs(false); navigate("/alerts"); }}
                            onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            {!n.is_read && (
                              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r"
                                style={{ background: sev.color }} />
                            )}
                            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: sev.bg }}>
                              <SIcon className="w-3 h-3" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-bold tracking-wider line-clamp-1" style={{ color: "rgba(255,255,255,0.9)" }}>{n.title?.toUpperCase()}</p>
                                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev.color }} />}
                              </div>
                              <p className="text-[9px] mt-0.5 line-clamp-1" style={{ color: T.w30 }}>{n.message}</p>
                              <p className="text-[8px] mt-1 tabular-nums" style={{ color: T.w30 }}>
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center">
                        <Check className="w-6 h-6 mx-auto mb-2" style={{ color: T.w30 }} />
                        <p className="text-[9px] font-bold tracking-widest" style={{ color: T.w30 }}>// TUDO EM DIA</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <button
                    onClick={() => { setShowNotifs(false); navigate("/alerts"); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-bold tracking-widest border-t transition-colors"
                    style={{ borderColor: T.border, color: T.sky }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.skyDim)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    VER CENTRAL DE ALERTAS <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-4 mx-0.5" style={{ background: T.border }} />

          {/* ── User menu ── */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setShowUser(p => !p); setShowNotifs(false); }}
              className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded transition-all"
              style={{
                background: showUser ? T.skyDim : "transparent",
                border: `1px solid ${showUser ? T.skyBdr : "transparent"}`,
              }}
              onMouseEnter={e => { if (!showUser) { (e.currentTarget as HTMLElement).style.background = T.w08; (e.currentTarget as HTMLElement).style.borderColor = T.border; } }}
              onMouseLeave={e => { if (!showUser) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; } }}
            >
              {/* Avatar */}
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ background: showUser ? T.sky : "rgba(56,189,248,0.7)", fontFamily: T.mono }}
              >
                {initials}
              </div>
              {/* Name */}
              <div className="hidden md:block text-left min-w-0">
                <p className="text-[10px] font-bold tracking-wider leading-none truncate max-w-[80px]" style={{ color: "rgba(255,255,255,0.9)", fontFamily: T.mono }}>{displayName}</p>
                <p className="text-[8px] font-bold mt-0.5 leading-none tracking-widest" style={{ color: T.w30, fontFamily: T.mono }}>ACTIVO</p>
              </div>
              <ChevronDown
                className="hidden md:block w-3 h-3 shrink-0 transition-transform"
                style={{ color: T.w30, transform: showUser ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {/* User dropdown */}
            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-10 w-56 rounded overflow-hidden shadow-2xl z-50"
                  style={{ background: T.card, border: `1px solid rgba(56,189,248,0.2)`, fontFamily: T.mono }}
                >
                  {/* User hero */}
                  <div className="px-4 py-3.5 border-b relative overflow-hidden" style={{ borderColor: T.border }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at left, rgba(56,189,248,0.04), transparent 60%)" }} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-9 h-9 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: T.sky, fontFamily: T.mono }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-wider truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{displayName}</p>
                        <p className="text-[9px] truncate mt-0.5" style={{ color: T.w30 }}>{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                          <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                          SESSÃO ACTIVA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nav */}
                  <div className="p-1.5 space-y-px">
                    {[
                      { label: "VER PERFIL",    icon: UserCircle, path: "/settings"     },
                      { label: "CONFIGURAÇÕES", icon: Settings,   path: "/settings"     },
                      { label: "SUBSCRIÇÃO",    icon: CreditCard, path: "/subscription" },
                    ].map(({ label, icon: Icon, path }) => (
                      <button
                        key={label}
                        onClick={() => { setShowUser(false); navigate(path); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left group transition-all"
                        style={{ color: T.w60 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = "white"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.w60; }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold tracking-wider">{label}</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-30 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  <div className="mx-3 h-px my-1" style={{ background: T.border }} />

                  <div className="p-1.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all"
                      style={{ color: T.red }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.redDim)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-bold tracking-wider">TERMINAR SESSÃO</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4"
            style={{ background: "rgba(2,4,10,0.92)", backdropFilter: "blur(12px)" }}
            onClick={() => { setSearchOpen(false); setSearchVal(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xl rounded overflow-hidden shadow-2xl"
              style={{ background: T.card, border: `1px solid rgba(220,38,38,0.25)`, fontFamily: T.mono }}
              onClick={e => e.stopPropagation()}
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: T.border }}>
                <Terminal className="w-3.5 h-3.5 shrink-0" style={{ color: T.red }} />
                <input
                  ref={searchRef}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchVal.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
                      setSearchOpen(false); setSearchVal("");
                    }
                  }}
                  placeholder="PESQUISAR BLOCOS, OPERADORES, ANÁLISES…"
                  style={{ ...inpCls, caretColor: T.red }}
                />
                {searchVal && (
                  <button onClick={() => setSearchVal("")} style={{ color: T.w30 }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => { setSearchOpen(false); setSearchVal(""); }}
                  className="w-7 h-7 rounded flex items-center justify-center transition-all"
                  style={{ background: T.w08, color: T.w30 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.w08; (e.currentTarget as HTMLElement).style.color = T.w30; }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Results */}
              <div className="p-2">
                <p className="text-[8px] font-bold tracking-[0.25em] px-3 py-2" style={{ color: T.w30 }}>
                  {searchVal ? `RESULTADOS PARA "${searchVal}"` : "// SUGESTÕES RÁPIDAS"}
                </p>
                <div className="space-y-px">
                  {filtered.length > 0 ? (
                    filtered.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { navigate(s.path); setSearchOpen(false); setSearchVal(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-left group"
                        style={{ color: T.w60 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = "white"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.w60; }}
                      >
                        <span className="text-[8px] font-bold w-8 shrink-0 tabular-nums" style={{ color: T.red }}>{s.sig}</span>
                        <span className="text-[11px] font-bold tracking-wider flex-1">{s.label}</span>
                        <span
                          className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded shrink-0 opacity-50 group-hover:opacity-90 transition-opacity"
                          style={{ background: T.redDim, color: T.red, border: `1px solid ${T.redBdr}` }}
                        >
                          {s.tag}
                        </span>
                        <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 transition-opacity" />
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-[10px] font-bold tracking-wider" style={{ color: T.w30 }}>
                        // SEM RESULTADOS PARA <span style={{ color: "white" }}>"{searchVal}"</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer hints */}
              <div className="px-4 py-2 border-t flex items-center gap-5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.01)" }}>
                {[["ENTER", "PESQUISAR"], ["ESC", "FECHAR"], ["↑↓", "NAVEGAR"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: T.w08, color: T.w30, fontFamily: T.mono }}>
                      {key}
                    </kbd>
                    <span className="text-[8px] font-bold tracking-wider" style={{ color: T.w30 }}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Icon button helper ─────────────────────────────────────────────────── */
const IconBtn = ({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded flex items-center justify-center transition-all"
    style={{ color: "rgba(255,255,255,0.3)" }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}
  >
    {children}
  </button>
);