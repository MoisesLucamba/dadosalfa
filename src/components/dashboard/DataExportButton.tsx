import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Calendar, X, Terminal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { exportData, ExportColumn, filterDataByDateRange } from "@/utils/exportData";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DataExportButtonProps {
  data: Record<string, any>[];
  columns: ExportColumn[];
  filename: string;
  dateField?: string;
  className?: string;
}

const presetRanges = [
  { label: "7D",   getValue: () => ({ from: subDays(new Date(), 7),    to: new Date() }) },
  { label: "30D",  getValue: () => ({ from: subDays(new Date(), 30),   to: new Date() }) },
  { label: "MÊS",  getValue: () => ({ from: startOfMonth(new Date()),  to: endOfMonth(new Date()) }) },
  { label: "3M",   getValue: () => ({ from: subMonths(new Date(), 3),  to: new Date() }) },
  { label: "6M",   getValue: () => ({ from: subMonths(new Date(), 6),  to: new Date() }) },
  { label: "1A",   getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: "TUDO", getValue: () => ({ from: undefined, to: undefined }) },
];

export const DataExportButton = ({
  data,
  columns,
  filename,
  dateField,
  className,
}: DataExportButtonProps) => {
  const [isOpen, setIsOpen]             = useState(false);
  const [dateRange, setDateRange]       = useState<DateRange>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleExport = (exportFormat: "csv" | "excel") => {
    try {
      let filteredData = data;
      if (dateField && (dateRange.from || dateRange.to)) {
        filteredData = filterDataByDateRange(data, dateField, dateRange.from, dateRange.to);
      }
      if (!filteredData.length) {
        toast.error("NENHUM DADO NO PERÍODO SELECCIONADO");
        return;
      }
      let exportFilename = filename;
      if (dateRange.from && dateRange.to) {
        exportFilename += `_${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}`;
      }
      exportData({ filename: exportFilename, columns, data: filteredData, format: exportFormat });
      toast.success(`EXPORT ${exportFormat.toUpperCase()} // ${filteredData.length} REGISTOS`);
      setIsOpen(false);
    } catch {
      toast.error("EXPORT FAILED");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all ${className ?? ""}`}
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            color: "hsl(var(--muted-foreground))",
            background: "transparent",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)";
            (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
          }}
        >
          <Download className="w-3.5 h-3.5" />
          EXPORTAR
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-0"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              EXPORTAR DADOS
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-5 h-5 flex items-center justify-center rounded transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date presets */}
          {dateField && (
            <div className="space-y-2">
              <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                PERÍODO
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {presetRanges.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setDateRange(preset.getValue());
                      setActivePreset(preset.label);
                      setShowCalendar(false);
                    }}
                    className="py-1.5 rounded text-[9px] font-bold tracking-wider transition-all"
                    style={{
                      background: activePreset === preset.label ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${activePreset === preset.label ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: activePreset === preset.label ? "#f87171" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-[9px] font-bold tracking-wider transition-all"
                style={{
                  background: showCalendar ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <Calendar className="w-3 h-3" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM/yy")} → ${format(dateRange.to, "dd/MM/yy")}`
                  : "PERÍODO PERSONALIZADO"
                }
              </button>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={range => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={1}
                      locale={pt}
                      className="rounded border pointer-events-auto"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Format buttons */}
          <div className="space-y-2">
            <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              FORMATO
            </span>
            <div className="grid grid-cols-2 gap-2">
              {([
                { fmt: "csv"   as const, Icon: FileText,        label: "CSV",   color: "#60a5fa" },
                { fmt: "excel" as const, Icon: FileSpreadsheet, label: "EXCEL", color: "#4ade80" },
              ] as const).map(({ fmt, Icon, label, color }) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="flex flex-col items-center gap-2 py-4 rounded text-[9px] font-bold tracking-widest transition-all"
                  style={{ background: `${color}0d`, border: `1px solid ${color}22`, color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}1a`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}0d`; }}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div
            className="text-center text-[9px] font-bold tabular-nums"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {data.length} REGISTOS DISPONÍVEIS
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};