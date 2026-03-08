import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Ship,
  Brain,
  AlertTriangle,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  CreditCard,
  Shield,
  Building2,
  Users2,
  HelpCircle,
  Zap,
  Activity
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════════════════ */

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  adminOnly?: boolean;
  group?: "analytics" | "intelligence" | "data";
}

interface SidebarProps {
  activeItem?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

const navGroups = [
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: BarChart3, label: "Produção", href: "/production" },
      { icon: DollarSign, label: "Preços & Mercado", href: "/prices" },
    ]
  },
  {
    key: "intelligence",
    label: "Inteligência",
    items: [
      { icon: Brain, label: "Previsões IA", href: "/predictions", badge: "AI" },
      { icon: AlertTriangle, label: "Risco", href: "/risk" },
      { icon: Building2, label: "Competidores", href: "/competitors" },
      { icon: Zap, label: "Visão Computacional", href: "/well-simulation", badge: "AI" },
    ]
  },
  {
    key: "data",
    label: "Dados",
    items: [
      { icon: Ship, label: "Exportações", href: "/exports" },
      { icon: Search, label: "Pesquisa", href: "/search" },
      { icon: FileText, label: "Relatórios", href: "/reports" },
      { icon: Shield, label: "Admin", href: "/admin", badge: "Admin", adminOnly: true },
    ]
  }
];

