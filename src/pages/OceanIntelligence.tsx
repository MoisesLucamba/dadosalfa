import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Download, Settings, Activity } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────
   ELASTRA — Ocean Intelligence
   Self-contained subsea command center page.
   ────────────────────────────────────────────────────────────────────── */

type WellType = "oil" | "gas" | "dry";
interface Well {
  id: string;
  name: string;
  type: WellType;
  depth: number;
  year: number;
  similarity: number;
  // map coords in our SVG viewBox space
  x: number;
  y: number;
  temp: number;
  salinity: number;
  pressure: number;
  country: "Angola" | "Brasil";
}

const WELLS: Well[] = [
  { id: "lula-norte",   name: "Lula Norte",        type: "oil", depth: 2230, year: 2006, similarity: 94, x: 240, y: 360, temp: 3.8, salinity: 34.7, pressure: 224, country: "Brasil" },
  { id: "buzios-west",  name: "Búzios West",       type: "oil", depth: 2100, year: 2010, similarity: 89, x: 270, y: 340, temp: 4.0, salinity: 34.6, pressure: 211, country: "Brasil" },
  { id: "mero-deep",    name: "Mero Deep",         type: "gas", depth: 2450, year: 2013, similarity: 81, x: 220, y: 320, temp: 3.5, salinity: 34.8, pressure: 246, country: "Brasil" },
  { id: "kwanza-3",     name: "Kwanza-3",          type: "oil", depth: 1890, year: 2008, similarity: 77, x: 760, y: 360, temp: 4.4, salinity: 35.0, pressure: 190, country: "Angola" },
  { id: "girassol",     name: "Block 15 Girassol", type: "oil", depth: 1350, year: 2001, similarity: 72, x: 780, y: 330, temp: 5.1, salinity: 35.1, pressure: 136, country: "Angola" },
  { id: "saturno-1",    name: "Saturno-1",         type: "dry", depth: 3100, year: 2015, similarity: 12, x: 500, y: 420, temp: 2.9, salinity: 34.9, pressure: 311, country: "Brasil" },
  { id: "santos-sw",    name: "Santos Basin SW",   type: "gas", depth: 2670, year: 2017, similarity: 68, x: 290, y: 410, temp: 3.3, salinity: 34.8, pressure: 268, country: "Brasil" },
  { id: "namibe-ultra", name: "Namibe Ultra",      type: "oil", depth: 2800, year: 2019, similarity: 85, x: 800, y: 450, temp: 3.1, salinity: 35.2, pressure: 281, country: "Angola" },
];

const LAYERS = [
  { id: "blocks",   label: "BLOCOS" },
  { id: "wells",    label: "POÇOS" },
  { id: "currents", label: "CORRENTES" },
  { id: "temp",     label: "TEMPERATURA" },
  { id: "wind",     label: "VENTO & ONDAS" },
  { id: "ai",       label: "ANÁLISE IA" },
] as const;
type LayerId = typeof LAYERS[number]["id"];

const FILTERS = ["Todos", "Petróleo", "Gás", "Seco", "> 2000m", "Angola", "Brasil"] as const;
type Filter = typeof FILTERS[number];

const typeColor = (t: WellType) =>
  t === "oil" ? "#F5A623" : t === "gas" ? "#00FFCC" : "#FF4757";

const typeLabel = (t: WellType) =>
  t === "oil" ? "PETRÓLEO" : t === "gas" ? "GÁS" : "SECO";

