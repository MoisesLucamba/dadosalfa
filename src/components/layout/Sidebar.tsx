import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BarChart3, label: "Produção", href: "/production" },
  { icon: DollarSign, label: "Preços & Mercado", href: "/prices" },
  { icon: Ship, label: "Exportações", href: "/exports" },
  { icon: Brain, label: "Previsões IA", href: "/predictions", badge: "AI" },
  { icon: AlertTriangle, label: "Risco", href: "/risk" },
  { icon: FileText, label: "Relatórios", href: "/reports" },
  { icon: Search, label: "Pesquisa", href: "/search" },
];

const bottomNavItems: NavItem[] = [
  { icon: Bell, label: "Alertas", href: "/alerts", badge: "3" },
  { icon: CreditCard, label: "Planos", href: "/pricing" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

interface SidebarProps {
  activeItem?: string;
}

export function Sidebar({ activeItem = "/" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "h-screen flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hidden lg:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src={alphadataLogo}
            alt="AlphaData"
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-8 w-auto" : "h-10 w-auto"
            )}
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item, index) => (
          <motion.a
            key={item.href}
            href={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              activeItem === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {activeItem === item.href && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
              />
            )}
            <item.icon className={cn("w-5 h-5 flex-shrink-0", activeItem === item.href && "text-primary")} />
            {!isCollapsed && (
              <>
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </motion.a>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border/50 space-y-1">
        {bottomNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              activeItem === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        ))}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
