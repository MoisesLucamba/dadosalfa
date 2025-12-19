import { motion } from "framer-motion";
import { Ship, MapPin, Globe } from "lucide-react";
import { useExportData } from "@/hooks/useData";
import { useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const fallbackDestinations = [
  { country: "China", percentage: 62, volume: "28.5M bbl", color: "bg-primary" },
  { country: "Índia", percentage: 15, volume: "6.9M bbl", color: "bg-accent" },
  { country: "Europa", percentage: 12, volume: "5.5M bbl", color: "bg-success" },
  { country: "EUA", percentage: 8, volume: "3.7M bbl", color: "bg-purple-500" },
  { country: "Outros", percentage: 3, volume: "1.4M bbl", color: "bg-muted-foreground" },
];

const colorClasses = [
  "bg-primary",
  "bg-accent", 
  "bg-[hsl(var(--success))]",
  "bg-purple-500",
  "bg-muted-foreground"
];

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M bbl`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(0)}K bbl`;
  }
  return `${volume.toFixed(0)} bbl`;
}

export function ExportsMap() {
  const { data: exportData, isLoading } = useExportData();

  const { destinations, totalVolume, currentPeriod } = useMemo(() => {
    if (!exportData || exportData.length === 0) {
      return {
        destinations: fallbackDestinations,
        totalVolume: 46000000,
        currentPeriod: "Novembro 2024"
      };
    }

    // Get current month data
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthData = exportData.filter(e => e.data_date.startsWith(currentMonth));
    
    // If no current month data, use latest available month
    const dataToUse = currentMonthData.length > 0 
      ? currentMonthData 
      : exportData.slice(0, Math.min(20, exportData.length));

    // Get the period label
    const latestDate = dataToUse[0]?.data_date;
    const periodLabel = latestDate 
      ? format(new Date(latestDate), "MMMM yyyy", { locale: pt })
      : "Período atual";

    // Group by destination
    const destinationMap = new Map<string, number>();
    dataToUse.forEach(item => {
      const current = destinationMap.get(item.destination) || 0;
      destinationMap.set(item.destination, current + Number(item.volume || 0));
    });

    const total = Array.from(destinationMap.values()).reduce((sum, v) => sum + v, 0);

    const sortedDestinations = Array.from(destinationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, volume], index) => ({
        country,
        percentage: total > 0 ? Math.round((volume / total) * 100) : 0,
        volume: formatVolume(volume),
        color: colorClasses[index] || "bg-muted-foreground"
      }));

    return {
      destinations: sortedDestinations.length > 0 ? sortedDestinations : fallbackDestinations,
      totalVolume: total,
      currentPeriod: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)
    };
  }, [exportData]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 p-6 card-gradient"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const hasData = destinations.some(d => d.percentage > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border/50 p-6 card-gradient"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Destinos de Exportação</h3>
          <p className="text-sm text-muted-foreground">{currentPeriod}</p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Ship className="w-5 h-5" />
          <span className="text-sm font-medium">{formatVolume(totalVolume)}</span>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sem dados de exportação disponíveis</p>
          <p className="text-xs mt-1">Adicione dados no painel administrativo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {destinations.map((dest, index) => (
            <motion.div
              key={dest.country}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{dest.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{dest.volume}</span>
                  <span className="text-sm font-semibold text-foreground">{dest.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dest.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  className={`h-full rounded-full ${dest.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
