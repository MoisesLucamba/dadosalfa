import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Brain,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

interface TabItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const tabItems: TabItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BarChart3, label: "Produção", href: "/production" },
  { icon: DollarSign, label: "Preços", href: "/prices" },
  { icon: Brain, label: "IA", href: "/predictions" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Check if current path is one of the main tabs or "more" section
  const isMoreActive = !["/", "/production", "/prices", "/predictions"].includes(currentPath);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              </motion.div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* More button for other pages */}
        <button
          onClick={() => navigate("/exports")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-colors",
            isMoreActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isMoreActive && (
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
          )}
          <motion.div
            animate={{ scale: isMoreActive ? 1.1 : 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "text-primary")} />
          </motion.div>
          <span className={cn(
            "text-[10px] mt-1 font-medium",
            isMoreActive ? "text-primary" : "text-muted-foreground"
          )}>
            Mais
          </span>
        </button>
      </div>
    </motion.nav>
  );
}
