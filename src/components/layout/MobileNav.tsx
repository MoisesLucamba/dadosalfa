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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useAdmin";

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-card border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border/50">
            <img
              src={alphadataLogo}
              alt="AlphaData"
              className="h-10 w-auto"
            />
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            {filteredNavItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                  activeItem === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
            {bottomNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  activeItem === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
