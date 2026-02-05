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
  Zap
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
  color?: string;
}

interface SidebarProps {
  activeItem?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGATION CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

const navItems: NavItem[] = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/", 
    color: "text-blue-400" 
  },
  { 
    icon: BarChart3, 
    label: "Produção", 
    href: "/production", 
    color: "text-blue-500" 
  },
  { 
    icon: DollarSign, 
    label: "Preços & Mercado", 
    href: "/prices", 
    color: "text-red-400" 
  },
  { 
    icon: Ship, 
    label: "Exportações", 
    href: "/exports", 
    color: "text-blue-600" 
  },
  { 
    icon: Building2, 
    label: "Competidores", 
    href: "/competitors", 
    color: "text-red-500" 
  },
  { 
    icon: Brain, 
    label: "Previsões IA", 
    href: "/predictions", 
    badge: "AI", 
    color: "text-red-400" 
  },
  { 
    icon: AlertTriangle, 
    label: "Risco", 
    href: "/risk", 
    color: "text-red-500" 
  },
  { 
    icon: FileText, 
    label: "Relatórios", 
    href: "/reports", 
    color: "text-blue-400" 
  },
  { 
    icon: Search, 
    label: "Pesquisa", 
    href: "/search", 
    color: "text-white" 
  },
  { 
    icon: Shield, 
    label: "Admin", 
    href: "/admin", 
    badge: "Admin", 
    adminOnly: true, 
    color: "text-red-500" 
  },
];

const bottomNavItems: NavItem[] = [
  { icon: Users2, label: "Workspaces", href: "/workspace" },
  { icon: Bell, label: "Alertas", href: "/alerts", badge: "3" },
  { icon: CreditCard, label: "Subscrição", href: "/subscription" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn(
    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
    className
  )}>
    {children}
  </span>
);

