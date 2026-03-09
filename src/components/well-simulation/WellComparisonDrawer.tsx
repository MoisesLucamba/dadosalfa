import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ResponsiveContainer,
} from "recharts";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type WellData = {
  id: string;
  name: string;
  prod: number;
  bhp: number;
  api: number;
  wcut: number;
  gor: number;
  prob: number;
  [key: string]: any;
};

const METRICS = [
  { key: "prod", label: "Produção", unit: "bbl/d", max: 30000 },
  { key: "bhp", label: "BHP", unit: "bar", max: 6000 },
  { key: "api", label: "API Gravity", unit: "°", max: 50 },
  { key: "wcut", label: "Water Cut", unit: "%", max: 100, invert: true },
  { key: "gor", label: "GOR", unit: "scf/bbl", max: 1000, invert: true },
  { key: "prob", label: "Sucesso", unit: "%", max: 100 },
];

function MetricBar({ label, unit, valueL, valueR, max, invert }: {
  label: string; unit: string; valueL: number; valueR: number; max: number; invert?: boolean;
}) {
  const better = invert ? (valueL < valueR ? "L" : valueL > valueR ? "R" : "T") : (valueL > valueR ? "L" : valueL < valueR ? "R" : "T");
  const colL = better === "L" ? "#00e5a0" : better === "T" ? "#6a9ec4" : "#ffb830";
  const colR = better === "R" ? "#00e5a0" : better === "T" ? "#6a9ec4" : "#ffb830";

  return (
    <div className="mb-3">
      <p className="text-[8px] text-[#3a6a8a] font-mono tracking-wider mb-1 uppercase">{label} ({unit})</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between mb-0.5">
            <span className="text-[10px] font-bold font-mono" style={{ color: colL }}>{valueL.toLocaleString()}</span>
          </div>
          <div className="h-[3px] bg-[#0a1830] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((valueL / max) * 100, 100)}%`, background: colL }} />
          </div>
        </div>
        <span className="text-[8px] text-[#1a3a5a] font-mono">vs</span>
        <div className="flex-1">
          <div className="flex justify-end mb-0.5">
            <span className="text-[10px] font-bold font-mono" style={{ color: colR }}>{valueR.toLocaleString()}</span>
          </div>
          <div className="h-[3px] bg-[#0a1830] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ml-auto" style={{ width: `${Math.min((valueR / max) * 100, 100)}%`, background: colR }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WellComparisonDrawer({ open, onClose, wellLeft, allWells }: {
  open: boolean;
  onClose: () => void;
  wellLeft: WellData;
  allWells: WellData[];
}) {
  const others = allWells.filter(w => w.id !== wellLeft.id);
  const [rightId, setRightId] = useState(others[0]?.id || "");
  const wellRight = allWells.find(w => w.id === rightId) || others[0];

  const radarData = METRICS.map(m => ({
    subject: m.label,
    A: Math.round(((wellLeft as any)[m.key] / m.max) * 100),
    B: wellRight ? Math.round(((wellRight as any)[m.key] / m.max) * 100) : 0,
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-[#020913] border-t border-[#0a2040] rounded-t-2xl shadow-2xl shadow-black/60 max-h-[80vh] overflow-y-auto"
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 rounded-full bg-[#0a2040]" />
          </div>

          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-bold font-mono text-[#b4d4f4] tracking-widest uppercase">Comparação de Poços</h3>
              <button onClick={onClose} className="text-[#3a6a8a] hover:text-[#ff4365] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4 items-end">
              <div className="text-center">
                <p className="text-[10px] text-[#00a8ff] font-mono font-bold">{wellLeft.name}</p>
                <p className="text-[8px] text-[#2a5272] font-mono">{wellLeft.block}</p>
              </div>
              <span className="text-[8px] text-[#1a3a5a] font-mono">VS</span>
              <div className="text-center">
                <Select value={rightId} onValueChange={setRightId}>
                  <SelectTrigger className="bg-[#030d20] border-[#0a2040] text-[#F5A623] font-mono text-[10px] h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#030d20] border-[#0a2040]">
                    {others.map(w => (
                      <SelectItem key={w.id} value={w.id} className="font-mono text-[#b4d4f4] text-[10px]">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-6">
              {wellRight && METRICS.map(m => (
                <MetricBar
                  key={m.key}
                  label={m.label}
                  unit={m.unit}
                  valueL={(wellLeft as any)[m.key]}
                  valueR={(wellRight as any)[m.key]}
                  max={m.max}
                  invert={m.invert}
                />
              ))}
            </div>

            {/* Radar chart */}
            {wellRight && (
              <div>
                <p className="text-[9px] text-[#2a5272] tracking-widest uppercase font-mono mb-2">Perfil Comparativo</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                    <PolarGrid stroke="rgba(0,60,100,0.6)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: "#3a6a8a", fontFamily: "Courier New" }} />
                    <PolarRadiusAxis angle={30} tick={{ fontSize: 6, fill: "#1a3a5a" }} domain={[0, 100]} />
                    <Radar name={wellLeft.name} dataKey="A" stroke="#00a8ff" fill="#00a8ff" fillOpacity={0.12} strokeWidth={2} />
                    <Radar name={wellRight.name} dataKey="B" stroke="#F5A623" fill="#F5A623" fillOpacity={0.08} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 8, fontFamily: "Courier New", color: "#3a6a8a" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
