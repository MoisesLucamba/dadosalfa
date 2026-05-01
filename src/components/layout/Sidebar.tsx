import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, DollarSign, Ship,
  Brain, AlertTriangle, FileText, Bell, Settings,
  ChevronLeft, ChevronRight, CreditCard,
  Shield, Building2, Users2, HelpCircle, Zap, Activity,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Nav config ─────────────────────────────────────────────────────────── */
const navGroups = [
  {
    key: "analytics",
    label: "Analytics",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",        href: "/" },
      { icon: BarChart3,       label: "Produção",         href: "/production" },
      { icon: DollarSign,      label: "Preços & Mercado", href: "/prices" },
    ],
  },
  {
    key: "intelligence",
    label: "Inteligência",
    items: [
      { icon: Brain,           label: "Previsões IA",         href: "/predictions",     badge: "AI" },
      { icon: AlertTriangle,   label: "Risco",                href: "/risk" },
      { icon: Building2,       label: "Competidores",         href: "/competitors" },
      { icon: Zap,             label: "Visão Computacional",  href: "/well-simulation", badge: "AI" },
      { icon: Activity,        label: "Ocean Intelligence",   href: "/ocean-intelligence", badge: "NEW" },
    ],
  },
  {
    key: "data",
    label: "Dados",
    items: [
      { icon: Ship,     label: "Exportações", href: "/exports" },
      { icon: Search,   label: "Pesquisa",    href: "/search" },
      { icon: FileText, label: "Relatórios",  href: "/reports" },
      { icon: Shield,   label: "Admin",       href: "/admin", badge: "ADM", adminOnly: true },
    ],
  },
];

const bottomNavItems = [
  { icon: Users2,     label: "Workspaces",    href: "/workspace" },
  { icon: Bell,       label: "Alertas",       href: "/alerts" },
  { icon: CreditCard, label: "Subscrição",    href: "/subscription" },
  { icon: Settings,   label: "Configurações", href: "/settings" },
];

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
      className={cn(
        "relative flex items-center gap-2.5 rounded-md overflow-hidden group cursor-pointer transition-all duration-150",
        isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2",
        isActive
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground hover:border-border/50"
      )}
    >
      {isActive && (
        <motion.span
          layoutId="active-bar"
          className="absolute left-0 top-[15%] bottom-[15%] w-[2px] rounded-r-sm bg-primary"
        />
      )}

      <Icon className={cn("flex-shrink-0 w-4 h-4", isActive && "text-primary")} />

      {!isCollapsed && (
        <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
          <span className={cn("text-sm font-medium truncate", isActive && "text-foreground")}>
            {item.label}
          </span>
          {item.badge && (
            <span className={cn(
              "text-[9px] font-semibold px-1.5 py-0.5 rounded",
              item.badge === "AI"
                ? "bg-primary/10 text-primary border border-primary/20"
                : item.badge === "ADM"
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-primary text-primary-foreground"
            )}>
              {item.badge}
            </span>
          )}
        </div>
      )}

      {isCollapsed && (
        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all bg-popover border border-border shadow-lg text-xs font-medium text-foreground">
          {item.label}
        </div>
      )}
    </motion.a>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
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
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar shell */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "relative h-screen flex flex-col z-50 overflow-hidden bg-card border-r border-border",
          "hidden lg:flex",
          "fixed lg:relative inset-y-0 left-0",
          mobileOpen ? "flex" : "hidden lg:flex",
        )}
        style={{
          width: collapsed ? 64 : 248,
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Logotype ─────────────────────────────── */}
        <div className="px-3 pt-4 pb-3 flex-shrink-0">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
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
                    <span className="text-sm font-bold tracking-wider text-foreground">ALPHA</span>
                    <span className="text-sm font-bold tracking-wider text-primary">DATA</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Petroleum Intelligence</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 h-px bg-border" />
        </div>

        {/* ── Nav groups ───────────────────────────── */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-4 scrollbar-thin">
          {navGroups.map((group) => {
            const visible = group.items.filter(i => !("adminOnly" in i && i.adminOnly && !isAdmin));
            if (!visible.length) return null;
            return (
              <div key={group.key}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 mb-1.5"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                    </motion.div>
                  )}
                  {collapsed && (
                    <div className="flex justify-center mb-1">
                      <div className="h-px w-6 bg-border" />
                    </div>
                  )}
                </AnimatePresence>

                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <NavItemComp
                      key={item.href}
                      item={item as NavItem}
                      isActive={activeItem === item.href}
                      isCollapsed={collapsed}
                      delay={(idx++) * 0.02}
                      onMobileClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Bottom system nav ────────────────────── */}
        <div className="flex-shrink-0 px-2 pt-2 pb-3 space-y-0.5 border-t border-border bg-card">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 mb-1.5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Sistema
                </span>
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
                className={cn(
                  "relative flex items-center gap-2.5 rounded-md overflow-hidden group transition-all duration-150",
collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span layoutId="active-bar-bottom"
                    className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-sm bg-primary"
                  />
                )}

                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />

                {!collapsed && (
                  <span className={cn("text-sm font-medium", isActive && "text-foreground")}>
                    {item.label}
                  </span>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all bg-popover border border-border shadow-lg text-xs font-medium text-foreground">
                    {item.label}
                  </div>
                )}
              </a>
            );
          })}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex items-center gap-2 w-full mt-2 rounded-md transition-all text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2"
            )}
          >
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div key="r" initial={{ rotate: -180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 180, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div key="l" initial={{ rotate: 180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -180, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <ChevronLeft className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  className="text-xs font-medium"
                >
                  Recolher menu
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
