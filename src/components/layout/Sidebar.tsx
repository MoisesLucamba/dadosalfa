import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, DollarSign, Ship,
  Brain, AlertTriangle, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, CreditCard,
  Shield, Building2, Users2, HelpCircle, Zap, Activity,
  Search, Terminal, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface NavItem {
  icon: React.ElementType;
  label: string;
  sig: string;
  href: string;
  badge?: string;
  adminOnly?: boolean;
}
interface SidebarProps {
  activeItem?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

/* ─── Nav config ─────────────────────────────────────────────────────────── */
const navGroups = [
  {
    key: "analytics",
    label: "ANALYTICS",
    groupSig: "ANL",
    items: [
      { icon: LayoutDashboard, label: "DASHBOARD",        sig: "DSH", href: "/" },
      { icon: BarChart3,       label: "PRODUÇÃO",         sig: "PRD", href: "/production" },
      { icon: DollarSign,      label: "PREÇOS & MERCADO", sig: "MKT", href: "/prices" },
    ],
  },
  {
    key: "intelligence",
    label: "INTELIGÊNCIA",
    groupSig: "INT",
    items: [
      { icon: Brain,           label: "PREVISÕES IA",         sig: "AIP", href: "/predictions",     badge: "AI"  },
      { icon: AlertTriangle,   label: "RISCO",                sig: "RSK", href: "/risk"                          },
      { icon: Building2,       label: "COMPETIDORES",         sig: "CMP", href: "/competitors"                   },
      { icon: Zap,             label: "VISÃO COMPUTACIONAL",  sig: "VIZ", href: "/well-simulation", badge: "AI"  },
    ],
  },
  {
    key: "data",
    label: "DADOS",
    groupSig: "DAT",
    items: [
      { icon: Ship,     label: "EXPORTAÇÕES", sig: "EXP", href: "/exports"  },
      { icon: Search,   label: "PESQUISA",    sig: "SRH", href: "/search"   },
      { icon: FileText, label: "RELATÓRIOS",  sig: "REP", href: "/reports"  },
      { icon: Shield,   label: "ADMIN",       sig: "ADM", href: "/admin",   badge: "ADM", adminOnly: true },
    ],
  },
];

const bottomNavItems = [
  { icon: Users2,     label: "WORKSPACES",    sig: "WRK", href: "/workspace"   },
  { icon: Bell,       label: "ALERTAS",       sig: "ALR", href: "/alerts",       badge: "3" },
  { icon: CreditCard, label: "SUBSCRIÇÃO",    sig: "SUB", href: "/subscription" },
  { icon: Settings,   label: "CONFIGURAÇÕES", sig: "CFG", href: "/settings"     },
];

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  bg:         "#04080f",
  bgHover:    "#070d1a",
  bgActive:   "#0b1422",
  border:     "rgba(20,40,70,0.6)",
  borderRed:  "rgba(220,38,38,0.3)",
  red:        "#ef4444",
  redDim:     "#dc2626",
  textMuted:  "#2a4560",
  textMid:    "#4a72a0",
  textBright: "#c0d8f0",
  mono:       "'IBM Plex Mono', monospace",
};

