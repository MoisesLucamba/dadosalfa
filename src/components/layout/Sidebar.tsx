import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, DollarSign, Ship,
  Brain, AlertTriangle, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, Search, CreditCard,
  Shield, Building2, Users2, HelpCircle, Zap, Activity,
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";

/* ─── Types ─────────────────────────────────────────── */
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  adminOnly?: boolean;
}
interface SidebarProps {
  activeItem?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

/* ─── Nav config ─────────────────────────────────────── */
const navGroups = [
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/" },
      { icon: BarChart3,       label: "Produção",        href: "/production" },
      { icon: DollarSign,      label: "Preços & Mercado",href: "/prices" },
    ],
  },
  {
    key: "intelligence",
    label: "Inteligência",
    items: [
      { icon: Brain,           label: "Previsões IA",        href: "/predictions", badge: "AI" },
      { icon: AlertTriangle,   label: "Risco",               href: "/risk" },
      { icon: Building2,       label: "Competidores",        href: "/competitors" },
      { icon: Zap,             label: "Visão Computacional", href: "/well-simulation", badge: "AI" },
    ],
  },
  {
    key: "data",
    label: "Dados",
    items: [
      { icon: Ship,     label: "Exportações", href: "/exports" },
      { icon: Search,   label: "Pesquisa",   href: "/search" },
      { icon: FileText, label: "Relatórios", href: "/reports" },
      { icon: Shield,   label: "Admin",      href: "/admin", badge: "ADM", adminOnly: true },
    ],
  },
];

const bottomNavItems = [
  { icon: Users2,    label: "Workspaces",   href: "/workspace" },
  { icon: Bell,      label: "Alertas",      href: "/alerts",       badge: "3" },
  { icon: CreditCard,label: "Subscrição",   href: "/subscription" },
  { icon: Settings,  label: "Configurações",href: "/settings" },
];

/* ─── Constants ──────────────────────────────────────── */
const C = {
  bg:         "#04080f",
  bgHover:    "#080e1a",
  bgActive:   "#0b1525",
  border:     "rgba(20,40,70,0.7)",
  borderRed:  "rgba(220,38,38,0.35)",
  red:        "#ef4444",
  redDim:     "#dc2626",
  blue:       "#1e3a5f",
  textMuted:  "#2d4d70",
  textMid:    "#4d7aa0",
  textBright: "#c8dff0",
  mono:       "'IBM Plex Mono', monospace",
  sans:       "'Outfit', sans-serif",
};

