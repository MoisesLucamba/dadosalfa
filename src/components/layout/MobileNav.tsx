import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, DollarSign, Ship, Brain,
  AlertTriangle, FileText, Bell, Settings, Menu, X,
  Search, CreditCard, Shield, Building2, Users2, Zap,
  Terminal, Activity, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const C = {
  bg:       "#04080f",
  bgHover:  "#07101e",
  bgActive: "#0b1525",
  border:   "rgba(20,40,70,0.6)",
  borderRed:"rgba(220,38,38,0.28)",
  red:      "#ef4444",
  redDim:   "#dc2626",
  textMuted:"#2a4560",
  textMid:  "#4a72a0",
  textBright:"#c0d8f0",
  mono:     "'IBM Plex Mono', monospace",
};

/* ─── Nav items ──────────────────────────────────────────────────────────── */
interface NavItem { icon: React.ElementType; label: string; sig: string; href: string; badge?: string; adminOnly?: boolean; }

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "DASHBOARD",         sig: "DSH", href: "/"                },
  { icon: BarChart3,       label: "PRODUÇÃO",          sig: "PRD", href: "/production"       },
  { icon: DollarSign,      label: "PREÇOS & MERCADO",  sig: "MKT", href: "/prices"           },
  { icon: Ship,            label: "EXPORTAÇÕES",        sig: "EXP", href: "/exports"          },
  { icon: Building2,       label: "COMPETIDORES",       sig: "CMP", href: "/competitors"      },
  { icon: Brain,           label: "PREVISÕES IA",       sig: "AIP", href: "/predictions",     badge: "AI"  },
  { icon: AlertTriangle,   label: "RISCO",              sig: "RSK", href: "/risk"             },
  { icon: FileText,        label: "RELATÓRIOS",         sig: "REP", href: "/reports"          },
  { icon: Search,          label: "PESQUISA",           sig: "SRH", href: "/search"           },
  { icon: Shield,          label: "ADMIN",              sig: "ADM", href: "/admin",           badge: "ADM", adminOnly: true },
];

const bottomItems: NavItem[] = [
  { icon: Users2,     label: "WORKSPACES",    sig: "WRK", href: "/workspace"   },
  { icon: Bell,       label: "ALERTAS",       sig: "ALR", href: "/alerts",       badge: "3"  },
  { icon: CreditCard, label: "SUBSCRIÇÃO",    sig: "SUB", href: "/subscription" },
  { icon: Settings,   label: "CONFIGURAÇÕES", sig: "CFG", href: "/settings"     },
];

interface MobileNavProps { activeItem?: string; }

