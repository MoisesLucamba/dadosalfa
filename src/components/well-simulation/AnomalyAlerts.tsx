import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

type WellData = {
  name: string;
  bhp: number;
  gor: number;
  wcut: number;
  temp: number;
  [key: string]: any;
};

const NORMAL_RANGES: Record<string, { min: number; max: number; label: string; unit: string }> = {
  bhp: { min: 3800, max: 4800, label: "BHP", unit: "bar" },
  gor: { min: 300, max: 600, label: "GOR", unit: "scf/bbl" },
  wcut: { min: 0, max: 15, label: "W-Cut", unit: "%" },
  temp: { min: 150, max: 200, label: "TEMP", unit: "°C" },
};

export type AnomalyStatus = "green" | "amber" | "red";

export function getMetricStatus(key: string, value: number): AnomalyStatus {
  const range = NORMAL_RANGES[key];
  if (!range) return "green";
  const threshold = 0.15;
  const span = range.max - range.min;
  if (value < range.min || value > range.max) return "red";
  if (value < range.min + span * threshold || value > range.max - span * threshold) return "amber";
  return "green";
}

const STATUS_COLORS: Record<AnomalyStatus, string> = {
  green: "#00e5a0",
  amber: "#ffb830",
  red: "#ff4365",
};

export function AnomalyDot({ status }: { status: AnomalyStatus }) {
  return (
    <span className="relative inline-flex">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ background: STATUS_COLORS[status] }}
      />
      {status === "red" && (
        <motion.span
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute inset-0 w-2 h-2 rounded-full"
          style={{ background: STATUS_COLORS.red }}
        />
      )}
    </span>
  );
}

export function AnomalyBanner({ well }: { well: WellData }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts = Object.entries(NORMAL_RANGES)
    .filter(([key]) => getMetricStatus(key, well[key]) === "red" && !dismissed.includes(key))
    .map(([key, range]) => ({
      key,
      label: range.label,
      value: well[key],
      limit: well[key] < range.min ? range.min : range.max,
      unit: range.unit,
    }));

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      {alerts.map(a => (
        <motion.div
          key={a.key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-3 px-4 py-2 rounded-lg border"
          style={{
            background: "rgba(232,25,44,0.12)",
            borderColor: "rgba(232,25,44,0.30)",
          }}
        >
          <AlertTriangle className="w-4 h-4 text-[#ff4365] flex-shrink-0" />
          <span className="text-[10px] text-[#ff8a9a] font-mono flex-1">
            Anomalia detectada em <b className="text-[#ff4365]">{a.label}</b> — {well.name} · Valor: <b>{a.value}{a.unit}</b> · Limite: {a.limit}{a.unit}
          </span>
          <button onClick={() => setDismissed(d => [...d, a.key])} className="text-[#ff4365]/60 hover:text-[#ff4365] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
