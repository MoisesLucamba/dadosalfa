import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, ChevronDown, LogOut, Sun, Moon,
  Settings, UserCircle, X, Check, AlertTriangle,
  Info, CreditCard, ChevronRight, Radio, HelpCircle,
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

/* ─── Severity map ───────────────────────────────────────────────────────── */
const SEV: Record<string, { color: string; bg: string; icon: any }> = {
  alert:   { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", icon: AlertTriangle },
  warning: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: AlertTriangle },
  info:    { color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", icon: Info },
  success: { color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)", icon: Check },
};

/* ─── Quick suggestions ──────────────────────────────────────────────────── */
const QUICK: Array<{ label: string; path: string; tag: string }> = [
  { label: "Bloco 17 — TotalEnergies", path: "/production", tag: "Produção" },
  { label: "Preço Brent Hoje",         path: "/prices",     tag: "Preços" },
  { label: "Exportações Dezembro",     path: "/exports",    tag: "Exportações" },
  { label: "Risco Geopolítico Angola", path: "/risk",       tag: "Risco" },
  { label: "Relatório Mensal",         path: "/reports",    tag: "Relatórios" },
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

  const displayName = user?.email?.split("@")[0] || "Operador";
  const initials    = displayName.substring(0, 2).toUpperCase();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setShowUser(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

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
    toast.success("Sessão terminada");
    navigate("/auth");
  };

  const filtered = QUICK.filter(s =>
    !searchVal || s.label.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <>
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-30 bg-background border-b border-border"
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MobileNav activeItem={activeItem} />

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative hidden sm:flex items-center gap-2.5 h-8 px-3 rounded text-left flex-1 max-w-xs transition-all bg-muted/50 border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs flex-1 truncate">Pesquisar blocos, operadores…</span>
            <kbd className="hidden md:flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Search — mobile */}
          <button
            className="sm:hidden w-8 h-8 rounded flex items-center justify-center bg-muted/50 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1 md:gap-1.5 ml-2">
          <div className="hidden lg:block mr-1">
            <DataSyncButton variant="compact" />
          </div>

          {/* LIVE pill */}
          <div className="hidden md:flex items-center gap-1.5 h-6 px-2.5 rounded mr-1.5 bg-success/10 border border-success/20">
            <Radio className="w-2.5 h-2.5 animate-pulse text-success" />
            <span className="text-[9px] font-semibold tracking-wider text-success">LIVE</span>
          </div>

          {onHelpClick && (
            <IconBtn onClick={onHelpClick} title="Tour guiado">
              <HelpCircle className="w-4 h-4" />
            </IconBtn>
          )}

          <IconBtn onClick={toggleTheme} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
            <motion.div animate={{ rotate: theme === "dark" ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </IconBtn>

          {/* Notifications */}
          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => { setShowNotifs(p => !p); setShowUser(false); }}
              className={`relative w-8 h-8 rounded flex items-center justify-center transition-all ${showNotifs ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'}`}
            >
              <Bell className="w-4 h-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-destructive"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-10 w-80 rounded-lg overflow-hidden shadow-2xl z-50 bg-card border border-border"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => notifications?.filter(n => !n.is_read).forEach(n => markRead.mutate(n.id))}
                        className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 7).map(n => {
                        const sev = SEV[n.type || "info"] || SEV.info;
                        const SIcon = sev.icon;
                        return (
                          <div
                            key={n.id}
                            className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/50"
                            onClick={() => { markRead.mutate(n.id); setShowNotifs(false); navigate("/alerts"); }}
                          >
                            {!n.is_read && (
                              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r" style={{ background: sev.color }} />
                            )}
                            <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: sev.bg }}>
                              <SIcon className="w-3.5 h-3.5" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-foreground line-clamp-1">{n.title}</p>
                                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev.color }} />}
                              </div>
                              <p className="text-[11px] mt-0.5 text-muted-foreground line-clamp-1">{n.message}</p>
                              <p className="text-[10px] mt-1 text-muted-foreground/60">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center">
                        <Check className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Tudo em dia</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setShowNotifs(false); navigate("/alerts"); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-t border-border text-primary hover:bg-primary/5 transition-colors"
                  >
                    Ver central de alertas <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:block w-px h-5 mx-1 bg-border" />

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setShowUser(p => !p); setShowNotifs(false); }}
              className={`flex items-center gap-2 h-8 pl-1 pr-2.5 rounded transition-all border ${showUser ? 'bg-primary/10 border-primary/20' : 'border-transparent hover:bg-muted hover:border-border'}`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-xs font-medium text-foreground leading-none truncate max-w-[100px]">{displayName}</p>
                <p className="text-[10px] mt-0.5 leading-none text-muted-foreground">Activo</p>
              </div>
              <ChevronDown className={`hidden md:block w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${showUser ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-10 w-56 rounded-lg overflow-hidden shadow-2xl z-50 bg-card border border-border"
                >
                  <div className="px-4 py-3.5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                          <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                          Sessão activa
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {[
                      { label: "Ver Perfil",    icon: UserCircle, path: "/settings" },
                      { label: "Configurações", icon: Settings,   path: "/settings" },
                      { label: "Subscrição",    icon: CreditCard, path: "/subscription" },
                    ].map(({ label, icon: Icon, path }) => (
                      <button
                        key={label}
                        onClick={() => { setShowUser(false); navigate(path); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{label}</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  <div className="mx-3 h-px bg-border" />

                  <div className="p-1.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-medium">Terminar sessão</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-background/80 backdrop-blur-md"
            onClick={() => { setSearchOpen(false); setSearchVal(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xl rounded-lg overflow-hidden shadow-2xl bg-card border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 shrink-0 text-primary" />
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
                  placeholder="Pesquisar blocos, operadores, análises…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchVal && (
                  <button onClick={() => setSearchVal("")} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { setSearchOpen(false); setSearchVal(""); }}
                  className="w-7 h-7 rounded flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2">
                <p className="text-[10px] font-medium text-muted-foreground px-3 py-2">
                  {searchVal ? `Resultados para "${searchVal}"` : "Sugestões rápidas"}
                </p>
                <div className="space-y-0.5">
                  {filtered.length > 0 ? (
                    filtered.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { navigate(s.path); setSearchOpen(false); setSearchVal(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-left text-muted-foreground hover:bg-muted hover:text-foreground group"
                      >
                        <span className="text-xs font-medium flex-1">{s.label}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 opacity-60 group-hover:opacity-100 transition-opacity">
                          {s.tag}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs text-muted-foreground">
                        Sem resultados para <span className="text-foreground font-medium">"{searchVal}"</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-2 border-t border-border flex items-center gap-5 bg-muted/30">
                {[["Enter", "Pesquisar"], ["Esc", "Fechar"], ["↑↓", "Navegar"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{key}</kbd>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
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

const IconBtn = ({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded flex items-center justify-center transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
  >
    {children}
  </button>
);
