import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENTS = [
  { date: "2019-03", text: "Perfuração iniciada", category: "Perfuração", color: "#3a6a8a", style: "solid" },
  { date: "2019-11", text: "Completação", category: "Perfuração", color: "#00a8ff", style: "solid" },
  { date: "2020-02", text: "Primeiro óleo", category: "Produção", color: "#00e5a0", style: "solid", star: true },
  { date: "2021-06", text: "Intervenção — substituição de ESP", category: "Intervenção", color: "#ffb830", style: "solid" },
  { date: "2022-09", text: "Pico de produção: 24,200 bbl/d", category: "Produção", color: "#00e5a0", style: "solid" },
  { date: "2023-11", text: "W-Cut aumentou para 8%", category: "Alerta", color: "#ffb830", style: "solid" },
  { date: "2025-01", text: "Workover planeado", category: "Intervenção", color: "#3a6a8a", style: "dashed" },
];

const CAT_COLORS: Record<string, string> = {
  "Perfuração": "#00a8ff",
  "Produção": "#00e5a0",
  "Intervenção": "#ffb830",
  "Alerta": "#ff4365",
};

export function WellEventTimeline() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[#0a1830] mt-2 pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[9px] text-[#2a5272] tracking-widest uppercase font-mono hover:text-[#4a8ab4] transition-colors"
      >
        <span>HISTORIAL DE EVENTOS</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pl-3 relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-1 bottom-1 w-[1px] bg-[#0a2040]" />

              {EVENTS.map((e, i) => (
                <div key={i} className="flex gap-3 mb-3 relative">
                  {/* Dot */}
                  <div className="flex-shrink-0 relative z-10 mt-0.5">
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{
                        borderColor: e.color,
                        background: e.style === "dashed" ? "transparent" : e.color + "40",
                        borderStyle: e.style === "dashed" ? "dashed" : "solid",
                      }}
                    />
                    {e.star && (
                      <span className="absolute -top-1 -right-1 text-[8px]">★</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] text-[#2a5272] font-mono">{e.date}</p>
                    <p className="text-[9px] text-[#b4d4f4] font-mono leading-snug">{e.text}</p>
                    <span
                      className="inline-block text-[7px] font-mono px-1.5 py-0.5 rounded mt-0.5 border"
                      style={{
                        color: CAT_COLORS[e.category] || "#3a6a8a",
                        borderColor: (CAT_COLORS[e.category] || "#3a6a8a") + "35",
                        background: (CAT_COLORS[e.category] || "#3a6a8a") + "12",
                      }}
                    >
                      {e.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
