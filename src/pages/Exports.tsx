import { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import {
  Ship,
  Globe,
  Clock,
  DollarSign,
  Anchor,
  Navigation,
  TrendingUp,
  MapPin,
  Activity,
  Box,
  Radio,
  ChevronRight,
  Terminal,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const exportVolumeData = [
  { month: "JAN", volume: 42.5 },
  { month: "FEV", volume: 38.2 },
  { month: "MAR", volume: 45.1 },
  { month: "ABR", volume: 41.8 },
  { month: "MAI", volume: 44.3 },
  { month: "JUN", volume: 43.2 },
  { month: "JUL", volume: 46.8 },
  { month: "AGO", volume: 44.5 },
  { month: "SET", volume: 45.9 },
  { month: "OUT", volume: 44.7 },
  { month: "NOV", volume: 46.0 },
  { month: "DEZ", volume: 45.2 },
];

const destinationData = [
  { country: "CHINA",   volume: 28.5, percentage: 62, color: "#3b82f6", flag: "🇨🇳" },
  { country: "ÍNDIA",   volume: 6.9,  percentage: 15, color: "#10b981", flag: "🇮🇳" },
  { country: "EUROPA",  volume: 5.5,  percentage: 12, color: "#8b5cf6", flag: "🇪🇺" },
  { country: "EUA",     volume: 3.7,  percentage: 8,  color: "#f59e0b", flag: "🇺🇸" },
  { country: "OUTROS",  volume: 1.4,  percentage: 3,  color: "#475569", flag: "🌍" },
];

const recentShipments = [
  { vessel: "MT ANGOTAN SPIRIT",   destination: "NINGBO, CN",     volume: "1.2M BBL", departure: "12 NOV", eta: "28 NOV", status: "TRANSIT",  progress: 65  },
  { vessel: "MT CABINDA STAR",     destination: "MUMBAI, IN",     volume: "950K BBL", departure: "10 NOV", eta: "25 NOV", status: "TRANSIT",  progress: 80  },
  { vessel: "MT GIRASSOL EXPRESS", destination: "ROTTERDAM, NL",  volume: "800K BBL", departure: "08 NOV", eta: "22 NOV", status: "ARRIVED",  progress: 100 },
  { vessel: "MT DALIA VOYAGER",    destination: "HOUSTON, US",    volume: "1.1M BBL", departure: "05 NOV", eta: "20 NOV", status: "ARRIVED",  progress: 100 },
  { vessel: "MT PAZFLOR PIONEER",  destination: "SHANGHAI, CN",   volume: "1.3M BBL", departure: "15 NOV", eta: "02 DEZ", status: "LOADING",  progress: 15  },
];

const terminalData = [
  { terminal: "MALONGO",     capacity: 450, utilization: 82, color: "#3b82f6" },
  { terminal: "SOYO LNG",    capacity: 380, utilization: 91, color: "#f59e0b" },
  { terminal: "CABINDA GULF",capacity: 320, utilization: 75, color: "#10b981" },
  { terminal: "LOBITO",      capacity: 280, utilization: 68, color: "#8b5cf6" },
];

// ─── Scanline ─────────────────────────────────────────────────────────────────
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)" }}
  />
);

