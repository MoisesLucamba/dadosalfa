import { useState } from "react";
import { Database, Info } from "lucide-react";
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

  const colorClass =
    years >= 5
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : years >= 2
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20";

  const defaultSource =
    "Source: ANPG Annual Reports, Sonangol Production Data, OPEC Statistical Bulletin";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-help transition-all duration-200 hover:opacity-80 ${colorClass}`}
          >
            <Database className="w-3 h-3" />
            <span className="font-mono">
              {startYear}–{endYear} ({years} {years === 1 ? "ano" : "anos"})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs bg-popover border border-border shadow-xl p-3"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Profundidade de Dados Históricos</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {source || defaultSource}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
