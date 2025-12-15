import { motion } from "framer-motion";
import { Ship, MapPin } from "lucide-react";

const exportDestinations = [
  { country: "China", percentage: 62, volume: "28.5M bbl", color: "bg-primary" },
  { country: "Índia", percentage: 15, volume: "6.9M bbl", color: "bg-accent" },
  { country: "Europa", percentage: 12, volume: "5.5M bbl", color: "bg-success" },
  { country: "EUA", percentage: 8, volume: "3.7M bbl", color: "bg-purple-500" },
  { country: "Outros", percentage: 3, volume: "1.4M bbl", color: "bg-muted-foreground" },
];

export function ExportsMap() {
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
          <p className="text-sm text-muted-foreground">Novembro 2024</p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Ship className="w-5 h-5" />
          <span className="text-sm font-medium">46M bbl</span>
        </div>
      </div>

      <div className="space-y-4">
        {exportDestinations.map((dest, index) => (
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
    </motion.div>
  );
}
