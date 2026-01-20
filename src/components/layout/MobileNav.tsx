import { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
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
  Menu,
  X,
  Search,
  CreditCard,
  Shield,
  Building2,
  Users2,
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BarChart3, label: "Produção", href: "/production" },
  { icon: DollarSign, label: "Preços & Mercado", href: "/prices" },
  { icon: Ship, label: "Exportações", href: "/exports" },
  { icon: Building2, label: "Competidores", href: "/competitors" },
  { icon: Brain, label: "Previsões IA", href: "/predictions", badge: "AI" },
  { icon: AlertTriangle, label: "Risco", href: "/risk" },
  { icon: FileText, label: "Relatórios", href: "/reports" },
  { icon: Search, label: "Pesquisa", href: "/search" },
  { icon: Shield, label: "Admin", href: "/admin", badge: "Admin", adminOnly: true },
];

const bottomNavItems: NavItem[] = [
  { icon: Users2, label: "Workspaces", href: "/workspace" },
  { icon: Bell, label: "Alertas", href: "/alerts", badge: "3" },
  { icon: CreditCard, label: "Subscrição", href: "/subscription" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

interface MobileNavProps {
  activeItem?: string;
}

export function MobileNav({ activeItem = "/" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  // Swipe gestures for mobile
  useSwipeGesture({
    onSwipeRight: () => setOpen(true),
    onSwipeLeft: () => setOpen(false),
    threshold: 60,
    edgeWidth: 40,
  });

  // Handle drag to close
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Menu Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar with drag gesture */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -288, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-card shadow-xl lg:hidden touch-pan-y"
          >
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <img
                  src={alphadataLogo}
                  alt="AlphaData"
                  className="h-10 w-auto"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Swipe indicator */}
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Main Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
                {filteredNavItems.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, type: "spring", stiffness: 300 }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative active:scale-[0.98]",
                      activeItem === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:bg-secondary/70"
                    )}
                  >
                    {activeItem === item.href && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                      />
                    )}
                    <item.icon className={cn("w-5 h-5 flex-shrink-0", activeItem === item.href && "text-primary")} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </motion.a>
                ))}
              </nav>

              {/* Bottom Navigation */}
              <div className="p-3 border-t border-border/50 space-y-1">
                {bottomNavItems.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (filteredNavItems.length + index) * 0.03, type: "spring", stiffness: 300 }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 active:scale-[0.98]",
                      activeItem === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:bg-secondary/70"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                        {item.badge}
                      </span>
                    )}
                  </motion.a>
                ))}
              </div>

              {/* Hint text */}
              <div className="p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Deslize para a esquerda para fechar
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