/* ─── NavItem ────────────────────────────────────────────────────────────── */
const NavItemComp = ({
  item, isActive, isCollapsed, delay, onMobileClick,
}: {
  item: NavItem; isActive: boolean; isCollapsed: boolean; delay: number; onMobileClick?: () => void;
}) => {
  const Icon = item.icon;
  return (
    <motion.a
      href={item.href}
      onClick={onMobileClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2, ease: "easeOut" }}
      className="relative flex items-center gap-2.5 rounded overflow-hidden group cursor-pointer"
      style={{
        padding: isCollapsed ? "9px 12px" : "8px 10px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        background: isActive ? C.bgActive : "transparent",
        border: `1px solid ${isActive ? C.borderRed : "transparent"}`,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = C.bgHover;
          (e.currentTarget as HTMLElement).style.borderColor = C.border;
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor = "transparent";
        }
      }}
    >
      {/* Active left bar */}
      {isActive && (
        <motion.span
          layoutId="active-bar"
          className="absolute left-0 top-[15%] bottom-[15%] w-[2px] rounded-r-sm"
          style={{
            background: `linear-gradient(180deg, ${C.red} 0%, ${C.redDim} 100%)`,
            boxShadow: `0 0 10px 1px rgba(239,68,68,0.5)`,
          }}
        />
      )}

      {/* Radial glow */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 100% at 0% 50%, rgba(220,38,38,0.06) 0%, transparent 70%)",
        }} />
      )}

      {/* SIG badge (replaces generic icon for collapsed) */}
      {isCollapsed ? (
        <div
          className="w-6 h-6 flex items-center justify-center rounded text-[8px] font-bold tracking-wider flex-shrink-0"
          style={{
            background: isActive ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)",
            color: isActive ? C.red : C.textMuted,
            border: `1px solid ${isActive ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.06)"}`,
            fontFamily: C.mono,
          }}
        >
          {item.sig}
        </div>
      ) : (
        <Icon
          className="flex-shrink-0 transition-all duration-200"
          style={{
            width: 13, height: 13,
            color: isActive ? C.red : C.textMuted,
            filter: isActive ? `drop-shadow(0 0 4px rgba(239,68,68,0.5))` : "none",
          }}
        />
      )}

      {/* Label + sig + badge */}
      {!isCollapsed && (
        <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* SIG code */}
            <span
              className="text-[8px] font-bold tracking-wider flex-shrink-0"
              style={{
                fontFamily: C.mono,
                color: isActive ? "rgba(239,68,68,0.7)" : C.textMuted,
              }}
            >
              {item.sig}
            </span>
            <span
              className="text-[11px] font-bold tracking-wider truncate"
              style={{
                fontFamily: C.mono,
                color: isActive ? C.textBright : C.textMid,
                transition: "color 0.15s",
              }}
            >
              {item.label}
            </span>
          </div>

          {item.badge && (
            <span style={{
              fontFamily: C.mono, fontSize: 7, fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "2px 6px",
              borderRadius: 2,
              flexShrink: 0,
              background: item.badge === "AI"
                ? "rgba(220,38,38,0.12)"
                : item.badge === "ADM"
                ? "rgba(30,58,95,0.45)"
                : C.redDim,
              color: item.badge === "AI" ? C.red
                : item.badge === "ADM" ? "#60a5fa"
                : "white",
              border: `1px solid ${item.badge === "AI" ? "rgba(220,38,38,0.25)"
                : item.badge === "ADM" ? "rgba(30,58,95,0.6)"
                : "transparent"}`,
            }}>
              {item.badge}
            </span>
          )}
        </div>
      )}

      {/* Collapsed tooltip */}
      {isCollapsed && (
        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-150" style={{
          background: "#060e1c",
          border: `1px solid ${C.border}`,
          fontFamily: C.mono, fontSize: 10, fontWeight: 700,
          color: C.textBright, letterSpacing: "0.1em",
          boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
        }}>
          <span style={{ color: C.textMuted, marginRight: 6 }}>{item.sig}</span>
          {item.label}
        </div>
      )}
    </motion.a>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export function Sidebar({
  activeItem = "/",
  isMobileOpen: extOpen,
  setIsMobileOpen: extSetOpen,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  const mobileOpen    = extOpen    ?? internalOpen;
  const setMobileOpen = extSetOpen ?? setInternalOpen;

  let idx = 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        .alpha-sidebar .nav-scroll::-webkit-scrollbar { width: 2px; }
        .alpha-sidebar .nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .alpha-sidebar .nav-scroll::-webkit-scrollbar-thumb { background: rgba(30,58,95,0.5); border-radius: 99px; }

        /* Scanlines */
        .alpha-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.008) 0px,
            transparent 1px,
            transparent 3px
          );
          z-index: 0;
        }

        @keyframes alpha-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink { animation: alpha-blink 1.1s step-start infinite; }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(239,68,68,0.55); }
          50%       { box-shadow: 0 0 10px 3px rgba(239,68,68,0.25); }
        }
        .pulse-red { animation: pulse-dot 2.2s ease-in-out infinite; }

        @keyframes sweep {
          0%   { opacity: 0.5; transform: rotate(0deg); }
          100% { opacity: 0.5; transform: rotate(360deg); }
        }
      `}</style>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(4,8,15,0.9)", backdropFilter: "blur(8px)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar shell */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "alpha-sidebar relative h-screen flex flex-col z-50 overflow-hidden",
          "hidden lg:flex",
          "fixed lg:relative inset-y-0 left-0",
          mobileOpen ? "flex" : "hidden lg:flex",
        )}
        style={{
          width: collapsed ? 64 : 248,
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          background: `linear-gradient(175deg, #050c18 0%, #04080f 55%, #060309 100%)`,
          borderRight: `1px solid ${C.border}`,
          fontFamily: C.mono,
        }}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] z-20" style={{
          background: `linear-gradient(90deg, transparent 0%, ${C.redDim} 30%, rgba(30,58,95,0.6) 60%, transparent 100%)`,
        }} />

        {/* Corner vignettes */}
        <div className="absolute top-0 left-0 w-28 h-28 pointer-events-none z-0" style={{
          background: "radial-gradient(circle at 0% 0%, rgba(220,38,38,0.05) 0%, transparent 70%)",
        }} />
        <div className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none z-0" style={{
          background: "radial-gradient(circle at 100% 100%, rgba(30,58,95,0.08) 0%, transparent 70%)",
        }} />

        {/* ── Logotype ─────────────────────────────── */}
        <div className="relative z-10 px-3 pt-4 pb-3 flex-shrink-0">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>

            {/* Icon box */}
            <div className="relative flex-shrink-0 w-9 h-9 rounded flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #0d1b30 0%, #150a0a 100%)",
              border: `1px solid rgba(220,38,38,0.28)`,
              boxShadow: `0 0 14px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <Activity className="w-4 h-4 pulse-red" style={{ color: C.red }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 pulse-red" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col"
                >
                  <div className="flex items-baseline gap-0.5">
                    <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", color: C.textBright }}>
                      ALPHA
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", color: C.red }}>
                      DAT
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", color: C.textMuted }}>
                      -OS
                    </span>
                    <span className="cursor-blink" style={{ fontFamily: C.mono, fontSize: 13, color: C.red, marginLeft: 2 }}>_</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 500, letterSpacing: "0.3em", color: C.textMuted, textTransform: "uppercase" }}>
                      PETROLEUM INTELLIGENCE
                    </span>
                    <span className="w-1 h-1 rounded-full bg-green-500" style={{ boxShadow: "0 0 5px rgba(34,197,94,0.7)", flexShrink: 0 }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="mt-3 h-px" style={{
            background: `linear-gradient(90deg, rgba(220,38,38,0.3) 0%, rgba(30,58,95,0.2) 50%, transparent 100%)`,
          }} />
        </div>

        {/* ── Nav groups ───────────────────────────── */}
        <nav className="nav-scroll relative z-10 flex-1 px-2 py-1 overflow-y-auto space-y-3">
          {navGroups.map((group) => {
            const visible = group.items.filter(i => !("adminOnly" in i && i.adminOnly && !isAdmin));
            if (!visible.length) return null;
            return (
              <div key={group.key}>
                {/* Group header */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-1.5 mb-1"
                    >
                      <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, letterSpacing: "0.25em", color: C.textMuted }}>
                        {group.label}
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, opacity: 0.5 }}>
                        //{group.groupSig}
                      </span>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.border} 0%, transparent 100%)` }} />
                    </motion.div>
                  )}
                  {collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex justify-center mb-1"
                    >
                      <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${C.border}, transparent)` }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-px">
                  {visible.map((item) => (
                    <NavItemComp
                      key={item.href}
                      item={item as NavItem}
                      isActive={activeItem === item.href}
                      isCollapsed={collapsed}
                      delay={(idx++) * 0.03}
                      onMobileClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Bottom system nav ────────────────────── */}
        <div className="relative z-10 flex-shrink-0 px-2 pt-2 pb-3 space-y-px" style={{
          borderTop: `1px solid ${C.border}`,
          background: "rgba(4,8,15,0.7)",
        }}>
          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-1.5 mb-1.5 flex items-center gap-2"
              >
                <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, letterSpacing: "0.25em", color: C.textMuted }}>
                  SISTEMA
                </span>
                <span style={{ fontFamily: C.mono, fontSize: 7, color: C.textMuted, opacity: 0.5 }}>//SYS</span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.border} 0%, transparent 100%)` }} />
              </motion.div>
            )}
          </AnimatePresence>

          {bottomNavItems.map((item) => {
            const isActive = activeItem === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="relative flex items-center gap-2.5 rounded overflow-hidden group"
                style={{
                  padding: collapsed ? "9px 12px" : "7px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: isActive ? C.bgActive : "transparent",
                  border: `1px solid ${isActive ? C.borderRed : "transparent"}`,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = C.bgHover;
                    (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }
                }}
              >
                {isActive && (
                  <motion.span layoutId="active-bar-bottom"
                    className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-sm"
                    style={{ background: `linear-gradient(180deg, ${C.red} 0%, ${C.redDim} 100%)`, boxShadow: `0 0 7px rgba(239,68,68,0.45)` }}
                  />
                )}

                {/* SIG badge in collapsed, icon in expanded */}
                {collapsed ? (
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded text-[8px] font-bold flex-shrink-0"
                    style={{
                      background: isActive ? "rgba(220,38,38,0.12)" : "rgba(255,255,255,0.04)",
                      color: isActive ? C.red : C.textMuted,
                      border: `1px solid ${isActive ? "rgba(220,38,38,0.2)" : "rgba(255,255,255,0.06)"}`,
                      fontFamily: C.mono,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.sig}
                  </div>
                ) : (
                  <Icon style={{ width: 13, height: 13, flexShrink: 0, color: isActive ? C.red : C.textMuted, transition: "color 0.15s", filter: isActive ? `drop-shadow(0 0 3px rgba(239,68,68,0.4))` : "none" }} />
                )}

                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: isActive ? "rgba(239,68,68,0.6)" : C.textMuted }}>
                        {item.sig}
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: isActive ? C.textBright : C.textMid }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: C.redDim, color: "white" }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all" style={{
                    background: "#060e1c", border: `1px solid ${C.border}`,
                    fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.textBright,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: "0.08em",
                  }}>
                    <span style={{ color: C.textMuted, marginRight: 6 }}>{item.sig}</span>
                    {item.label}
                  </div>
                )}
              </a>
            );
          })}

          {/* Support card */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="relative overflow-hidden rounded mt-2 p-3"
                style={{
                  background: "linear-gradient(135deg, #080e1d 0%, #0c0608 100%)",
                  border: `1px solid ${C.border}`,
                }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" style={{
                  background: "radial-gradient(circle at top right, rgba(220,38,38,0.1) 0%, transparent 70%)",
                }} />

                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{
                    background: "rgba(220,38,38,0.1)",
                    border: `1px solid rgba(220,38,38,0.25)`,
                  }}>
                    <Terminal style={{ width: 11, height: 11, color: C.red }} />
                  </div>
                  <div>
                    <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: C.textBright }}>
                      SUPORTE 24/7
                    </span>
                  </div>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 5px rgba(34,197,94,0.7)" }} />
                </div>

                <p style={{ fontFamily: C.mono, fontSize: 9, color: C.textMuted, lineHeight: 1.6, marginBottom: 8 }}>
                  EQUIPE DISPONÍVEL<br />PARA AUXILIAR
                </p>

                <button className="w-full py-1.5 rounded transition-all duration-150" style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  fontFamily: C.mono,
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: C.textMuted,
                  textTransform: "uppercase",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(220,38,38,0.3)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border}
                >
                  CENTRAL DE AJUDA
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 w-full mt-1 rounded transition-all duration-150 group"
            style={{
              padding: collapsed ? "8px 12px" : "7px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              border: "1px solid transparent",
              color: C.textMuted,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.bgHover;
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.color = C.textMid;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = C.textMuted;
            }}
          >
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div key="r" initial={{ rotate: -180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 180, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <ChevronRight style={{ width: 13, height: 13 }} />
                </motion.div>
              ) : (
                <motion.div key="l" initial={{ rotate: 180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -180, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <ChevronLeft style={{ width: 13, height: 13 }} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  style={{ fontFamily: C.mono, fontSize: 7, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "inherit" }}
                >
                  RECOLHER MENU
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}