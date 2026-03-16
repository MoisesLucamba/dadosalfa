import { Database } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataDepthBadgeProps {
  startYear: number;
  endYear: number;
  source?: string;
}

export const DataDepthBadge = ({ startYear, endYear, source }: DataDepthBadgeProps) => {
  const years = endYear - startYear;

  const colorStyle =
    years >= 5
      ? { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)"   }
      : years >= 2
      ? { color: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.2)"   }
      : { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)"  };

  const defaultSource =
    "ANPG Annual Reports, Sonangol Production Data, OPEC Statistical Bulletin";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded cursor-help transition-opacity hover:opacity-80"
            style={{
              background: colorStyle.bg,
              border: `1px solid ${colorStyle.border}`,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <Database className="w-3 h-3" style={{ color: colorStyle.color }} />
            <span
              className="text-[9px] font-bold tabular-nums tracking-widest"
              style={{ color: colorStyle.color }}
            >
              {startYear}–{endYear}
            </span>
            <span
              className="text-[8px] font-bold px-1 rounded tracking-widest"
              style={{ background: `${colorStyle.color}18`, color: colorStyle.color }}
            >
              {years}A
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            padding: "10px 14px",
            maxWidth: "280px",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: colorStyle.color }} />
              <p className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                PROFUNDIDADE DE DADOS HISTÓRICOS
              </p>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {source || defaultSource}
            </p>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (years / 10) * 100)}%`,
                  background: colorStyle.color,
                }}
              />
            </div>
            <p className="text-[9px] tabular-nums" style={{ color: colorStyle.color }}>
              {years} {years === 1 ? "ANO" : "ANOS"} DE DADOS VERIFICADOS
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};