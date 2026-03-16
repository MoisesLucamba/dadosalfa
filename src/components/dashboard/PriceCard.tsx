import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceCardProps {
  name: string;
  price: number;
  change: number;
  currency?: string;
  delay?: number;
}

export function PriceCard({
  name,
  price,
  change,
  currency = "USD",
  delay = 0,
}: PriceCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? "#4ade80" : "#f87171";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      className="group relative flex items-center justify-between px-4 py-3 overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "4px",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        transition: "border-color 0.15s",
        cursor: "default",
      }}
      onMouseEnter={e =>
        ((e.currentTarget as HTMLElement).style.borderColor =
          "rgba(220,38,38,0.2)")
      }
      onMouseLeave={e =>
        ((e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.06)")
      }
    >
      {/* Left accent on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: changeColor }}
      />

      {/* Name + price */}
      <div>
        <p
          className="text-[9px] font-bold tracking-[0.2em] mb-1"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {name.toUpperCase()}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{
              color: "hsl(var(--foreground))",
              letterSpacing: "-0.02em",
            }}
          >
            ${price.toFixed(2)}
          </span>
          <span
            className="text-[9px] font-bold tracking-wider"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {currency}/BBL
          </span>
        </div>
      </div>

      {/* Change badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wider"
        style={{
          background: `${changeColor}12`,
          border: `1px solid ${changeColor}28`,
          color: changeColor,
        }}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
    </motion.div>
  );
}