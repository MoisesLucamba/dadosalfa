import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Clock, Database } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: React.ReactNode;
  delay?: number;
  variant?: "default" | "accent" | "primary";
  lastUpdate?: string;
  source?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = "VS. ANTERIOR",
  icon,
  delay = 0,
  variant = "default",
  lastUpdate,
  source,
  className,
}: KPICardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral  = change === 0;

  const accentColor =
    variant === "accent"  ? "#f59e0b" :
    variant === "primary" ? "#dc2626" : "#3b82f6";

  const changeColor =
    isPositive ? "#4ade80" :
    isNegative ? "#f87171" : "hsl(var(--muted-foreground))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={`relative overflow-hidden rounded group ${className ?? ""}`}
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}28`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
    >
      {/* Corner tag — accent color */}
      <div
        className="absolute top-0 right-0 text-[7px] font-bold px-2 py-0.5"
        style={{ background: `${accentColor}14`, color: accentColor, borderBottomLeftRadius: "4px" }}
      >
        {variant === "accent" ? "MKT" : variant === "primary" ? "OPS" : "SYS"}
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="relative z-10 p-5">
        {/* Top row: icon + source meta */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-[9px] font-bold tracking-[0.2em] mb-1.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {title.toUpperCase()}
            </p>

            {(lastUpdate || source) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      {source && (
                        <span
                          className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}
                        >
                          <Database className="w-2.5 h-2.5" />
                          {source}
                        </span>
                      )}
                      {lastUpdate && (
                        <span
                          className="flex items-center gap-1 text-[8px]"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {lastUpdate}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "4px",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    <div className="text-[10px] space-y-1">
                      {source     && <p style={{ color: "hsl(var(--muted-foreground))" }}>FONTE: <span style={{ color: "hsl(var(--foreground))" }}>{source}</span></p>}
                      {lastUpdate && <p style={{ color: "hsl(var(--muted-foreground))" }}>UPD: <span style={{ color: "hsl(var(--foreground))" }}>{lastUpdate}</span></p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Icon */}
          <div
            className="w-8 h-8 flex items-center justify-center rounded shrink-0"
            style={{ background: `${accentColor}12`, color: accentColor }}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div
          className="text-[28px] font-bold tabular-nums mb-3"
          style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em", lineHeight: 1 }}
        >
          {value}
        </div>

        {/* Change badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded"
            style={{
              background: `${changeColor}14`,
              border: `1px solid ${changeColor}28`,
              color: changeColor,
            }}
          >
            {isPositive && <TrendingUp  className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isNeutral  && <Minus        className="w-3 h-3" />}
            {isPositive ? "+" : ""}{change}%
          </span>
          <span className="text-[9px] tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
            {changeLabel.toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}