export function MobileNav({ activeItem = "/" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  const filtered = navItems.filter(i => !i.adminOnly || isAdmin);

  useSwipeGesture({
    onSwipeRight: () => setOpen(true),
    onSwipeLeft:  () => setOpen(false),
    threshold: 60,
    edgeWidth: 40,
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`}</style>

      {/* Hamburger */}
      <button
        className="lg:hidden w-8 h-8 rounded flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
        onClick={() => setOpen(true)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderRed; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: "rgba(2,4,10,0.88)", backdropFilter: "blur(10px)" }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -280, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => { if (info.offset.x < -80 || info.velocity.x < -400) setOpen(false); }}
            className="fixed left-0 top-0 z-50 h-full w-68 lg:hidden touch-pan-y overflow-hidden"
            style={{
              width: 268,
              background: `linear-gradient(175deg, #050c18 0%, #04080f 55%, #060309 100%)`,
              borderRight: `1px solid ${C.border}`,
              fontFamily: C.mono,
            }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 3px)",
            }} />

            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
              background: `linear-gradient(90deg, transparent, ${C.redDim} 35%, rgba(30,58,95,0.5) 65%, transparent)`,
            }} />

            {/* Corner glow */}
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none" style={{
              background: "radial-gradient(circle at 0% 0%, rgba(220,38,38,0.06) 0%, transparent 70%)",
            }} />

            {/* Header */}
            <div className="relative z-10 px-4 pt-4 pb-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0d1b30, #150a0a)", border: `1px solid ${C.borderRed}` }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: C.red }} />
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-red-500" style={{ marginTop: -20, marginLeft: 18 }} />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: C.textBright }}>ALPHA</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: C.red }}>DAT</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: C.textMuted }}>-OS</span>
                  </div>
                  <p style={{ fontSize: 7, fontWeight: 500, letterSpacing: "0.28em", color: C.textMuted }}>PETROLEUM INTEL</p>
                </div>
              </div>
              <button
                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                style={{ background: "rgba(255,255,255,0.04)", color: C.textMuted, border: `1px solid ${C.border}` }}
                onClick={() => setOpen(false)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderRed; (e.currentTarget as HTMLElement).style.color = C.red; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drag indicator */}
            <div className="flex justify-center py-2">
              <div className="w-8 h-0.5 rounded-full" style={{ background: C.textMuted, opacity: 0.3 }} />
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-2.5 space-y-px overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {filtered.map((item, i) => {
                const isActive = activeItem === item.href;
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, type: "spring", stiffness: 280 }}
                    className="relative flex items-center gap-2.5 rounded overflow-hidden group"
                    style={{
                      padding: "8px 10px",
                      background: isActive ? C.bgActive : "transparent",
                      border: `1px solid ${isActive ? C.borderRed : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = C.bgHover; (e.currentTarget as HTMLElement).style.borderColor = C.border; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; } }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="mobileActiveBar"
                        className="absolute left-0 top-[15%] bottom-[15%] w-[2px] rounded-r"
                        style={{ background: `linear-gradient(180deg, ${C.red}, ${C.redDim})`, boxShadow: `0 0 8px rgba(239,68,68,0.5)` }}
                      />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: "radial-gradient(ellipse 80% 100% at 0% 50%, rgba(220,38,38,0.05) 0%, transparent 70%)",
                      }} />
                    )}

                    <Icon style={{ width: 13, height: 13, flexShrink: 0, color: isActive ? C.red : C.textMuted, filter: isActive ? `drop-shadow(0 0 4px rgba(239,68,68,0.5))` : "none" }} />

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span style={{ fontSize: 8, fontWeight: 700, color: isActive ? "rgba(239,68,68,0.6)" : C.textMuted, letterSpacing: "0.1em", flexShrink: 0 }}>
                        {item.sig}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: isActive ? C.textBright : C.textMid, transition: "color 0.15s" }}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span style={{
                        fontSize: 7, fontWeight: 700, letterSpacing: "0.12em",
                        padding: "2px 6px", borderRadius: 2, flexShrink: 0,
                        background: item.badge === "AI" ? "rgba(220,38,38,0.12)"
                          : item.badge === "ADM" ? "rgba(30,58,95,0.4)" : C.redDim,
                        color: item.badge === "AI" ? C.red : item.badge === "ADM" ? "#60a5fa" : "white",
                        border: `1px solid ${item.badge === "AI" ? "rgba(220,38,38,0.22)" : item.badge === "ADM" ? "rgba(30,58,95,0.55)" : "transparent"}`,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </motion.a>
                );
              })}
            </nav>

            {/* Bottom nav */}
            <div className="relative z-10 px-2.5 pt-2 pb-4 space-y-px"
              style={{ borderTop: `1px solid ${C.border}`, background: "rgba(4,8,15,0.6)" }}>
              {/* Sistema label */}
              <div className="px-1.5 mb-1.5 flex items-center gap-2">
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.25em", color: C.textMuted }}>SISTEMA</span>
                <span style={{ fontSize: 7, color: C.textMuted, opacity: 0.5 }}>//SYS</span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.border}, transparent)` }} />
              </div>

              {bottomItems.map((item, i) => {
                const isActive = activeItem === item.href;
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (filtered.length + i) * 0.025, type: "spring", stiffness: 280 }}
                    className="flex items-center gap-2.5 rounded group"
                    style={{
                      padding: "7px 10px",
                      background: isActive ? C.bgActive : "transparent",
                      border: `1px solid ${isActive ? C.borderRed : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = C.bgHover; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                  >
                    <Icon style={{ width: 13, height: 13, flexShrink: 0, color: isActive ? C.red : C.textMuted }} />
                    <div className="flex items-center gap-2 flex-1">
                      <span style={{ fontSize: 8, fontWeight: 700, color: isActive ? "rgba(239,68,68,0.6)" : C.textMuted, letterSpacing: "0.1em" }}>
                        {item.sig}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: isActive ? C.textBright : C.textMid }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span style={{ fontSize: 7, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: C.redDim, color: "white" }}>
                        {item.badge}
                      </span>
                    )}
                  </motion.a>
                );
              })}
            </div>

            {/* Swipe hint */}
            <div className="pb-4 text-center">
              <p style={{ fontSize: 8, letterSpacing: "0.15em", color: C.textMuted }}>
                DESLIZE ← PARA FECHAR
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}