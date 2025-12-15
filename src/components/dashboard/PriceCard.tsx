import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  name: string;
  price: number;
  change: number;
  currency?: string;
  delay?: number;
}

export function PriceCard({ name, price, change, currency = "USD", delay = 0 }: PriceCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">{name}</p>
        <p className="text-xl font-bold text-foreground">
          ${price.toFixed(2)}
          <span className="text-xs font-normal text-muted-foreground ml-1">{currency}/bbl</span>
        </p>
      </div>

      <div
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium",
          isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}
      >
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span>{isPositive ? "+" : ""}{change.toFixed(2)}%</span>
      </div>
    </motion.div>
  );
}