/* ─── NavItem ────────────────────────────────────────── */
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22, ease: "easeOut" }}
      className="relative flex items-center gap-3 rounded-lg overflow-hidden group cursor-pointer"
      style={{
        padding: isCollapsed ? "10px 12px" : "9px 12px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        background: isActive ? C.bgActive : "transparent",
        border: `1px solid ${isActive ? C.borderRed : "transparent"}`,
        transition: "all 0.18s ease",
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
            boxShadow: `0 0 10px 1px rgba(239,68,68,0.55)`,
          }}
        />
      )}

      {/* Radial glow */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 100% at 0% 50%, rgba(220,38,38,0.07) 0%, transparent 70%)",
        }} />
      )}

      {/* Icon */}
      <Icon
        className="flex-shrink-0 transition-all duration-200"
        style={{
          width: 15, height: 15,
          color: isActive ? C.red : C.textMuted,
          filter: isActive ? `drop-shadow(0 0 5px rgba(239,68,68,0.5))` : "none",
        }}
      />

      {/* Label */}
      {!isCollapsed && (
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <span style={{
            fontFamily: C.sans, fontSize: 12.5, fontWeight: 600,
            color: isActive ? C.textBright : C.textMid,
            transition: "color 0.15s",
            whiteSpace: "nowrap",
          }}>
            {item.label}
          </span>

          {item.badge && (
            <span style={{
              fontFamily: C.mono, fontSize: 8, fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "2px 7px",
              borderRadius: 4,
              background: item.badge === "AI"
                ? "rgba(220,38,38,0.15)"
                : item.badge === "ADM"
                ? "rgba(30,58,95,0.5)"
                : C.redDim,
              color: item.badge === "AI" ? C.red
                : item.badge === "ADM" ? "#60a5fa"
                : "white",
              border: `1px solid ${item.badge === "AI" ? "rgba(220,38,38,0.3)"
                : item.badge === "ADM" ? "rgba(30,58,95,0.7)"
                : "transparent"}`,
            }}>
              {item.badge}
            </span>
          )}
        </div>
      )}

      {/* Collapsed tooltip */}
      {isCollapsed && (
        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-150" style={{
          background: "#0a1628",
          border: `1px solid ${C.border}`,
          fontFamily: C.sans, fontSize: 11.5, fontWeight: 600,
          color: C.textBright,
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}>
          {item.label}
        </div>
      )}
    </motion.a>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
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
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');

        .alpha-sidebar { font-family: '${C.sans}'; }

        .alpha-sidebar .nav-scroll::-webkit-scrollbar { width: 2px; }
        .alpha-sidebar .nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .alpha-sidebar .nav-scroll::-webkit-scrollbar-thumb {
          background: ${C.blue};
          border-radius: 99px;
        }

        /* Scan-line overlay */
        .alpha-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.012) 0px,
            transparent 1px,
            transparent 3px
          );
          z-index: 0;
        }

        @keyframes alpha-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink {
          animation: alpha-blink 1.1s step-start infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 10px 3px rgba(239,68,68,0.3); }
        }
        .pulse-red { animation: pulse-dot 2.2s ease-in-out infinite; }
      `}</style>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(4,8,15,0.88)", backdropFilter: "blur(6px)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar shell */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "alpha-sidebar relative h-screen flex flex-col z-50 overflow-hidden",
          "hidden lg:flex",
          "fixed lg:relative inset-y-0 left-0",
          mobileOpen ? "flex" : "hidden lg:flex",
        )}
        style={{
          width: collapsed ? 68 : 256,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: `linear-gradient(175deg, #050b17 0%, #04080f 55%, #060408 100%)`,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] z-20" style={{
          background: `linear-gradient(90deg, transparent 0%, ${C.redDim} 35%, ${C.blue} 65%, transparent 100%)`,
        }} />

        {/* Vignette corners */}
        <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none z-0" style={{
          background: "radial-gradient(circle at 0% 0%, rgba(220,38,38,0.06) 0%, transparent 70%)",
        }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none z-0" style={{
          background: "radial-gradient(circle at 100% 100%, rgba(30,58,95,0.1) 0%, transparent 70%)",
        }} />

        {/* ── Logo ──────────────────────────────────── */}
        <div className="relative z-10 px-3.5 pt-4 pb-3 flex-shrink-0">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            {/* Icon box */}
            <div className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #0d1b30 0%, #150a0a 100%)",
              border: `1px solid ${C.borderRed}`,
              boxShadow: `0 0 16px rgba(220,38,38,0.12), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <Activity className="w-4 h-4 pulse-red" style={{ color: C.red }} />
              {/* Live dot */}
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
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: C.textBright }}>
                      ALPHA
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: C.red }}>
                      DATA
                    </span>
                    <span className="cursor-blink" style={{ fontFamily: C.mono, fontSize: 13, color: C.red, marginLeft: 1 }}>_</span>
                  </div>
                  <span style={{ fontFamily: C.mono, fontSize: 7.5, fontWeight: 500, letterSpacing: "0.28em", color: C.textMuted, textTransform: "uppercase" }}>
                    analytics platform
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider with gradient */}
          <div className="mt-3 h-px" style={{
            background: `linear-gradient(90deg, rgba(220,38,38,0.35) 0%, rgba(30,58,95,0.25) 50%, transparent 100%)`,
          }} />
        </div>

        {/* ── Nav ───────────────────────────────────── */}
        <nav className="nav-scroll relative z-10 flex-1 px-2.5 py-1 overflow-y-auto space-y-3">
          {navGroups.map((group) => {
            const visible = group.items.filter(i => !("adminOnly" in i && i.adminOnly && !isAdmin));
            if (!visible.length) return null;
            return (
              <div key={group.key}>
                {/* Group label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-2 mb-1.5"
                    >
                      <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: C.textMuted, textTransform: "uppercase" }}>
                        {group.label}
                      </span>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.border} 0%, transparent 100%)` }} />
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
                      delay={(idx++) * 0.035}
                      onMobileClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Bottom ────────────────────────────────── */}
        <div className="relative z-10 flex-shrink-0 px-2.5 pt-2 pb-3 space-y-px" style={{
          borderTop: `1px solid ${C.border}`,
          background: "rgba(6,10,20,0.6)",
        }}>
          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-2 mb-2 flex items-center gap-2"
              >
                <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: C.textMuted, textTransform: "uppercase" }}>
                  Sistema
                </span>
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
                className="relative flex items-center gap-3 rounded-lg overflow-hidden group"
                style={{
                  padding: collapsed ? "9px 12px" : "8px 12px",
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
                    style={{ background: `linear-gradient(180deg, ${C.red} 0%, ${C.redDim} 100%)`, boxShadow: `0 0 8px rgba(239,68,68,0.5)` }}
                  />
                )}
                <Icon style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? C.red : C.textMuted, transition: "color 0.15s", filter: isActive ? `drop-shadow(0 0 4px rgba(239,68,68,0.4))` : "none" }} />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span style={{ fontFamily: C.sans, fontSize: 12.5, fontWeight: 600, color: isActive ? C.textBright : C.textMid }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: C.redDim, color: "white" }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all" style={{
                    background: "#0a1628", border: `1px solid ${C.border}`,
                    fontFamily: C.sans, fontSize: 11.5, fontWeight: 600, color: C.textBright,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
                  }}>
                    {item.label}
                  </div>
                )}
              </a>
            );
          })}

          {/* Help card */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden rounded-xl mt-2 p-3.5"
                style={{
                  background: "linear-gradient(135deg, #090f1e 0%, #0e0808 100%)",
                  border: `1px solid ${C.border}`,
                }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" style={{
                  background: "radial-gradient(circle at top right, rgba(220,38,38,0.12) 0%, transparent 70%)",
                }} />

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{
                    background: "rgba(220,38,38,0.12)",
                    border: `1px solid ${C.borderRed}`,
                  }}>
                    <HelpCircle style={{ width: 12, height: 12, color: C.red }} />
                  </div>
                  <span style={{ fontFamily: C.sans, fontSize: 11.5, fontWeight: 700, color: C.textBright }}>
                    Suporte 24/7
                  </span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
                </div>

                <p style={{ fontFamily: C.sans, fontSize: 10, color: C.textMuted, lineHeight: 1.55, marginBottom: 10 }}>
                  Precisa de ajuda? Nossa equipe está pronta para auxiliar.
                </p>

                <button className="w-full py-1.5 rounded-lg transition-all duration-200 hover:opacity-80 active:scale-[0.98]" style={{
                  background: "rgba(30,58,95,0.3)",
                  border: `1px solid ${C.border}`,
                  fontFamily: C.mono,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: C.textMid,
                  textTransform: "uppercase",
                }}>
                  Central de Ajuda
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2.5 w-full mt-1.5 rounded-lg transition-all duration-150 group"
            style={{
              padding: collapsed ? "9px 12px" : "8px 12px",
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
                <motion.div key="r" initial={{ rotate: -180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 180, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </motion.div>
              ) : (
                <motion.div key="l" initial={{ rotate: 180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -180, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  Recolher Menu
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}