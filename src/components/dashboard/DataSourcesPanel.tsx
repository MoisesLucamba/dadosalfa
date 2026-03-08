import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Download, Database, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataSource {
  name: string;
  source: string;
  lastUpdated: string;
  startYear: number;
  endYear: number;
}

const ANGOLA_DATA_SOURCES: DataSource[] = [
  { name: "Dados de Produção", source: "ANPG / Sonangol", lastUpdated: "2025-02-28", startYear: 2018, endYear: 2025 },
  { name: "Preço Brent (Correlação)", source: "ICE / Reuters", lastUpdated: "2025-03-07", startYear: 2015, endYear: 2025 },
  { name: "Índice Regulatório", source: "ANPG / Diário da República", lastUpdated: "2025-01-15", startYear: 2019, endYear: 2025 },
  { name: "Risco Geopolítico", source: "EIU / ICRG", lastUpdated: "2025-02-20", startYear: 2017, endYear: 2025 },
  { name: "Termos Fiscais por Bloco", source: "ANPG / Contratos PSA", lastUpdated: "2024-12-31", startYear: 2010, endYear: 2025 },
];

export const DataSourcesPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const maxRange = Math.max(...ANGOLA_DATA_SOURCES.map((d) => d.endYear)) - Math.min(...ANGOLA_DATA_SOURCES.map((d) => d.startYear));
  const minStart = Math.min(...ANGOLA_DATA_SOURCES.map((d) => d.startYear));

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-foreground">Fontes de Dados</h4>
            <p className="text-[11px] text-muted-foreground">{ANGOLA_DATA_SOURCES.length} datasets • Angola</p>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 p-4 space-y-4">
              {ANGOLA_DATA_SOURCES.map((ds, i) => {
                const barStart = ((ds.startYear - minStart) / maxRange) * 100;
                const barWidth = ((ds.endYear - ds.startYear) / maxRange) * 100;
                const years = ds.endYear - ds.startYear;
                const barColor =
                  years >= 5
                    ? "bg-emerald-500"
                    : years >= 2
                    ? "bg-amber-500"
                    : "bg-red-500";

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{ds.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ds.source}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {ds.startYear}–{ds.endYear}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Atualizado: {new Date(ds.lastUpdated).toLocaleDateString("pt")}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{
                          marginLeft: `${barStart}%`,
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Year scale */}
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50 pt-1">
                <span>{minStart}</span>
                <span>{minStart + Math.floor(maxRange / 2)}</span>
                <span>{minStart + maxRange}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs rounded-lg"
                onClick={() => {
                  const blob = new Blob(
                    [
                      "Fontes de Dados — AlphaData Angola\n\n" +
                        ANGOLA_DATA_SOURCES.map(
                          (ds) =>
                            `${ds.name}\nFonte: ${ds.source}\nCobertura: ${ds.startYear}–${ds.endYear}\nÚltima atualização: ${ds.lastUpdated}\n`
                        ).join("\n"),
                    ],
                    { type: "text/plain" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "alphadata-data-sources.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-3 h-3 mr-2" />
                Exportar Metodologia
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
