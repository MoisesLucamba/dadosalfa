import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Zap, MoreVertical, Radio } from "lucide-react";
import { useProductionData } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Operator {
  name: string;
  blocks: string;
  production: number;
  change: number;
  share: number;
}

const fallbackOperators: Operator[] = [
  { name: "TOTALENERGIES",  blocks: "17, 32",   production: 385, change: -2.4, share: 34.2 },
  { name: "EXXONMOBIL",     blocks: "15",        production: 245, change:  1.8, share: 21.8 },
  { name: "CHEVRON",        blocks: "0, 14",     production: 198, change: -0.5, share: 17.6 },
  { name: "BP",             blocks: "18, 31",    production: 156, change:  3.2, share: 13.9 },
  { name: "SONANGOL EP",    blocks: "DIVERSOS",  production: 141, change: -1.2, share: 12.5 },
];

const changeColor = (v: number) => (v >= 0 ? "#4ade80" : "#f87171");

export function OperatorsTable() {
  const { data: productionData, isLoading, refetch } = useProductionData();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const verifyWithAI = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-market-data", { body: { type: "operators" } });
      if (error) throw error;
      if (data?.success) {
        toast.success("DADOS VERIFICADOS // IA OK");
      } else throw new Error(data?.error);
    } catch (e: any) {
      toast.error(`VERIFICAÇÃO FALHADA — ${e.message || "Tentar novamente"}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const operators = useMemo(() => {
    if (!productionData?.length) return fallbackOperators;
    const map = new Map<string, { blocks: Set<string>; totalProd: number; decline: number }>();
    productionData.forEach(item => {
      const e = map.get(item.operator);
      if (e) {
        e.blocks.add(item.block);
        e.totalProd += Number(item.daily_production) / 1000;
        e.decline = Number(item.decline_rate) || 0;
      } else {
        map.set(item.operator, { blocks: new Set([item.block]), totalProd: Number(item.daily_production) / 1000, decline: Number(item.decline_rate) || 0 });
      }
    });
    const total = Array.from(map.values()).reduce((s, o) => s + o.totalProd, 0);
    return Array.from(map.entries())
      .map(([name, d]) => ({
        name: name.toUpperCase(),
        blocks: Array.from(d.blocks).join(", "),
        production: Math.round(d.totalProd),
        change: -d.decline,
        share: total > 0 ? (d.totalProd / total) * 100 : 0,
      }))
      .sort((a, b) => b.production - a.production)
      .slice(0, 5);
  }, [productionData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="rounded overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-red-500" />
          <div>
            <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              TOP OPERADORES // PRODUÇÃO ANGOLA
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-6 h-6 flex items-center justify-center rounded transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <DropdownMenuItem
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-[10px] font-bold tracking-wider cursor-pointer focus:bg-secondary"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              ACTUALIZAR DADOS
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={verifyWithAI}
              disabled={isVerifying}
              className="text-[10px] font-bold tracking-wider cursor-pointer focus:bg-secondary"
            >
              <Zap className={`w-3 h-3 mr-2 ${isVerifying ? "animate-pulse" : ""}`} />
              VERIFICAR COM IA
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table col headers */}
      <div
        className="grid px-5 py-2.5 text-[9px] font-bold tracking-[0.2em]"
        style={{
          gridTemplateColumns: "1fr 80px 80px 80px 60px",
          background: "rgba(255,255,255,0.015)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <span>OPERADOR</span>
        <span>BLOCOS</span>
        <span className="text-right">KBD</span>
        <span className="text-right">VAR.</span>
        <span className="text-right">QUOTA</span>
      </div>

      {/* Rows */}
      <div>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            CARREGANDO DADOS...
          </div>
        ) : (
          operators.map((op, i) => (
            <motion.div
              key={op.name}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.04 }}
              onMouseEnter={() => setHoveredRow(op.name)}
              onMouseLeave={() => setHoveredRow(null)}
              className="grid px-5 py-3.5 relative transition-colors"
              style={{
                gridTemplateColumns: "1fr 80px 80px 80px 60px",
                alignItems: "center",
                borderBottom: i < operators.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: hoveredRow === op.name ? "rgba(255,255,255,0.025)" : "transparent",
              }}
            >
              {hoveredRow === op.name && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: changeColor(op.change) }} />
              )}

              {/* Name */}
              <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                {op.name}
              </span>

              {/* Blocks */}
              <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                BLK {op.blocks}
              </span>

              {/* Production */}
              <span className="text-[11px] font-bold tabular-nums text-right" style={{ color: "hsl(var(--foreground))" }}>
                {op.production}
              </span>

              {/* Change */}
              <div className="flex items-center justify-end gap-1">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums"
                  style={{
                    background: `${changeColor(op.change)}14`,
                    border: `1px solid ${changeColor(op.change)}28`,
                    color: changeColor(op.change),
                  }}
                >
                  {op.change >= 0
                    ? <TrendingUp className="w-2.5 h-2.5" />
                    : <TrendingDown className="w-2.5 h-2.5" />
                  }
                  {op.change >= 0 ? "+" : ""}{op.change.toFixed(1)}%
                </span>
              </div>

              {/* Share */}
              <span className="text-[10px] font-bold tabular-nums text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                {op.share.toFixed(1)}%
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}