const bottomNavItems = [
  { icon: Users2, label: "Workspaces", href: "/workspace" },
  { icon: Bell, label: "Alertas", href: "/alerts", badge: "3" },
  { icon: CreditCard, label: "Subscrição", href: "/subscription" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ITEM COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const NavItemComponent = ({
  item,
  isActive,
  isCollapsed,
  index,
  onMobileClick,
}: {
  item: { icon: React.ElementType; label: string; href: string; badge?: string };
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
  onMobileClick?: () => void;
}) => (
  <motion.a
    href={item.href}
    onClick={onMobileClick}
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04, duration: 0.25 }}
    className={cn(
      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden",
      isActive
        ? "bg-[#0f1a2e] text-white"
        : "text-[#5a7090] hover:text-[#9bb5d6] hover:bg-[#080e1a]"
    )}
    style={{
      border: isActive
        ? "1px solid rgba(220,38,38,0.4)"
        : "1px solid transparent",
    }}
  >
    {/* Left accent bar */}
    {isActive && (
      <motion.div
        layoutId="activeBar"
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
        style={{
          background: "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)",
          boxShadow: "0 0 8px rgba(220,38,38,0.6)",
        }}
      />
    )}

    {/* Subtle active bg glow */}
    {isActive && (
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at left center, #dc2626 0%, transparent 70%)",
        }}
      />
    )}

    {/* Icon */}
    <item.icon
      className={cn(
        "w-4.5 h-4.5 flex-shrink-0 transition-all duration-200",
        isActive
          ? "text-[#ef4444]"
          : "text-[#3d5a7a] group-hover:text-[#5a8ab5]"
      )}
      style={isActive ? { filter: "drop-shadow(0 0 4px rgba(239,68,68,0.5))" } : {}}
    />

    {/* Label */}
    {!isCollapsed && (
      <div className="flex items-center justify-between w-full min-w-0">
        <span
          className={cn(
            "text-[13px] font-semibold tracking-tight truncate transition-colors",
            isActive ? "text-white" : "text-[#5a7090] group-hover:text-[#9bb5d6]"
          )}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {item.label}
        </span>
        {item.badge && (
          <span
            className={cn(
              "ml-2 flex-shrink-0 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full",
              item.badge === "AI"
                ? "bg-[#dc2626]/20 text-[#ef4444] border border-[#dc2626]/30"
                : item.badge === "Admin"
                ? "bg-[#1e3a5f]/60 text-[#60a5fa] border border-[#1e40af]/40"
                : "bg-[#dc2626] text-white"
            )}
          >
            {item.badge}
          </span>
        )}
      </div>
    )}

    {/* Tooltip (collapsed) */}
    {isCollapsed && (
      <div
        className="absolute left-full ml-3 px-3 py-2 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border shadow-2xl"
        style={{
          background: "#0a1628",
          borderColor: "rgba(220,38,38,0.3)",
          color: "#e2e8f0",
        }}
      >
        {item.label}
      </div>
    )}
  </motion.a>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function Sidebar({
  activeItem = "/",
  isMobileOpen: externalMobileOpen,
  setIsMobileOpen: externalSetMobileOpen,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  const isMobileOpen = externalMobileOpen ?? internalMobileOpen;
  const setIsMobileOpen = externalSetMobileOpen ?? setInternalMobileOpen;

  let globalIndex = 0;

  return (
    <>
      <style>{`
        .sidebar-scrollbar::-webkit-scrollbar { width: 3px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: #dc2626; }

        .group-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1e3a5f;
        }

        .logo-text-primary {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #e2e8f0;
        }

        .logo-text-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.3em;
          color: #dc2626;
          text-transform: uppercase;
        }

        .sidebar-bg {
          background: #050b14;
          border-right: 1px solid rgba(30,58,95,0.5);
        }

        .bottom-item {
          font-family: 'Outfit', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
        }
      `}</style>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(5,11,20,0.85)", backdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "sidebar-bg h-screen flex flex-col relative z-50",
          "hidden lg:flex transition-all duration-400 ease-in-out",
          isCollapsed ? "lg:w-[68px]" : "lg:w-[260px]",
          "fixed lg:relative inset-y-0 left-0",
          isMobileOpen ? "flex w-[260px]" : "hidden lg:flex"
        )}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #dc2626 40%, #1e3a5f 70%, transparent 100%)",
          }}
        />

        {/* Background mesh texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #ffffff 0px, transparent 1px, transparent 24px, #ffffff 25px), repeating-linear-gradient(90deg, #ffffff 0px, transparent 1px, transparent 24px, #ffffff 25px)",
            backgroundSize: "25px 25px",
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            LOGO
            ═══════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-5 pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo icon box */}
              <div
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0f1d35 0%, #1a0a0a 100%)",
                  border: "1px solid rgba(220,38,38,0.35)",
                  boxShadow: "0 0 12px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <Activity className="w-4.5 h-4.5 text-[#ef4444]" style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.6))" }} />
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    <span className="logo-text-primary">ALPHADATA</span>
                    <span className="logo-text-sub">Analytics</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#3d5a7a] hover:text-[#9bb5d6] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div
            className="mt-4 h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, rgba(220,38,38,0.4) 0%, rgba(30,58,95,0.3) 60%, transparent 100%)",
            }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN NAV — GROUPED
            ═══════════════════════════════════════════════════════════════ */}
        <nav className="flex-1 px-3 overflow-y-auto sidebar-scrollbar space-y-4 py-2 relative z-10">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !("adminOnly" in item && item.adminOnly && !isAdmin)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.key}>
                {/* Group label */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-2 flex items-center gap-2"
                    >
                      <span className="group-label">{group.label}</span>
                      <div
                        className="flex-1 h-[1px]"
                        style={{ background: "rgba(30,58,95,0.4)" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <NavItemComponent
                        key={item.href}
                        item={item}
                        isActive={activeItem === item.href}
                        isCollapsed={isCollapsed}
                        index={idx}
                        onMobileClick={() => setIsMobileOpen(false)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════════════════════════
            BOTTOM SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="p-3 relative z-10 space-y-0.5"
          style={{
            borderTop: "1px solid rgba(30,58,95,0.4)",
            background: "rgba(8,14,26,0.6)",
          }}
        >
          {/* Section label */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 mb-2"
              >
                <span className="group-label">Sistema</span>
              </motion.div>
            )}
          </AnimatePresence>

          {bottomNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden",
                activeItem === item.href
                  ? "bg-[#0f1a2e] text-white"
                  : "text-[#3d5a7a] hover:text-[#7aa3cc] hover:bg-[#080e1a]"
              )}
              style={{
                border:
                  activeItem === item.href
                    ? "1px solid rgba(220,38,38,0.3)"
                    : "1px solid transparent",
              }}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-all",
                  activeItem === item.href
                    ? "text-[#ef4444]"
                    : "text-[#2d4a6a] group-hover:text-[#5a8ab5]"
                )}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="bottom-item">{item.label}</span>
                  {item.badge && (
                    <span
                      className="w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-full"
                      style={{ background: "#dc2626", color: "white" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {isCollapsed && (
                <div
                  className="absolute left-full ml-3 px-3 py-2 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border shadow-2xl"
                  style={{
                    background: "#0a1628",
                    borderColor: "rgba(30,58,95,0.5)",
                    color: "#e2e8f0",
                  }}
                >
                  {item.label}
                </div>
              )}
            </a>
          ))}

          {/* Help Card */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="mt-3 p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0a1628 0%, #0f0a0a 100%)",
                  border: "1px solid rgba(30,58,95,0.5)",
                }}
              >
                {/* Corner accent */}
                <div
                  className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at top right, rgba(220,38,38,0.15) 0%, transparent 70%)",
                  }}
                />
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(220,38,38,0.15)",
                      border: "1px solid rgba(220,38,38,0.3)",
                    }}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#e2e8f0",
                    }}
                  >
                    Suporte 24/7
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "10px",
                    color: "#3d5a7a",
                    lineHeight: "1.5",
                    marginBottom: "10px",
                  }}
                >
                  Precisa de ajuda? Nossa equipe está pronta para auxiliar.
                </p>
                <button
                  className="w-full py-1.5 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "rgba(30,58,95,0.4)",
                    border: "1px solid rgba(30,58,95,0.6)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "#7aa3cc",
                  }}
                >
                  CENTRAL DE AJUDA
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Toggle */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 mt-1 w-full rounded-lg transition-all duration-200 group"
            style={{
              color: "#2d4a6a",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#5a8ab5";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.4)";
              (e.currentTarget as HTMLElement).style.background = "#080e1a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#2d4a6a";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.div key="expand" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div key="collapse" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <ChevronLeft className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
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