// ─── Radar Pulse ──────────────────────────────────────────────────────────────
const Pulse = ({ color = "#ef4444" }: { color?: string }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
  </span>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; color: string; bg: string; pulse: string }> = {
    TRANSIT:  { label: "EM TRÂNSITO", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  pulse: "#3b82f6" },
    ARRIVED:  { label: "CHEGOU",       color: "#4ade80", bg: "rgba(74,222,128,0.1)",  pulse: "#4ade80" },
    LOADING:  { label: "A CARREGAR",   color: "#fb923c", bg: "rgba(251,146,60,0.1)",  pulse: "#fb923c" },
  };
  const s = map[status] ?? map.TRANSIT;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}
    >
      <Pulse color={s.pulse} />
      {s.label}
    </span>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-[10px] font-bold"
      style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "4px", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
      <div style={{ color: "#f87171" }}>{payload[0]?.value} M BBL</div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const Exports = () => {
  const [now, setNow] = useState(new Date());
  const [bootDone, setBootDone] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 900); }, []);

  const totalVolume = useMemo(() => destinationData.reduce((a, c) => a + c.volume, 0), []);

  return (
    <div
      className="min-h-screen text-foreground selection:bg-red-500/30"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // EXPORTAÇÕES</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <ScanlineOverlay />

      {/* Boot */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: "#000", fontFamily: "'IBM Plex Mono', monospace" }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <div className="text-red-500 text-xs space-y-1 w-96 max-w-full px-8">
              <p className="text-red-400 text-lg font-bold mb-4">&gt; ALPHADAT-OS v3.2.1</p>
              <p className="opacity-70">MOUNTING MARITIME TRACKING MODULE......... OK</p>
              <p className="opacity-70">LINKING VESSEL TRANSPONDERS............... OK</p>
              <p className="text-red-500 animate-pulse">LOADING EXPORTS INTELLIGENCE.............. ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/exports" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[35%] h-[30%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.03) 0%, transparent 70%)" }} />

          <Header activeItem="/exports" />

          {/* System Status Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: bootDone ? 1 : 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-6 py-2 border-b"
            style={{ borderColor: "rgba(220,38,38,0.12)", background: "rgba(220,38,38,0.03)" }}
          >
            <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="flex items-center gap-1.5 text-blue-400">
                <Pulse color="#60a5fa" />
                FROTA ACTIVA
              </span>
              <span className="opacity-40">|</span>
              <span>5 NAVIOS RASTREADOS</span>
              <span className="opacity-40">|</span>
              <span>MÓDULO: EXPORTAÇÕES & LOGÍSTICA</span>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span style={{ color: "hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12: false })}</span>
              <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
            </div>
          </motion.div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">

              {/* ── Header ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>LOGISTICS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>EXPORTAÇÕES</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                    MÓDULO-05 // MARITIME INTELLIGENCE
                  </div>
                  <h1 className="font-bold leading-none" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
                    EXPORTAÇÕES
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-[1px] w-12 bg-red-600" />
                    <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                      MONITORIZAÇÃO EM TEMPO REAL DE FLUXOS, DESTINOS E INFRAESTRUTURA PORTUÁRIA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DataExportButton
                    data={recentShipments}
                    columns={[
                      { key: "vessel", header: "Navio" },
                      { key: "destination", header: "Destino" },
                      { key: "volume", header: "Volume" },
                      { key: "departure", header: "Partida" },
                      { key: "eta", header: "ETA" },
                      { key: "status", header: "Status" },
                    ]}
                    filename="exportacoes_angola"
                  />
                </div>
              </motion.div>

              {/* ── KPI Grid ── */}
              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { label: "EXPORTAÇÕES (NOV)", value: "46M BBL", delta: "+3.2%", icon: Ship,       color: "#3b82f6", tag: "EXP" },
                  { label: "DESTINOS ACTIVOS",  value: "12",       delta: "+2 PAÍSES", icon: Globe, color: "#10b981", tag: "DST" },
                  { label: "TEMPO MÉDIO",        value: "18 DIAS",  delta: "−1.2D",  icon: Clock,    color: "#a78bfa", tag: "TRP" },
                  { label: "RECEITA ESTIMADA",   value: "$3.6B",    delta: "+2.8%",  icon: DollarSign,color: "#fb923c", tag: "REV" },
                ].map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 10 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="relative overflow-hidden rounded p-5 group cursor-default"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${k.color}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5" style={{ background: `${k.color}18`, color: k.color, borderBottomLeftRadius: "4px" }}>
                      {k.tag}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                      <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{k.label}</span>
                    </div>
                    <div className="text-2xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>{k.value}</div>
                    <div className="text-[10px] mt-1 font-bold" style={{ color: k.color }}>{k.delta}</div>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
                  </motion.div>
                ))}
              </motion.div>

              {/* ── Charts Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Area Chart */}
                <motion.div
                  className="lg:col-span-8 rounded overflow-hidden"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.4 }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          TENDÊNCIA DE EXPORTAÇÃO // VOLUME MENSAL (M BBL)
                        </span>
                      </div>
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded"
                      style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      +8.2% YTD
                    </span>
                  </div>
                  <div className="p-5 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exportVolumeData}>
                        <defs>
                          <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} domain={[30, 50]} fontFamily="IBM Plex Mono" />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(220,38,38,0.2)", strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="volume" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#exportGrad)" dot={false} activeDot={{ r: 4, fill: "#dc2626", stroke: "hsl(var(--card))", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Donut */}
                <motion.div
                  className="lg:col-span-4 rounded overflow-hidden"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.45 }}
                >
                  <div
                    className="px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        DESTINOS // QUOTA GLOBAL
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pt-4">
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={destinationData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="volume" strokeWidth={0}>
                            {destinationData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} opacity={0.85} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="px-3 py-2 text-[10px] font-bold" style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "4px", fontFamily: "'IBM Plex Mono', monospace", color: "#f87171" }}>
                                  {payload[0].name}: {payload[0].value} M BBL
                                </div>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="pb-5 space-y-2 mt-2">
                      {destinationData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-4 rounded-sm" style={{ background: d.color }} />
                            <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {d.flag} {d.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>{d.volume}M</span>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{d.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── Bottom Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Shipments Table */}
                <motion.div
                  className="lg:col-span-8 rounded overflow-hidden"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.5 }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        VESSEL TRACKER // EMBARQUES RECENTES
                      </span>
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest px-2.5 py-1 rounded"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                    >
                      <Activity className="w-3 h-3" />
                      5 ACTIVOS
                    </span>
                  </div>

                  {/* Table col headers */}
                  <div
                    className="hidden sm:grid px-5 py-2.5 text-[9px] font-bold tracking-[0.2em]"
                    style={{
                      gridTemplateColumns: "1fr 80px 140px 80px",
                      background: "rgba(255,255,255,0.015)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    <span>NAVIO // DESTINO</span>
                    <span>VOLUME</span>
                    <span>PROGRESSO</span>
                    <span className="text-right">STATUS</span>
                  </div>

                  {/* Rows */}
                  <div>
                    {recentShipments.map((ship, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.52 + i * 0.04 }}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="hidden sm:grid px-5 py-3.5 transition-colors duration-150 relative"
                        style={{
                          gridTemplateColumns: "1fr 80px 140px 80px",
                          alignItems: "center",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: hoveredRow === i ? "rgba(255,255,255,0.025)" : "transparent",
                        }}
                      >
                        {hoveredRow === i && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: "#3b82f6" }} />
                        )}

                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded shrink-0"
                            style={{ background: hoveredRow === i ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            <Ship className="w-3.5 h-3.5" style={{ color: hoveredRow === i ? "#60a5fa" : "hsl(var(--muted-foreground))" }} />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{ship.vessel}</div>
                            <div className="text-[9px] flex items-center gap-1 mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                              <MapPin className="w-2.5 h-2.5" />
                              {ship.destination}
                              <span className="opacity-40 mx-1">·</span>
                              ETA {ship.eta}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{ship.volume}</div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${ship.progress}%` }}
                              transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: ship.progress === 100 ? "#4ade80" : ship.progress < 20 ? "#fb923c" : "#3b82f6" }}
                            />
                          </div>
                          <span className="text-[9px] font-bold tabular-nums w-8" style={{ color: "hsl(var(--muted-foreground))" }}>{ship.progress}%</span>
                        </div>

                        <div className="flex justify-end">
                          <StatusBadge status={ship.status} />
                        </div>
                      </motion.div>
                    ))}

                    {/* Mobile rows */}
                    {recentShipments.map((ship, i) => (
                      <div
                        key={`m-${i}`}
                        className="sm:hidden px-4 py-4 flex items-center justify-between"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div>
                          <div className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{ship.vessel}</div>
                          <div className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{ship.destination} · {ship.volume}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${ship.progress}%`, background: ship.progress === 100 ? "#4ade80" : "#3b82f6" }} />
                            </div>
                            <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{ship.progress}%</span>
                          </div>
                        </div>
                        <StatusBadge status={ship.status} />
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Terminals */}
                <motion.div
                  className="lg:col-span-4 rounded overflow-hidden"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.55 }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <Anchor className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      PORT CONTROL // TERMINAIS
                    </span>
                  </div>

                  <div className="p-5 space-y-5">
                    {terminalData.map((t, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Box className="w-3 h-3" style={{ color: t.color }} />
                            <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{t.terminal}</span>
                          </div>
                          <span
                            className="text-[10px] font-bold tabular-nums"
                            style={{ color: t.utilization > 90 ? "#f87171" : t.utilization > 80 ? "#fb923c" : "#4ade80" }}
                          >
                            {t.utilization >= 90 && "⚠ "}
                            {t.utilization}%
                          </span>
                        </div>

                        {/* Track */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${t.utilization}%` }}
                            transition={{ delay: 0.65 + i * 0.1, duration: 0.9, ease: "easeOut" }}
                            style={{ background: t.utilization > 90 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : t.color }}
                          />
                        </div>

                        <div className="flex justify-between text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          <span>CAP: {t.capacity}K BBL</span>
                          <span>{t.utilization >= 90 ? "CRÍTICO" : t.utilization >= 80 ? "ELEVADO" : "NORMAL"}</span>
                        </div>
                      </motion.div>
                    ))}

                    {/* Insight */}
                    <div
                      className="p-4 rounded mt-2 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.03))",
                        border: "1px solid rgba(220,38,38,0.15)",
                      }}
                    >
                      <div className="absolute top-2 right-2 opacity-10">
                        <Zap className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--foreground))" }}>
                          ALERTA LOGÍSTICO
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Terminal{" "}
                        <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>SOYO LNG</span>
                        {" "}operando em <span className="text-amber-400 font-bold">91%</span> — próximo da capacidade máxima. Recomendar desvio para{" "}
                        <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>LOBITO</span>.
                      </p>
                      <div className="mt-3 h-[1px]" style={{ background: "linear-gradient(90deg, rgba(220,38,38,0.4), transparent)" }} />
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Exports;