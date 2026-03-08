import { motion } from "framer-motion";

interface DataTimelineSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
}

const DEFAULT_OPTIONS = [
  { label: "1Y", value: "1" },
  { label: "3Y", value: "3" },
  { label: "5Y", value: "5" },
  { label: "MAX", value: "max" },
];

export const DataTimelineSelector = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: DataTimelineSelectorProps) => {
  return (
    <div className="flex items-center bg-secondary/50 dark:bg-white/[0.04] rounded-lg p-0.5 border border-border/50">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors duration-200 ${
            value === opt.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="timeline-active"
              className="absolute inset-0 bg-background dark:bg-white/10 rounded-md border border-border/50 shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 font-mono">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};
