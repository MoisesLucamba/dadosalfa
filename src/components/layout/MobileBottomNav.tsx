import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, DollarSign, Brain, MoreHorizontal,
  Ship, FileText, AlertTriangle, Settings, Bell, Search,
  Users, Building2, Zap, X, Terminal, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:     "#04080f",
  card:   "#070d1a",
  hover:  "#0b1422",
  red:    "#ef4444",
  redDim: "rgba(220,38,38,0.12)",
  redBdr: "rgba(220,38,38,0.25)",
  border: "rgba(255,255,255,0.06)",
  w30:    "rgba(255,255,255,0.3)",
  w60:    "rgba(255,255,255,0.6)",
  mono:   "'IBM Plex Mono', monospace",
};

/* ─── Main tabs ──────────────────────────────────────────────────────────── */
const TAB_ITEMS = [
  { icon: LayoutDashboard, label: "DSH", labelFull: "DASHBOARD", href: "/" },
  { icon: BarChart3,       label: "PRD", labelFull: "PRODUÇÃO",  href: "/production" },
  { icon: DollarSign,      label: "MKT", labelFull: "PREÇOS",    href: "/prices" },
  { icon: Brain,           label: "AIP", labelFull: "IA",        href: "/predictions" },
];

/* ─── More items ─────────────────────────────────────────────────────────── */
const MORE_ITEMS = [
  { icon: Ship,         label: "EXPORTAÇÕES",         sig: "EXP", href: "/exports",        color: "#4ade80" },
  { icon: FileText,     label: "RELATÓRIOS",           sig: "REP", href: "/reports",         color: "#38bdf8" },
  { icon: AlertTriangle,label: "RISCOS",               sig: "RSK", href: "/risk",            color: "#fbbf24" },
  { icon: Building2,    label: "COMPETIDORES",         sig: "CMP", href: "/competitors",     color: "#a78bfa" },
  { icon: Search,       label: "PESQUISA",             sig: "SRH", href: "/search",          color: "#38bdf8" },
  { icon: Zap,          label: "VISÃO COMPUTACIONAL",  sig: "VIZ", href: "/well-simulation", color: "#fb923c" },
  { icon: Zap,          label: "OCEAN INTELLIGENCE",   sig: "OCN", href: "/ocean-intelligence", color: "#00FFCC" },
  { icon: Bell,         label: "ALERTAS",              sig: "ALR", href: "/alerts",          color: "#f87171" },
  { icon: Users,        label: "WORKSPACE",            sig: "WRK", href: "/workspace",       color: "#818cf8" },
  { icon: Settings,     label: "CONFIGURAÇÕES",        sig: "CFG", href: "/settings",        color: T.w30     },
];

export function MobileBottomNav() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const current   = location.pathname;
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = !TAB_ITEMS.map(t => t.href).includes(current);

  const handleMore = (href: string) => { setShowMore(false); navigate(href); };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`}</style>

      {/* ── Bottom bar ── */}
      <motion.nav
        initial={{ y: 100 }} animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          fontFamily: T.mono,
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.4) 35%, rgba(30,58,95,0.3) 65%, transparent 100%)`,
        }} />

        <div className="flex items-center h-14 px-1">
          {TAB_ITEMS.map(item => {
            const isActive = current === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-all"
                style={{ color: isActive ? T.red : T.w30 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${T.red}, transparent)` }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
                <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: "spring", damping: 15, stiffness: 300 }}>
                  <Icon className="w-4 h-4" style={{ color: isActive ? T.red : T.w30, filter: isActive ? `drop-shadow(0 0 4px rgba(239,68,68,0.5))` : "none" }} />
                </motion.div>
                <span className="text-[8px] mt-1 font-bold tracking-[0.15em]" style={{ color: isActive ? T.red : T.w30 }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-all"
            style={{ color: isMoreActive ? T.red : T.w30 }}
          >
            {isMoreActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${T.red}, transparent)` }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            <motion.div animate={{ scale: isMoreActive ? 1.1 : 1 }} transition={{ type: "spring", damping: 15, stiffness: 300 }}>
              <MoreHorizontal className="w-4 h-4" style={{ color: isMoreActive ? T.red : T.w30, filter: isMoreActive ? `drop-shadow(0 0 4px rgba(239,68,68,0.5))` : "none" }} />
            </motion.div>
            <span className="text-[8px] mt-1 font-bold tracking-[0.15em]" style={{ color: isMoreActive ? T.red : T.w30 }}>
              MAIS
            </span>
          </button>
        </div>
      </motion.nav>

      {/* ── More menu sheet ── */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: "rgba(2,4,10,0.88)", backdropFilter: "blur(10px)" }}
              onClick={() => setShowMore(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t overflow-hidden"
              style={{ background: T.card, border: `1px solid rgba(220,38,38,0.2)`, borderBottom: "none", fontFamily: T.mono, maxHeight: "80vh" }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
                background: `linear-gradient(90deg, transparent, ${T.red}, transparent)`,
              }} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" style={{ color: T.red }} />
                  <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.85)" }}>
                    MÓDULOS DO SISTEMA
                  </span>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-7 h-7 rounded flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: T.w30 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.redDim; (e.currentTarget as HTMLElement).style.color = T.red; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = T.w30; }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid */}
              <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto" style={{ maxHeight: "calc(80vh - 56px)" }}>
                {MORE_ITEMS.map(item => {
                  const isActive = current === item.href;
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.href}
                      onClick={() => handleMore(item.href)}
                      whileTap={{ scale: 0.97 }}
                      className="relative flex flex-col items-start p-3.5 rounded overflow-hidden group text-left transition-all"
                      style={{
                        background: isActive ? `${item.color}0f` : "rgba(255,255,255,0.025)",
                        border: `1px solid ${isActive ? `${item.color}30` : "rgba(255,255,255,0.06)"}`,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${item.color}40`}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = isActive ? `${item.color}30` : "rgba(255,255,255,0.06)"}
                    >
                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-400"
                        style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }} />

                      {/* SIG + icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                          style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        </div>
                        <span className="text-[9px] font-bold tracking-[0.15em]"
                          style={{ color: isActive ? item.color : "rgba(255,255,255,0.2)" }}>
                          {item.sig}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold tracking-wider leading-tight"
                        style={{ color: isActive ? item.color : "rgba(255,255,255,0.7)" }}>
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}