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
  LogOut,
  HelpCircle
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";

// --- Interfaces ---
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  adminOnly?: boolean;
  color?: string;
}

// --- Navigation Config ---
const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", color: "text-blue-400" },
  { icon: BarChart3, label: "Produção", href: "/production", color: "text-emerald-400" },
  { icon: DollarSign, label: "Preços & Mercado", href: "/prices", color: "text-amber-400" },
  { icon: Ship, label: "Exportações", href: "/exports", color: "text-blue-500" },
  { icon: Building2, label: "Competidores", href: "/competitors", color: "text-purple-400" },
  { icon: Brain, label: "Previsões IA", href: "/predictions", badge: "AI", color: "text-fuchsia-400" },
  { icon: AlertTriangle, label: "Risco", href: "/risk", color: "text-rose-400" },
  { icon: FileText, label: "Relatórios", href: "/reports", color: "text-zinc-400" },
  { icon: Search, label: "Pesquisa", href: "/search", color: "text-zinc-400" },
  { icon: Shield, label: "Admin", href: "/admin", badge: "Admin", adminOnly: true, color: "text-orange-400" },
];

const bottomNavItems: NavItem[] = [
  { icon: Users2, label: "Workspaces", href: "/workspace" },
  { icon: Bell, label: "Alertas", href: "/alerts", badge: "3" },
  { icon: CreditCard, label: "Subscrição", href: "/subscription" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

interface SidebarProps {
  activeItem?: string;
}

// --- Main Component ---
export function Sidebar({ activeItem = "/" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "h-screen flex flex-col border-r border-zinc-800/50 bg-[#0B0E14]/80 backdrop-blur-2xl transition-all duration-500 ease-in-out hidden lg:flex relative z-50",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Logo Section */}
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 p-1.5 rounded-xl bg-white/5 border border-white/10 shadow-2xl">
            <img
              src={alphadataLogo}
              alt="AlphaData"
              className={cn(
                "transition-all duration-500",
                isCollapsed ? "h-8 w-8 object-contain" : "h-9 w-auto"
              )}
            />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-lg font-black text-white tracking-tighter leading-none">ALPHADATA</span>
              <span className="text-[10px] font-bold text-primary tracking-[0.2em] mt-1">ANALYTICS</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar py-2">
        {!isCollapsed && (
          <div className="px-3 mb-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Menu Principal</span>
          </div>
        )}
        
        {filteredNavItems.map((item, index) => (
          <motion.a
            key={item.href}
            href={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
              activeItem === item.href
                ? "bg-primary/10 text-white shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            {/* Active Indicator */}
            {activeItem === item.href && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
              />
            )}

            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110",
              activeItem === item.href ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300"
            )} />

            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className={cn(
                  "font-semibold text-sm tracking-tight transition-colors",
                  activeItem === item.href ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                  {item.label}
                </span>
                {item.badge && (
                  <Badge className={cn(
                    "ml-auto text-[10px] font-black px-1.5 h-5 border-none",
                    item.badge === "AI" ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-primary/20 text-primary"
                  )}>
                    {item.badge}
                  </Badge>
                )}
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-zinc-800">
                {item.label}
              </div>
            )}
          </motion.a>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 mt-auto border-t border-zinc-800/50 space-y-1.5 bg-black/20">
        {!isCollapsed && (
          <div className="px-3 mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sistema</span>
          </div>
        )}
        
        {bottomNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 group relative",
              activeItem === item.href
                ? "bg-white/5 text-white"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
            )}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0 transition-transform group-hover:rotate-12" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </a>
        ))}

        {/* Help & Support */}
        {!isCollapsed && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-white">Suporte</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">Precisa de ajuda com a plataforma?</p>
            <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold bg-transparent border-zinc-800 hover:bg-primary hover:text-black hover:border-primary transition-all">
              CENTRAL DE AJUDA
            </Button>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 px-3.5 py-3 mt-2 w-full rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-300 group"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </div>
          {!isCollapsed && <span className="font-bold text-xs uppercase tracking-widest">Recolher Menu</span>}
        </button>
      </div>
    </motion.aside>
  );
}

// --- Helper Component ---
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}