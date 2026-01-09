import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  delay?: number;
  variant?: "default" | "accent" | "primary";
  lastUpdate?: string;
  source?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  delay = 0,
  variant = "default",
  lastUpdate,
  source,
}: KPICardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 p-5 card-gradient",
        variant === "accent" && "border-accent/30 glow-accent",
        variant === "primary" && "border-primary/30 glow-primary"
      )}
    >
      {/* Background Gradient Effect */}
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10",
          variant === "accent" ? "bg-accent" : "bg-primary"
        )}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {/* Source and Last Update Indicator */}
            {(lastUpdate || source) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 mt-1 cursor-help">
                      {source && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
                          <Database className="w-2.5 h-2.5" />
                          {source}
                        </span>
                      )}
                      {lastUpdate && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                          <Clock className="w-2.5 h-2.5" />
                          {lastUpdate}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <div className="space-y-1">
                      {source && <p><strong>Fonte:</strong> {source}</p>}
                      {lastUpdate && <p><strong>Atualização:</strong> {lastUpdate}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-lg",
              variant === "accent"
                ? "bg-accent/10 text-accent"
                : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositive && "bg-success/10 text-success",
                isNegative && "bg-destructive/10 text-destructive",
                isNeutral && "bg-muted text-muted-foreground"
              )}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {isNeutral && <Minus className="w-3 h-3" />}
              <span>{isPositive && "+"}{change}%</span>
            </div>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
