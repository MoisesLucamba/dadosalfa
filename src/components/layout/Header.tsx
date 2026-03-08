import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, ChevronDown, LogOut, Sun, Moon,
  Settings, UserCircle, X, Check, AlertTriangle,
  Info, CreditCard, ChevronRight, Radio, HelpCircle
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

/* ─────────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────────── */
const BG_NAVY  = "#080D1A";
const BG_CARD  = "#0D1526";
const BG_HOVER = "#111E33";
const RED      = "#E8192C";
const RED_DIM  = "rgba(232,25,44,0.12)";
const RED_BDR  = "rgba(232,25,44,0.30)";
const BLUE     = "#1A5CFF";
const BLUE_MID = "#3B7BFF";
const BLUE_DIM = "rgba(26,92,255,0.15)";
const BLUE_BDR = "rgba(59,123,255,0.30)";
const WHITE    = "#FFFFFF";
const W60      = "rgba(255,255,255,0.60)";
const W30      = "rgba(255,255,255,0.30)";
const W10      = "rgba(255,255,255,0.08)";
const BORDER   = "rgba(255,255,255,0.07)";

/* ─── Severity map ───────────────────────────────── */
const SEV: Record<string, { color: string; bg: string; icon: any }> = {
  alert:   { color: RED,       bg: RED_DIM,                       icon: AlertTriangle },
  warning: { color: "#FF6B1A", bg: "rgba(255,107,26,0.12)",       icon: AlertTriangle },
  info:    { color: BLUE_MID,  bg: BLUE_DIM,                      icon: Info          },
  success: { color: "#4ade80", bg: "rgba(74,222,128,0.12)",       icon: Check         },
};

/* ─── Quick search suggestions ───────────────────── */
const QUICK_SUGGESTIONS = [
  { label: "Bloco 17 — TotalEnergies",  path: "/production", tag: "Produção"   },
  { label: "Preço Brent hoje",           path: "/prices",     tag: "Preços"     },
  { label: "Exportações Dezembro",       path: "/exports",    tag: "Exportações"},
  { label: "Risco geopolítico Angola",   path: "/risk",       tag: "Risco"      },
  { label: "Relatório mensal",           path: "/reports",    tag: "Relatórios" },
];

interface HeaderProps { activeItem?: string; onHelpClick?: () => void; }