const NavItemComponent = ({ 
  item, 
  isActive, 
  isCollapsed, 
  index,
  onMobileClick 
}: { 
  item: NavItem; 
  isActive: boolean; 
  isCollapsed: boolean; 
  index: number;
  onMobileClick?: () => void;
}) => (
  <motion.a
    key={item.href}
    href={item.href}
    onClick={onMobileClick}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
      isActive
        ? "bg-gradient-to-r from-red-900/30 to-blue-900/30 border border-red-800/50 text-white shadow-lg shadow-red-900/20"
        : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent hover:border-gray-800"
    )}
  >
    {/* Active Indicator Bar */}
    <AnimatePresence>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-red-500 to-blue-500 rounded-r-full shadow-lg shadow-red-500/50"
        />
      )}
    </AnimatePresence>

    {/* Icon */}
    <div className="relative">
      {isActive && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-blue-500/20 rounded-lg blur"
        />
      )}
      <item.icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-all duration-300 relative z-10",
        isActive 
          ? "text-red-400 group-hover:scale-110" 
          : "text-gray-500 group-hover:text-white group-hover:scale-110"
      )} />
    </div>

    {/* Label & Badge */}
    {!isCollapsed && (
      <div className="flex items-center justify-between w-full">
        <span className={cn(
          "font-bold text-sm tracking-tight transition-colors",
          isActive ? "text-white" : "text-gray-400 group-hover:text-white"
        )}>
          {item.label}
        </span>
        {item.badge && (
          <Badge className={cn(
            "ml-auto text-[10px] px-2 h-5 border-none shadow-lg",
            item.badge === "AI" 
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50" 
              : item.badge === "Admin"
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-600/50"
              : "bg-blue-900/50 text-blue-300 shadow-blue-900/30"
          )}>
            {item.badge}
          </Badge>
        )}
      </div>
    )}

    {/* Tooltip for collapsed state */}
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border border-gray-800 shadow-xl">
        {item.label}
        {item.badge && (
          <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full">
            {item.badge}
          </span>
        )}
      </div>
    )}
  </motion.a>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function Sidebar({ activeItem = "/", isMobileOpen: externalMobileOpen, setIsMobileOpen: externalSetMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  // Use external state if provided, otherwise use internal
  const isMobileOpen = externalMobileOpen ?? internalMobileOpen;
  const setIsMobileOpen = externalSetMobileOpen ?? setInternalMobileOpen;

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1 
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "h-screen flex flex-col border-r border-gray-800 transition-all duration-500 ease-in-out relative z-50 shadow-2xl",
          // Desktop styles
          "hidden lg:flex lg:bg-gradient-to-b lg:from-gray-900 lg:via-black lg:to-gray-900",
          isCollapsed ? "lg:w-[80px]" : "lg:w-[280px]",
          // Mobile styles - FUNDO SÓLIDO GARANTIDO
          "fixed lg:relative inset-y-0 left-0 bg-gray-950",
          isMobileOpen ? "flex w-[280px]" : "hidden lg:flex"
        )}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-blue-900/10 pointer-events-none z-0" />

      {/* ═══════════════════════════════════════════════════════════════
          LOGO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-6 mb-2 relative z-10">
        <div className="flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-red-900/30 to-blue-900/30 border border-red-800/30 shadow-xl shadow-red-900/20"
            >
              <img
                src={alphadataLogo}
                alt="AlphaData"
                className={cn(
                  "transition-all duration-500",
                  isCollapsed ? "h-7 w-7 object-contain" : "h-8 w-auto"
                )}
              />
            </motion.div>
            
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col"
                >
                  <span className="text-xl font-black text-white tracking-tighter leading-none">
                    ALPHADATA
                  </span>
                  <span className="text-[10px] font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent tracking-[0.2em] mt-1">
                    ANALYTICS
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close Button - Mobile Only */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN NAVIGATION
          ═══════════════════════════════════════════════════════════════ */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar py-2 relative z-10">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 mb-4"
            >
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Menu Principal
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {filteredNavItems.map((item, index) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={activeItem === item.href}
            isCollapsed={isCollapsed}
            index={index}
            onMobileClick={() => setIsMobileOpen(false)}
          />
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 mt-auto border-t border-gray-800/50 space-y-1.5 bg-black/40 backdrop-blur-sm relative z-10">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 mb-3"
            >
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                Sistema
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {bottomNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative border",
              activeItem === item.href
                ? "bg-gray-800/50 text-white border-gray-700"
                : "text-gray-500 hover:text-white hover:bg-gray-800/30 border-transparent hover:border-gray-800"
            )}
          >
            <item.icon className={cn(
              "w-4.5 h-4.5 flex-shrink-0 transition-all",
              activeItem === item.href 
                ? "text-red-400" 
                : "group-hover:text-white group-hover:scale-110"
            )} />
            
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50">
                    {item.badge}
                  </span>
                )}
              </div>
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border border-gray-800 shadow-xl">
                {item.label}
              </div>
            )}
          </a>
        ))}

        {/* Help & Support Card */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-br from-red-900/20 via-gray-900/50 to-blue-900/20 border border-red-800/30 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-blue-500">
                  <HelpCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-black text-white">Suporte 24/7</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                Precisa de ajuda? Nossa equipe está pronta para auxiliar.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-[10px] font-black bg-gradient-to-r from-red-900/50 to-blue-900/50 border-red-800/50 text-white hover:from-red-800 hover:to-blue-800 hover:border-red-700 transition-all shadow-lg hover:shadow-red-900/50"
              >
                CENTRAL DE AJUDA
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center gap-3 px-4 py-3 mt-2 w-full rounded-xl text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-900/50 border border-transparent hover:border-gray-800 transition-all duration-300 group"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.div
                  key="expand"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapse"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-xs uppercase tracking-widest"
              >
                Recolher Menu
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CUSTOM SCROLLBAR STYLES
          ═══════════════════════════════════════════════════════════════ */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </motion.aside>
    </>
  );
}