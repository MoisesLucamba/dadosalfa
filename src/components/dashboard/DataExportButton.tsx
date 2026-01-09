import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const presetRanges = [
  { label: "Últimos 7 dias", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Últimos 30 dias", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Este mês", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Últimos 3 meses", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: "Últimos 6 meses", getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: "Último ano", getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: "Todos os dados", getValue: () => ({ from: undefined, to: undefined }) },
];

export const DataExportButton = ({
  data,
  columns,
  filename,
  dateField,
  variant = "outline",
  size = "default",
  className,
}: DataExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [showCalendar, setShowCalendar] = useState(false);

  const handleExport = (exportFormat: 'csv' | 'excel') => {
    try {
      // Filter data by date if dateField is provided
      let filteredData = data;
      if (dateField && (dateRange.from || dateRange.to)) {
        filteredData = filterDataByDateRange(data, dateField, dateRange.from, dateRange.to);
      }

      if (filteredData.length === 0) {
        toast.error("Nenhum dado para exportar no período selecionado");
        return;
      }

      // Generate filename with date range
      let exportFilename = filename;
      if (dateRange.from && dateRange.to) {
        exportFilename += `_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
      } else if (dateRange.from) {
        exportFilename += `_desde_${format(dateRange.from, 'yyyy-MM-dd')}`;
      } else if (dateRange.to) {
        exportFilename += `_ate_${format(dateRange.to, 'yyyy-MM-dd')}`;
      }

      exportData({
        filename: exportFilename,
        columns,
        data: filteredData,
        format: exportFormat,
      });

      toast.success(`Exportado ${filteredData.length} registros em ${exportFormat.toUpperCase()}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erro ao exportar dados");
    }
  };

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    setDateRange(preset.getValue());
    setShowCalendar(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={cn("gap-2", className)}>
          <Download className="w-4 h-4" />
          {size !== "icon" && "Exportar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Exportar Dados</h4>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Date Range Selection */}
          {dateField && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Período
              </label>
              
              {/* Preset buttons */}
              <div className="grid grid-cols-2 gap-2">
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-xs h-8",
                      dateRange.from === preset.getValue().from && 
                      dateRange.to === preset.getValue().to && 
                      "border-primary bg-primary/10"
                    )}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom date range */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar className="w-3 h-3" />
                {dateRange.from && dateRange.to ? (
                  <span className="text-xs">
                    {format(dateRange.from, "dd/MM/yyyy", { locale: pt })} - {format(dateRange.to, "dd/MM/yyyy", { locale: pt })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Período personalizado</span>
                )}
              </Button>

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
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={1}
                      locale={pt}
                      className="rounded-md border pointer-events-auto"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Export Format Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Formato
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                className="gap-2 h-12 flex-col"
                onClick={() => handleExport('csv')}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">CSV</span>
              </Button>
              <Button
                variant="default"
                className="gap-2 h-12 flex-col bg-success hover:bg-success/90"
                onClick={() => handleExport('excel')}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-xs">Excel</span>
              </Button>
            </div>
          </div>

          {/* Data count */}
          <p className="text-xs text-muted-foreground text-center">
            {data.length} registros disponíveis
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