export function Header({ activeItem = "/" }: HeaderProps) {
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

  const displayName = user?.email?.split("@")[0] || "Utilizador";
  const initials    = displayName.substring(0, 2).toUpperCase();

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setShowUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Keyboard shortcut ⌘K / Ctrl+K ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchVal("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Focus search input on open ── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSignOut = async () => {
    setShowUser(false);
    await signOut();
    toast.success("Sessão terminada com sucesso");
    navigate("/auth");
  };

  const filtered = QUICK_SUGGESTIONS.filter(s =>
    !searchVal || s.label.toLowerCase().includes(searchVal.toLowerCase())
  );

  /* ── Shared hover helpers (avoids inline repetition) ── */
  const hoverBlue = (el: HTMLElement) => {
    el.style.background = BLUE_DIM;
    el.style.color = BLUE_MID;
    el.style.borderColor = BLUE_BDR;
  };
  const hoverReset = (el: HTMLElement, bg = "transparent", color = W30) => {
    el.style.background = bg;
    el.style.color = color;
    el.style.borderColor = "transparent";
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-30"
        style={{
          background: BG_NAVY,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {/* ── LEFT ── */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MobileNav activeItem={activeItem} />

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative hidden sm:flex items-center gap-2.5 h-9 px-3.5 rounded-xl transition-all flex-1 max-w-xs text-left"
            style={{ background: W10, border: `1px solid ${BORDER}`, color: W30 }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = BLUE_BDR;
              el.style.color = W60;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = BORDER;
              el.style.color = W30;
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium flex-1 truncate">Pesquisar blocos, operadores…</span>
            <kbd
              className="hidden md:flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: W10, color: W30 }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Search icon — mobile */}
          <button
            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: W10, color: W60 }}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-1 md:gap-1.5 ml-2">

          {/* Data sync */}
          <div className="hidden lg:block mr-1">
            <DataSyncButton variant="compact" />
          </div>

          {/* LIVE pill */}
          <div
            className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-full mr-1"
            style={{ background: RED_DIM, border: `1px solid ${RED_BDR}` }}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse" style={{ color: RED }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: RED }}>Live</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: W30 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.color = WHITE; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = W30; }}
          >
            <motion.div animate={{ rotate: theme === "dark" ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </button>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => { setShowNotifs(p => !p); setShowUser(false); }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: showNotifs ? RED_DIM : "transparent",
                color: showNotifs ? RED : W30,
                border: `1px solid ${showNotifs ? RED_BDR : "transparent"}`,
              }}
              onMouseEnter={e => {
                if (!showNotifs) { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.color = WHITE; }
              }}
              onMouseLeave={e => {
                if (!showNotifs) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = W30; }
              }}
            >
              <Bell className="w-4 h-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: RED }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notifications dropdown */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-11 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                >
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5" style={{ color: RED }} />
                      <span className="font-black text-white text-[13px]">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: RED_DIM, color: RED }}>
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                        className="text-[9px] font-black uppercase tracking-widest transition-colors"
                        style={{ color: W30 }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = BLUE_MID)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = W30)}
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  {/* list */}
                  <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 7).map(n => {
                        const sev = SEV[n.type] || SEV.info;
                        const SIcon = sev.icon;
                        return (
                          <div
                            key={n.id}
                            className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                            style={{ borderBottom: `1px solid ${BORDER}` }}
                            onClick={() => { markRead.mutate(n.id); setShowNotifs(false); navigate("/alerts"); }}
                            onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            {/* unread stripe */}
                            {!n.is_read && (
                              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                                style={{ background: sev.color }} />
                            )}
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: sev.bg }}>
                              <SIcon className="w-3.5 h-3.5" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-bold text-white line-clamp-1">{n.title}</p>
                                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev.color }} />}
                              </div>
                              <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: W30 }}>{n.message}</p>
                              <p className="text-[9px] mt-1 font-medium" style={{ color: W30 }}>
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: W10 }}>
                          <Check className="w-5 h-5" style={{ color: W30 }} />
                        </div>
                        <p className="text-xs font-medium" style={{ color: W30 }}>Tudo em dia</p>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <button
                    onClick={() => { setShowNotifs(false); navigate("/alerts"); }}
                    className="w-full flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t"
                    style={{ borderColor: BORDER, color: BLUE_MID }}
                    onMouseEnter={e => (e.currentTarget.style.background = BLUE_DIM)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    Ver central de alertas <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Divider ── */}
          <div className="hidden md:block w-px h-5 mx-0.5" style={{ background: BORDER }} />

          {/* ── User menu ── */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setShowUser(p => !p); setShowNotifs(false); }}
              className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-xl transition-all"
              style={{
                background: showUser ? BLUE_DIM : "transparent",
                border: `1px solid ${showUser ? BLUE_BDR : "transparent"}`,
              }}
              onMouseEnter={e => {
                if (!showUser) { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }
              }}
              onMouseLeave={e => {
                if (!showUser) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }
              }}
            >
              {/* avatar */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0"
                style={{ background: showUser ? BLUE : `${BLUE}CC` }}
              >
                {initials}
              </div>
              {/* name */}
              <div className="hidden md:block text-left min-w-0">
                <p className="text-[12px] font-black text-white leading-none truncate max-w-[90px]">{displayName}</p>
                <p className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: W30 }}>Conta Ativa</p>
              </div>
              <ChevronDown
                className="hidden md:block w-3 h-3 transition-transform shrink-0"
                style={{ color: W30, transform: showUser ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {/* User dropdown */}
            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-11 w-60 rounded-2xl overflow-hidden shadow-2xl z-50"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                >
                  {/* user hero */}
                  <div className="px-4 py-4 border-b relative overflow-hidden" style={{ borderColor: BORDER }}>
                    <div className="absolute inset-0 opacity-[0.04]"
                      style={{ background: `radial-gradient(ellipse at left, ${BLUE}, transparent 60%)` }} />
                    <div className="relative flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: BLUE }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{displayName}</p>
                        <p className="text-[10px] truncate" style={{ color: W30 }}>{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80" }}>
                          <span className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse" />
                          Ativa
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* nav items */}
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { label: "Ver Perfil",    icon: UserCircle, path: "/settings"     },
                      { label: "Configurações", icon: Settings,   path: "/settings"     },
                      { label: "Subscrição",    icon: CreditCard, path: "/subscription" },
                    ].map(({ label, icon: Icon, path }) => (
                      <button
                        key={label}
                        onClick={() => { setShowUser(false); navigate(path); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group"
                        style={{ color: W60 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = WHITE; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = W60; }}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  {/* divider */}
                  <div className="mx-3 h-px my-1" style={{ background: BORDER }} />

                  {/* sign out */}
                  <div className="p-1.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all"
                      style={{ color: RED }}
                      onMouseEnter={e => (e.currentTarget.style.background = RED_DIM)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Terminar Sessão
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════
          SEARCH OVERLAY
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
            style={{ background: "rgba(4,6,13,0.88)", backdropFilter: "blur(10px)" }}
            onClick={() => { setSearchOpen(false); setSearchVal(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: BG_CARD, border: `1px solid ${BLUE_BDR}` }}
              onClick={e => e.stopPropagation()}
            >
              {/* input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: BORDER }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: BLUE_MID }} />
                <input
                  ref={searchRef}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchVal.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
                      setSearchOpen(false);
                      setSearchVal("");
                    }
                  }}
                  placeholder="Pesquisar blocos, operadores, análises…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                />
                {searchVal && (
                  <button onClick={() => setSearchVal("")} style={{ color: W30 }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { setSearchOpen(false); setSearchVal(""); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: W10, color: W30 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = WHITE; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.color = W30; }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* results */}
              <div className="p-2">
                <p className="text-[9px] font-black uppercase tracking-widest px-3 py-2" style={{ color: W30 }}>
                  {searchVal ? `Resultados para "${searchVal}"` : "Sugestões rápidas"}
                </p>
                <div className="space-y-0.5">
                  {filtered.length > 0 ? (
                    filtered.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { navigate(s.path); setSearchOpen(false); setSearchVal(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group"
                        style={{ color: W60 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = WHITE; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = W60; }}
                      >
                        <Search className="w-3.5 h-3.5 shrink-0" style={{ color: W30 }} />
                        <span className="text-[12px] font-medium flex-1">{s.label}</span>
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                          style={{ background: BLUE_DIM, color: BLUE_MID }}
                        >
                          {s.tag}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm font-medium" style={{ color: W30 }}>
                        Sem resultados para <span className="text-white">"{searchVal}"</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* footer hints */}
              <div
                className="px-4 py-2.5 border-t flex items-center gap-4"
                style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}
              >
                {[
                  ["Enter", "Pesquisar"],
                  ["Esc",   "Fechar"],
                  ["↑↓",   "Navegar"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                      style={{ background: W10, color: W30 }}
                    >
                      {key}
                    </kbd>
                    <span className="text-[9px] font-medium" style={{ color: W30 }}>{label}</span>
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