/* ─── Animated background ─────────────────────────────────────────── */
function OceanBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        d: 8 + Math.random() * 14,
        s: 1 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* sonar pulse rings */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border border-[#00C8FF]/20"
          style={{
            width: 200,
            height: 200,
            transform: "translate(-50%,-50%)",
            animation: `elastraSonar 8s ${i * 2.6}s ease-out infinite`,
          }}
        />
      ))}
      {/* particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-[#00C8FF]/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            animation: `elastraFloat ${p.d}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes elastraSonar {
          0%   { width: 100px; height: 100px; opacity: .6; }
          100% { width: 1600px; height: 1600px; opacity: 0; }
        }
        @keyframes elastraFloat {
          0%,100% { transform: translateY(0); opacity:.2; }
          50%     { transform: translateY(-20px); opacity:.8; }
        }
        @keyframes elastraDash { to { stroke-dashoffset: -200; } }
        @keyframes elastraPulse {
          0%,100% { opacity:.9; transform: scale(1); }
          50%     { opacity:.4; transform: scale(1.4); }
        }
        @keyframes elastraRipple {
          0%   { r: 30; opacity: .8; }
          100% { r: 90; opacity: 0; }
        }
        @keyframes mapPing {
          0%   { r: 20; opacity: .7; }
          100% { r: 600; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Top Bar ─────────────────────────────────────────────────────── */
function TopBar({
  layers, toggle, cursor,
}: {
  layers: Record<LayerId, boolean>;
  toggle: (id: LayerId) => void;
  cursor: { lat: string; lon: string };
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className="flex items-center gap-4 border-b border-[#00C8FF]/15 bg-[#020B18]/80 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#00C8FF] to-[#00FFCC] opacity-90" />
          <div className="absolute inset-[3px] rounded-[4px] bg-[#020B18] flex items-center justify-center">
            <span className="text-[#00FFCC] font-bold text-sm">E</span>
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-white font-bold tracking-[0.18em] text-sm">ELASTRA</div>
          <div className="text-[10px] tracking-[0.25em] text-[#00C8FF]/70">
            SOUTH ATLANTIC INTELLIGENCE
          </div>
        </div>
      </div>

      <div className="mx-auto flex flex-wrap items-center gap-2">
        {LAYERS.map((l) => {
          const active = layers[l.id];
          return (
            <button
              key={l.id}
              onClick={() => toggle(l.id)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.2em] border transition-all ${
                active
                  ? "border-[#00C8FF] text-[#00FFCC] bg-[#00C8FF]/10 shadow-[0_0_18px_rgba(0,200,255,0.35)]"
                  : "border-[#00C8FF]/15 text-[#7FB7D6] hover:text-white hover:border-[#00C8FF]/40"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ED573] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2ED573]" />
          </span>
          <span className="text-[#2ED573] tracking-widest">LIVE DATA</span>
        </div>
        <span className="text-[#7FB7D6]">{ts}</span>
        <span className="text-[#00C8FF]">
          {cursor.lat} / {cursor.lon}
        </span>
      </div>
    </div>
  );
}

/* ─── Left Panel ──────────────────────────────────────────────────── */
function LeftPanel({
  selected, onSelect, filter, setFilter,
}: {
  selected: string;
  onSelect: (id: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
}) {
  const filtered = WELLS.filter((w) => {
    switch (filter) {
      case "Todos": return true;
      case "Petróleo": return w.type === "oil";
      case "Gás": return w.type === "gas";
      case "Seco": return w.type === "dry";
      case "> 2000m": return w.depth > 2000;
      case "Angola": return w.country === "Angola";
      case "Brasil": return w.country === "Brasil";
    }
  });
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full border-r border-[#00C8FF]/15 bg-[#041C35]/40 backdrop-blur-xl"
    >
      <div className="px-5 py-4 border-b border-[#00C8FF]/10">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-[#00C8FF]">
          POÇOS HISTÓRICOS
        </h2>
        <p className="text-[10px] text-[#7FB7D6]/70 mt-1 font-mono">
          {filtered.length} registos
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
        {filtered.map((w) => {
          const c = typeColor(w.type);
          const active = selected === w.id;
          return (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              className={`w-full text-left rounded-md p-3 border transition-all ${
                active
                  ? "border-[#00C8FF]/60 bg-[#062D54]/80 shadow-[0_0_20px_rgba(0,200,255,0.25)]"
                  : "border-[#00C8FF]/10 bg-[#020B18]/60 hover:border-[#00C8FF]/30"
              }`}
              style={{ borderLeft: `3px solid ${c}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-white font-semibold text-sm">{w.name}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                  style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}
                >
                  {typeLabel(w.type)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px] text-[#7FB7D6]">
                <span>{w.depth.toLocaleString()} m</span>
                <span className="text-right">{w.year}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[9px] font-mono mb-0.5">
                  <span className="text-[#7FB7D6]/70">SIMILARIDADE</span>
                  <span style={{ color: c }}>{w.similarity}%</span>
                </div>
                <div className="h-1 bg-[#020B18] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${w.similarity}%`, background: c, boxShadow: `0 0 8px ${c}` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-[#00C8FF]/10">
        <div className="text-[10px] font-bold tracking-[0.25em] text-[#00C8FF] mb-2">
          FILTROS
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-full border tracking-wide transition-all ${
                filter === f
                  ? "border-[#00FFCC] text-[#00FFCC] bg-[#00FFCC]/10"
                  : "border-[#00C8FF]/20 text-[#7FB7D6] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}

/* ─── Map ─────────────────────────────────────────────────────────── */
function OceanMap({
  layers, selected, onSelect, maxYear, onCursor,
}: {
  layers: Record<LayerId, boolean>;
  selected: string;
  onSelect: (id: string) => void;
  maxYear: number;
  onCursor: (c: { lat: string; lon: string }) => void;
}) {
  const [hoverWell, setHoverWell] = useState<Well | null>(null);
  const [hoverBlock, setHoverBlock] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [pingKey, setPingKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPingKey((k) => k + 1), 4000);
    return () => clearInterval(t);
  }, []);

  // Click-to-center pan: translate scene so selected well moves toward map center (500,300)
  const selectedWell = WELLS.find((w) => w.id === selected);
  const panX = selectedWell ? (500 - selectedWell.x) * 0.35 : 0;
  const panY = selectedWell ? (300 - selectedWell.y) * 0.35 : 0;

  // viewBox: 1000x600. Brasil left, Angola right.
  const blocks = useMemo(() => {
    const arr: { x: number; y: number; w: number; h: number; code: string }[] = [];
    const codes = ["ANG", "BRA", "SA"];
    let i = 0;
    for (let y = 100; y < 540; y += 70) {
      for (let x = 180; x < 860; x += 90) {
        const c = codes[i % 3];
        arr.push({ x, y, w: 88, h: 68, code: `${c}-${(i + 4).toString().padStart(2, "0")}` });
        i++;
      }
    }
    return arr;
  }, []);

  const aiZones = [
    { id: "alfa",  x: 380, y: 290, prob: 87, label: "ZONA ALFA" },
    { id: "beta",  x: 620, y: 380, prob: 74, label: "ZONA BETA" },
    { id: "gamma", x: 480, y: 470, prob: 61, label: "ZONA GAMMA" },
  ];

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const lon = -50 + px * 65;
    const lat = 5 - py * 40;
    onCursor({
      lat: `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`,
      lon: `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`,
    });
  };

  // Convert SVG coords -> container px for the floating tooltip
  const handleWellEnter = (w: Well, e: React.MouseEvent) => {
    setHoverWell(w);
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    // account for pan transform applied to scene group
    const sx = ((w.x + panX) / 1000) * r.width;
    const sy = ((w.y + panY) / 600) * r.height;
    setTooltipPos({ x: sx, y: sy });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative h-full w-full overflow-hidden bg-[#020B18]"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        onMouseMove={handleMove}
      >
        <defs>
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%"  stopColor="#062D54" />
            <stop offset="60%" stopColor="#041C35" />
            <stop offset="100%" stopColor="#020B18" />
          </radialGradient>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#FF4757" stopOpacity="0.35" />
            <stop offset="40%" stopColor="#F5A623" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#00C8FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#041C35" stopOpacity="0.05" />
          </linearGradient>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00C8FF" strokeOpacity="0.06" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1000" height="600" fill="url(#oceanGrad)" />
        <rect width="1000" height="600" fill="url(#grid)" />

        {/* Pannable scene */}
        <g
          style={{
            transform: `translate(${panX}px, ${panY}px)`,
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Temperature overlay */}
          {layers.temp && <rect width="1000" height="600" fill="url(#tempGrad)" />}

          {/* Coastlines */}
          <path
            d="M 0,80 L 130,90 L 145,150 L 160,220 L 150,300 L 165,380 L 140,470 L 120,560 L 0,580 Z"
            fill="#020B18" stroke="#00C8FF" strokeWidth="1" strokeOpacity="0.5"
            filter="url(#glow)"
          />
          <path
            d="M 1000,60 L 880,75 L 855,140 L 840,210 L 850,290 L 835,370 L 845,450 L 870,540 L 1000,560 Z"
            fill="#020B18" stroke="#00C8FF" strokeWidth="1" strokeOpacity="0.5"
            filter="url(#glow)"
          />
          <text x="60"  y="320" fill="#00C8FF" opacity="0.5" fontSize="10" letterSpacing="3">BRASIL</text>
          <text x="900" y="320" fill="#00C8FF" opacity="0.5" fontSize="10" letterSpacing="3">ANGOLA</text>

          {/* Blocks */}
          {layers.blocks &&
            blocks.map((b) => (
              <g key={b.code} onMouseEnter={() => setHoverBlock(b.code)} onMouseLeave={() => setHoverBlock(null)}>
                <rect
                  x={b.x} y={b.y} width={b.w} height={b.h}
                  fill={hoverBlock === b.code ? "#00C8FF11" : "transparent"}
                  stroke="#00C8FF" strokeOpacity="0.18" strokeWidth="0.8"
                />
                <text x={b.x + 4} y={b.y + 12} fill="#00C8FF" fontSize="8" opacity="0.5" fontFamily="monospace">
                  {b.code}
                </text>
              </g>
            ))}

          {/* Currents */}
          {layers.currents && (
            <>
              <path
                d="M 150,300 C 350,260 650,340 870,310"
                fill="none" stroke="#00FFCC" strokeOpacity="0.7" strokeWidth="1.5"
                strokeDasharray="6 8"
                style={{ animation: "elastraDash 6s linear infinite" }}
              />
              <text x="430" y="290" fill="#00FFCC" fontSize="9" letterSpacing="2" opacity="0.85">
                CORRENTE EQUATORIAL SUL →
              </text>
              <path
                d="M 855,540 C 845,440 835,330 850,210"
                fill="none" stroke="#00C8FF" strokeOpacity="0.7" strokeWidth="1.5"
                strokeDasharray="6 8"
                style={{ animation: "elastraDash 8s linear infinite" }}
              />
              <text x="765" y="400" fill="#00C8FF" fontSize="9" letterSpacing="2" opacity="0.85">
                ↑ BENGUELA
              </text>
            </>
          )}

          {/* AI prediction zones */}
          {layers.ai &&
            aiZones.map((z) => (
              <g key={z.id}>
                <circle cx={z.x} cy={z.y} r="60"
                  fill="none" stroke="#00FFCC" strokeOpacity="0.55"
                  strokeWidth="1.5" strokeDasharray="4 6"
                  style={{ animation: "elastraPulse 3s ease-in-out infinite" }}
                />
                <circle cx={z.x} cy={z.y} r="6" fill="#00FFCC" opacity="0.9" />
                <text x={z.x + 10} y={z.y - 10} fill="#00FFCC" fontSize="10" fontFamily="monospace">
                  {z.label} — {z.prob}%
                </text>
              </g>
            ))}

          {/* Sonar ping from center */}
          <circle key={pingKey} cx="500" cy="300" r="20"
            fill="none" stroke="#00C8FF" strokeWidth="1.5" opacity="0.7"
            style={{ animation: "mapPing 4s ease-out forwards" }}
          />

          {/* Wells — rendered LAST so they sit above everything else in the scene */}
          {layers.wells &&
            WELLS.filter((w) => w.year <= maxYear).map((w) => {
              const c = typeColor(w.type);
              const active = selected === w.id;
              const big = layers.ai && w.similarity >= 80;
              return (
                <g key={w.id}
                  onMouseEnter={(e) => handleWellEnter(w, e)}
                  onMouseLeave={() => { setHoverWell(null); setTooltipPos(null); }}
                  onClick={() => onSelect(w.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Hit area */}
                  <circle cx={w.x} cy={w.y} r="16" fill="transparent" />

                  {w.type !== "dry" && (
                    <circle cx={w.x} cy={w.y} r={big ? 18 : 12}
                      fill="none" stroke={c} strokeWidth="1.5" opacity="0.7"
                      style={{ animation: "elastraPulse 2.4s ease-in-out infinite" }}
                    />
                  )}

                  {/* Dry wells: X marker */}
                  {w.type === "dry" && (
                    <g stroke={c} strokeWidth="2" opacity="0.9">
                      <line x1={w.x - 6} y1={w.y - 6} x2={w.x + 6} y2={w.y + 6} />
                      <line x1={w.x - 6} y1={w.y + 6} x2={w.x + 6} y2={w.y - 6} />
                    </g>
                  )}

                  <circle cx={w.x} cy={w.y} r={active ? 7 : 5}
                    fill={c} stroke="#020B18" strokeWidth="1.5"
                    style={{ filter: `drop-shadow(0 0 6px ${c})` }}
                  />
                  {active && (
                    <circle cx={w.x} cy={w.y} r="14"
                      fill="none" stroke="#00FFCC" strokeWidth="1.5"
                      style={{ animation: "elastraRipple 1.6s ease-out infinite" }}
                    />
                  )}
                  {/* Label under marker */}
                  <text
                    x={w.x} y={w.y + (active ? 20 : 18)}
                    textAnchor="middle"
                    fontSize={active ? 10 : 8}
                    fill={active ? "#FFFFFF" : "#7FB7D6"}
                    fontFamily="monospace"
                    style={{ pointerEvents: "none", textShadow: "0 0 4px #020B18" }}
                  >
                    {w.name}
                  </text>
                </g>
              );
            })}
        </g>

        {/* Depth ruler — fixed (not panned) */}
        <g transform="translate(970,80)">
          <line x1="0" y1="0" x2="0" y2="440" stroke="#00C8FF" strokeOpacity="0.4" />
          {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((d, i) => (
            <g key={d} transform={`translate(0,${(i * 440) / 7})`}>
              <line x1="-6" y1="0" x2="0" y2="0" stroke="#00C8FF" strokeOpacity="0.6" />
              <text x="-10" y="3" textAnchor="end" fontSize="8" fill="#7FB7D6" fontFamily="monospace">
                {d}m
              </text>
            </g>
          ))}
        </g>

        {/* Temp legend — fixed */}
        {layers.temp && (
          <g transform="translate(20,80)">
            <rect width="10" height="200" fill="url(#tempGrad)" stroke="#00C8FF" strokeOpacity="0.4" />
            <text x="14" y="10"  fontSize="8" fill="#FF4757" fontFamily="monospace">28°C</text>
            <text x="14" y="105" fontSize="8" fill="#F5A623" fontFamily="monospace">18°C</text>
            <text x="14" y="200" fontSize="8" fill="#00C8FF" fontFamily="monospace">4°C</text>
          </g>
        )}
      </svg>

      {/* Block tooltip */}
      <AnimatePresence>
        {hoverBlock && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md border border-[#00C8FF]/40 bg-[#020B18]/90 backdrop-blur text-[11px] font-mono text-[#00C8FF] z-20"
          >
            {hoverBlock} · TotalEnergies · ATIVO
          </motion.div>
        )}
      </AnimatePresence>

      {/* Well tooltip — anchored next to marker */}
      <AnimatePresence>
        {hoverWell && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute px-3 py-2 rounded-md border border-[#00C8FF]/50 bg-[#020B18]/95 backdrop-blur text-[11px] font-mono shadow-[0_0_18px_rgba(0,200,255,0.3)] z-20"
            style={{
              left: Math.min(Math.max(tooltipPos.x + 14, 8), (svgRef.current?.clientWidth ?? 800) - 200),
              top:  Math.max(tooltipPos.y - 50, 8),
            }}
          >
            <div className="text-white font-bold">{hoverWell.name}</div>
            <div className="text-[#7FB7D6]">{typeLabel(hoverWell.type)} · {hoverWell.depth}m · {hoverWell.year}</div>
            <div className="text-[#00FFCC]">{hoverWell.temp}°C · {hoverWell.salinity} PSU · {hoverWell.pressure} bar</div>
            <div className="text-[#00C8FF] mt-0.5">SIM {hoverWell.similarity}% · {hoverWell.country}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 rounded-md border border-[#00C8FF]/20 bg-[#020B18]/85 backdrop-blur px-3 py-2 text-[10px] font-mono space-y-1 z-20">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#F5A623", boxShadow: "0 0 6px #F5A623" }} /><span className="text-[#7FB7D6]">Petróleo</span></div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#00FFCC", boxShadow: "0 0 6px #00FFCC" }} /><span className="text-[#7FB7D6]">Gás</span></div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#FF4757" }} /><span className="text-[#7FB7D6]">Seco</span></div>
        <div className="flex items-center gap-2"><span className="h-2 w-3 border border-dashed border-[#00FFCC]" /><span className="text-[#7FB7D6]">Zona prevista (IA)</span></div>
        <div className="flex items-center gap-2"><span className="h-px w-3 border-t border-dashed border-[#00C8FF]" /><span className="text-[#7FB7D6]">Correntes</span></div>
      </div>
    </motion.div>
  );
}

/* ─── Right Panel ─────────────────────────────────────────────────── */
function FactorBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  const filled = Math.round(pct / 10);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-[#7FB7D6]">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="font-mono text-[10px] text-[#00FFCC] tracking-tight">
          {"█".repeat(filled)}<span className="text-[#7FB7D6]/40">{"░".repeat(10 - filled)}</span>
        </div>
        <span className="text-[10px] font-mono text-[#00C8FF]">{pct}%</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-md border border-[#00C8FF]/15 bg-[#020B18]/60 p-3">
      <div className="text-[9px] tracking-[0.2em] text-[#7FB7D6]/70 uppercase">{label}</div>
      <div className="mt-1 font-mono text-lg text-white">{value} <span className="text-[10px] text-[#00C8FF]">{unit}</span></div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 60},${20 - ((v - min) / Math.max(0.1, max - min)) * 18}`)
    .join(" ");
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-16">
      <polyline points={pts} fill="none" stroke="#00C8FF" strokeWidth="1.2" />
    </svg>
  );
}

function RightPanel({ well }: { well: Well }) {
  const factors = [
    { label: "Espessura sedimentar",   value: "4,200m",   pct: 84 },
    { label: "Gradiente geotérmico",   value: "28°C/km",  pct: 70 },
    { label: "Proximidade a falhas",   value: "12km",     pct: 95 },
    { label: "Temperatura de fundo",   value: `${well.temp}°C`, pct: 82 },
    { label: "Salinidade histórica",   value: `${well.salinity} PSU`, pct: 73 },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex flex-col h-full overflow-y-auto border-l border-[#00C8FF]/15 bg-[#041C35]/40 backdrop-blur-xl scrollbar-thin"
    >
      <div className="px-5 py-4 border-b border-[#00C8FF]/10">
        <h2 className="text-[11px] font-bold tracking-[0.25em] text-[#00C8FF]">
          INTELIGÊNCIA DE DADOS
        </h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Profile */}
        <section>
          <div className="text-[9px] tracking-[0.25em] text-[#7FB7D6]/70 mb-1">POÇO ATIVO</div>
          <h3 className="text-2xl font-bold text-white">{well.name}</h3>
          <div className="mt-1 text-[10px] font-mono text-[#00FFCC]">
            {typeLabel(well.type)} · {well.country} · {well.year}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetricCard label="Profundidade da água" value={well.depth.toLocaleString()} unit="m" />
            <MetricCard label="Temperatura do fundo" value={well.temp.toString()} unit="°C" />
            <MetricCard label="Salinidade" value={well.salinity.toString()} unit="PSU" />
            <MetricCard label="Pressão de fundo" value={well.pressure.toString()} unit="bar" />
          </div>
        </section>

        {/* Pattern analysis */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[11px] font-bold tracking-[0.25em] text-[#00C8FF]">
              ANÁLISE DE PADRÕES
            </h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/40 tracking-widest">
              IA
            </span>
          </div>
          <div className="space-y-3 rounded-md border border-[#00C8FF]/15 bg-[#020B18]/50 p-3">
            {factors.map((f) => <FactorBar key={f.label} {...f} />)}
          </div>
          <div className="mt-4 rounded-md border border-[#00FFCC]/30 bg-gradient-to-br from-[#062D54]/80 to-[#020B18]/80 p-4 text-center">
            <div className="text-[10px] tracking-[0.25em] text-[#7FB7D6]">
              SCORE DE SIMILARIDADE GLOBAL
            </div>
            <div className="font-mono text-4xl font-bold text-[#00FFCC] mt-1" style={{ textShadow: "0 0 18px rgba(0,255,204,0.5)" }}>
              {well.similarity}%
            </div>
            <div className="text-[10px] text-[#7FB7D6] mt-1">
              {well.similarity >= 70 ? "Alta" : well.similarity >= 40 ? "Moderada" : "Baixa"} probabilidade de estrutura análoga a Lula Norte
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section>
          <h4 className="text-[11px] font-bold tracking-[0.25em] text-[#00C8FF] mb-3">
            CONDIÇÕES
          </h4>
          <div className="space-y-2 rounded-md border border-[#00C8FF]/15 bg-[#020B18]/50 p-3 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#7FB7D6]">Velocidade do vento</span>
              <span className="flex items-center gap-2"><Sparkline values={[10, 13, 11, 14, 12, 15, 14]} /><span className="text-white">14 kn</span></span>
            </div>
            <div className="flex justify-between"><span className="text-[#7FB7D6]">Altura das ondas</span><span className="text-white">2.3 m</span></div>
            <div className="flex justify-between"><span className="text-[#7FB7D6]">Corrente superficial</span><span className="text-white">0.8 nós / 285°</span></div>
            <div className="flex justify-between"><span className="text-[#7FB7D6]">Visibilidade submarina</span><span className="text-white">18 m</span></div>
          </div>
        </section>
      </div>
    </motion.aside>
  );
}

/* ─── Bottom Bar ──────────────────────────────────────────────────── */
function BottomBar({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-[#00C8FF]/15 bg-[#020B18]/80 px-5 py-3 backdrop-blur-xl">
      <div className="flex-1 min-w-[260px]">
        <div className="flex justify-between text-[10px] font-mono text-[#7FB7D6] mb-1">
          <span className="tracking-[0.25em]">DADOS HISTÓRICOS</span>
          <span className="text-[#00FFCC]">1995 — {year}</span>
        </div>
        <input
          type="range" min={1995} max={2025} value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full accent-[#00C8FF]"
        />
      </div>

      <div className="flex items-center gap-2">
        {[
          { v: "47", l: "Poços Registados" },
          { v: "12", l: "Campos Ativos" },
          { v: "3",  l: "Zonas Previstas" },
        ].map((s) => (
          <div key={s.l} className="px-3 py-1.5 rounded-full border border-[#00C8FF]/25 bg-[#041C35]/60 font-mono text-[10px] flex items-center gap-1.5">
            <span className="text-[#00FFCC] font-bold">{s.v}</span>
            <span className="text-[#7FB7D6]">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#00FFCC]/40 bg-[#00FFCC]/10 text-[#00FFCC] text-[10px] font-bold tracking-[0.2em] hover:bg-[#00FFCC]/20 transition">
          <Download className="h-3 w-3" /> EXPORTAR RELATÓRIO
        </button>
        <button className="p-2 rounded-md border border-[#00C8FF]/25 text-[#7FB7D6] hover:text-white hover:border-[#00C8FF]/50 transition">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function OceanIntelligence() {
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    blocks: true, wells: true, currents: true, temp: false, wind: false, ai: true,
  });
  const [selected, setSelected] = useState("lula-norte");
  const [filter, setFilter] = useState<Filter>("Todos");
  const [year, setYear] = useState(2025);
  const [cursor, setCursor] = useState({ lat: "0.00°N", lon: "0.00°W" });

  const toggle = (id: LayerId) => setLayers((p) => ({ ...p, [id]: !p[id] }));
  const well = WELLS.find((w) => w.id === selected) ?? WELLS[0];

  return (
    <>
      <Helmet>
        <title>Ocean Intelligence — Elastra South Atlantic</title>
        <meta name="description" content="Subsea command center: real-time South Atlantic well intelligence, AI prediction zones, currents, and oceanographic data." />
      </Helmet>

      <div className="relative h-screen w-screen overflow-hidden bg-[#020B18] text-white">
        <OceanBackground />
        <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
          <TopBar layers={layers} toggle={toggle} cursor={cursor} />
          <div className="grid min-h-0 grid-cols-[300px_1fr_360px]">
            <LeftPanel selected={selected} onSelect={setSelected} filter={filter} setFilter={setFilter} />
            <OceanMap layers={layers} selected={selected} onSelect={setSelected} maxYear={year} onCursor={setCursor} />
            <RightPanel well={well} />
          </div>
          <BottomBar year={year} setYear={setYear} />
        </div>
      </div>
    </>
  );
}
