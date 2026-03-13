import { useState, useMemo, useEffect } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Gauge,
  Droplets,
  DollarSign,
  MapPin,
  Factory,
  Zap,
  Globe,
  ExternalLink,
  Calendar,
  ChevronRight,
  Search,
  Terminal,
  Activity,
  Shield,
  Radio,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Operator {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  production: number;
  marketShare: number;
  blocks: string[];
  blocksCount: number;
  employees: number;
  investmentYTD: number;
  efficiency: number;
  uptime: number;
  declineRate: number;
  costPerBarrel: number;
  reserves: number;
  trend: "up" | "down" | "stable";
  headquarters: string;
  since: number;
  projects: string[];
  website: string;
  contact: string | null;
  sig: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const operatorsData: Operator[] = [
  {
    id: 1, name: "TotalEnergies EP Angola", shortName: "Total", logo: "T", color: "#38bdf8",
    sig: "TOT", production: 285, marketShare: 22.8, blocks: ["Bloco 17", "Bloco 32", "Bloco 14", "Bloco 48"],
    blocksCount: 4, employees: 3200, investmentYTD: 1.9, efficiency: 94, uptime: 97.2,
    declineRate: -2.1, costPerBarrel: 24, reserves: 2.1, trend: "up",
    headquarters: "Luanda", since: 1953,
    projects: ["Kaombo Norte/Sul", "CLOV", "Dalia", "Girassol"],
    website: "https://totalenergies.com/angola", contact: "https://services.totalenergies.co.ao/pt/contate-nos",
  },
  {
    id: 2, name: "Chevron Angola", shortName: "Chevron", logo: "C", color: "#0ea5e9",
    sig: "CVX", production: 198, marketShare: 15.8, blocks: ["Bloco 0", "Bloco 14", "Bloco 2"],
    blocksCount: 3, employees: 2600, investmentYTD: 1.3, efficiency: 91, uptime: 95.8,
    declineRate: -1.8, costPerBarrel: 26, reserves: 1.5, trend: "stable",
    headquarters: "Cabinda", since: 1957,
    projects: ["Mafumeira Sul", "Lianzi", "Takula"],
    website: "https://angola.chevron.com", contact: "https://angola.chevron.com/en/contact",
  },
  {
    id: 3, name: "Sonangol E.P.", shortName: "Sonangol", logo: "S", color: "#4ade80",
    sig: "SNG", production: 175, marketShare: 14.0, blocks: ["Bloco 3", "Bloco 4", "Bloco 5/06", "Bloco 6"],
    blocksCount: 4, employees: 7800, investmentYTD: 0.95, efficiency: 86, uptime: 92.1,
    declineRate: -3.5, costPerBarrel: 32, reserves: 1.8, trend: "stable",
    headquarters: "Luanda", since: 1976,
    projects: ["Gimboa", "Punja", "FSO Palanca"],
    website: "http://www.sonangol.co.ao/", contact: "secretariageral@sonangol.co.ao",
  },
  {
    id: 4, name: "Eni Angola", shortName: "Eni", logo: "E", color: "#a78bfa",
    sig: "ENI", production: 168, marketShare: 13.4, blocks: ["Bloco 15", "Bloco 15/06", "NGC"],
    blocksCount: 3, employees: 1700, investmentYTD: 1.15, efficiency: 92, uptime: 96.5,
    declineRate: -2.5, costPerBarrel: 25, reserves: 1.2, trend: "stable",
    headquarters: "Luanda", since: 1980,
    projects: ["West Hub (Sangos)", "East Hub", "Ndungu"],
    website: "https://www.eni.com/", contact: null,
  },
  {
    id: 5, name: "BP Angola", shortName: "BP", logo: "B", color: "#fb923c",
    sig: "BPA", production: 145, marketShare: 11.6, blocks: ["Bloco 18", "Bloco 31"],
    blocksCount: 2, employees: 1400, investmentYTD: 0.85, efficiency: 89, uptime: 94.3,
    declineRate: -2.8, costPerBarrel: 28, reserves: 0.9, trend: "down",
    headquarters: "Luanda", since: 1975,
    projects: ["PSVM", "Greater Plutonio"],
    website: "https://www.bp.com/", contact: null,
  },
  {
    id: 6, name: "ExxonMobil Angola", shortName: "Exxon", logo: "X", color: "#f472b6",
    sig: "XOM", production: 109, marketShare: 8.7, blocks: ["Bloco 15"],
    blocksCount: 1, employees: 850, investmentYTD: 0.55, efficiency: 93, uptime: 96.1,
    declineRate: -1.5, costPerBarrel: 23, reserves: 0.7, trend: "up",
    headquarters: "Luanda", since: 1992,
    projects: ["Kizomba A/B/C", "Mondo"],
    website: "https://corporate.exxonmobil.com/locations/angola", contact: null,
  },
  {
    id: 7, name: "Azule Energy", shortName: "Azule", logo: "A", color: "#06b6d4",
    sig: "AZL", production: 85, marketShare: 6.8, blocks: ["Bloco 18", "Bloco 15/06"],
    blocksCount: 2, employees: 1200, investmentYTD: 0.7, efficiency: 90, uptime: 95.0,
    declineRate: -2.0, costPerBarrel: 27, reserves: 0.6, trend: "up",
    headquarters: "Luanda", since: 2022,
    projects: ["Agogo", "PAJ"],
    website: "https://www.azule-energy.com", contact: null,
  },
];

const marketShareHistory = [
  { year: "2021", TotalEnergies: 24.0, Chevron: 17.0, Sonangol: 15.0, ENI: 14.0, BP: 12.0, ExxonMobil: 9.5, Outros: 8.5 },
  { year: "2022", TotalEnergies: 23.5, Chevron: 16.5, Sonangol: 14.5, ENI: 13.8, BP: 12.2, ExxonMobil: 9.2, Outros: 10.3 },
  { year: "2023", TotalEnergies: 23.2, Chevron: 16.2, Sonangol: 14.2, ENI: 13.6, BP: 11.8, ExxonMobil: 9.0, Outros: 12.0 },
  { year: "2024", TotalEnergies: 22.8, Chevron: 15.8, Sonangol: 14.0, ENI: 13.4, BP: 11.6, ExxonMobil: 8.7, Outros: 13.7 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
    }}
  />
);

const RadarPulse = ({ active }: { active: boolean }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500 animate-ping opacity-75" : "bg-slate-600"}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-red-500" : "bg-slate-600"}`} />
  </span>
);

const StatCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const iv = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [value]);
  return <>{display}</>;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const TerminalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid rgba(220,38,38,0.2)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(220,38,38,0.8)", marginBottom: 6 }}>
        {label} // DATA
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: "11px", color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
const Operators = () => {
  const [selectedOperator, setSelectedOperator] = useState<Operator>(operatorsData[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date());
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 900); }, []);

  const filteredOperators = useMemo(() =>
    operatorsData.filter(op =>
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.sig.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const radarData = useMemo(() => [
    { subject: "EFIC.", A: selectedOperator.efficiency, fullMark: 100 },
    { subject: "UPTIME", A: selectedOperator.uptime, fullMark: 100 },
    { subject: "INVEST.", A: (selectedOperator.investmentYTD / 2) * 100, fullMark: 100 },
    { subject: "RESERV.", A: (selectedOperator.reserves / 2.5) * 100, fullMark: 100 },
    { subject: "CUSTOS", A: (1 - selectedOperator.costPerBarrel / 40) * 100, fullMark: 100 },
  ], [selectedOperator]);

  const msKey = selectedOperator.shortName === "Total" ? "TotalEnergies"
    : selectedOperator.shortName === "Eni" ? "ENI"
    : selectedOperator.shortName === "Exxon" ? "ExxonMobil"
    : selectedOperator.shortName;

  const totalProduction = operatorsData.reduce((a, o) => a + o.production, 0);
  const avgEfficiency   = Math.round(operatorsData.reduce((a, o) => a + o.efficiency, 0) / operatorsData.length);
  const totalInvestment = operatorsData.reduce((a, o) => a + o.investmentYTD, 0).toFixed(1);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-foreground selection:bg-red-500/30"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // OPERADORAS</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <ScanlineOverlay />

      {/* Boot screen */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: "#000", fontFamily: "'IBM Plex Mono', monospace" }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <div className="text-red-500 text-xs space-y-1 w-96 max-w-full px-8">
              <p className="text-red-400 text-lg font-bold mb-4">&gt; ALPHADAT-OS v3.2.1</p>
              <p className="opacity-70">LOADING OPERATOR DATABASE..................... OK</p>
              <p className="opacity-70">MOUNTING PRODUCTION INDEXES.................. OK</p>
              <p className="text-red-500 animate-pulse">INITIALIZING OPERATORS MODULE................ ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Atmospheric glows */}
          <div className="absolute top-0 right-0 w-[45%] h-[35%] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[35%] h-[30%] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.03) 0%, transparent 70%)" }} />

          <Header />

          <main className="flex-1 overflow-y-auto custom-scrollbar">

            {/* ── System Status Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -8 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between px-6 py-2 border-b"
              style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}
            >
              <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="flex items-center gap-1.5 text-red-500">
                  <RadarPulse active={true} />
                  SISTEMA ONLINE
                </span>
                <span className="opacity-40">|</span>
                <span>MÓDULO: OPERADORAS</span>
                <span className="opacity-40">|</span>
                <span>CLASSIFICAÇÃO: RESTRITO</span>
              </div>
              <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span style={{ color: "hsl(var(--foreground))" }}>
                  {now.toLocaleTimeString("pt-BR", { hour12: false })}
                </span>
                <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
              </div>
            </motion.div>

            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

              {/* ── Page Header ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>MARKET INTELLIGENCE</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>OPERADORAS</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                      MÓDULO-02 // MARKET INTELLIGENCE
                    </div>
                    <h1
                      className="font-bold leading-none"
                      style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}
                    >
                      OPERADORAS
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="h-[1px] w-12 bg-red-600" />
                      <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                        DESEMPENHO, QUOTA DE MERCADO E INDICADORES OPERACIONAIS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search + Export */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <input
                      type="text"
                      placeholder="PROCURAR OPERADORA..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-10 pl-9 pr-4 rounded text-[11px] font-bold tracking-wider outline-none transition-colors w-56"
                      style={{
                        background: "hsl(var(--card))",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "hsl(var(--foreground))",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.07)"}
                    />
                  </div>
                  <DataExportButton
                    data={operatorsData}
                    filename="operadoras_angola"
                    columns={[
                      { key: "name", header: "Nome" },
                      { key: "production", header: "Produção (kbpd)" },
                      { key: "marketShare", header: "Quota Mercado (%)" },
                      { key: "efficiency", header: "Eficiência (%)" },
                      { key: "headquarters", header: "Sede" },
                      { key: "since", header: "Desde" },
                      { key: "website", header: "Website" },
                    ]}
                  />
                </div>
              </motion.div>

              {/* ── Stats ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 16 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {[
                  { label: "PRODUÇÃO TOTAL",    value: totalProduction,        suffix: "K", icon: Droplets,  color: "#38bdf8", tag: "PRD" },
                  { label: "OPERADORAS ACTIVAS",value: operatorsData.length,   suffix: "",  icon: Building2, color: "#4ade80", tag: "OPS" },
                  { label: "EFICIÊNCIA MÉDIA",  value: avgEfficiency,          suffix: "%", icon: Activity,  color: "#a78bfa", tag: "EFF" },
                  { label: "INVEST. TOTAL YTD", value: parseFloat(totalInvestment), suffix: "B$", icon: Zap, color: "#fb923c", tag: "INV" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="relative overflow-hidden rounded p-5 group cursor-default"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${s.color}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                  >
                    <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5"
                      style={{ background: `${s.color}18`, color: s.color, borderBottomLeftRadius: "4px" }}>
                      {s.tag}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <div className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {s.label}
                      </div>
                    </div>
                    <div className="text-3xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
                      {s.label === "INVEST. TOTAL YTD"
                        ? <>${totalInvestment}</>
                        : <><StatCounter value={s.value as number} />{s.suffix}</>}
                    </div>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                      style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                  </motion.div>
                ))}
              </motion.div>

              {/* ── Main Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── Left: Operator List ── */}
                <motion.div
                  className="lg:col-span-3 space-y-2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : -16 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Panel header */}
                  <div className="rounded overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                    <div className="px-4 py-3 flex items-center gap-2"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        ENTIDADES // {filteredOperators.length} REGISTOS
                      </span>
                    </div>

                    <div className="p-2 space-y-1">
                      <AnimatePresence mode="popLayout">
                        {filteredOperators.map((op, index) => {
                          const isActive = selectedOperator.id === op.id;
                          return (
                            <motion.button
                              key={op.id}
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.04 }}
                              onClick={() => setSelectedOperator(op)}
                              className="w-full flex items-center justify-between px-3 py-3 rounded transition-all duration-150"
                              style={isActive ? {
                                background: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.06))",
                                border: "1px solid rgba(220,38,38,0.25)",
                              } : {
                                background: "transparent",
                                border: "1px solid transparent",
                              }}
                              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              <div className="flex items-center gap-3">
                                {/* Logo badge */}
                                <div
                                  className="w-8 h-8 rounded flex items-center justify-center text-[13px] font-black shrink-0"
                                  style={{
                                    background: isActive ? `${op.color}22` : "rgba(255,255,255,0.05)",
                                    border: `1px solid ${isActive ? op.color + "44" : "rgba(255,255,255,0.06)"}`,
                                    color: isActive ? op.color : "hsl(var(--muted-foreground))",
                                  }}
                                >
                                  {op.logo}
                                </div>
                                <div className="text-left">
                                  <div className="text-[11px] font-bold" style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                                    {op.shortName}
                                  </div>
                                  <div className="text-[9px] tabular-nums mt-0.5" style={{ color: isActive ? "rgba(220,38,38,0.8)" : "hsl(var(--muted-foreground))", opacity: isActive ? 1 : 0.6 }}>
                                    {op.production}K BPD · {op.marketShare}%
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* SIG code */}
                                <span className="text-[8px] font-bold tabular-nums" style={{ color: isActive ? "#f87171" : "hsl(var(--muted-foreground))", opacity: 0.6, letterSpacing: "0.1em" }}>
                                  {op.sig}
                                </span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-red-500" />}
                              </div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Market position bar */}
                  <div className="rounded p-4"
                    style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                    <div className="text-[9px] font-bold tracking-[0.25em] mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                      QUOTA DE MERCADO // TOP 7
                    </div>
                    <div className="space-y-2">
                      {operatorsData.map(op => (
                        <div key={op.id}>
                          <div className="flex justify-between text-[9px] mb-1">
                            <span style={{ color: selectedOperator.id === op.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                              className="font-bold tracking-wider">
                              {op.sig}
                            </span>
                            <span className="tabular-nums" style={{ color: op.color }}>{op.marketShare}%</span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: selectedOperator.id === op.id ? `linear-gradient(90deg, #dc2626, ${op.color})` : op.color, opacity: selectedOperator.id === op.id ? 1 : 0.4 }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(op.marketShare / 25) * 100}%` }}
                              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ── Right: Operator Detail ── */}
                <div className="lg:col-span-9">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedOperator.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      {/* ── Operator Header ── */}
                      <div className="relative rounded overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "hsl(var(--card))" }}>
                        {/* Top accent line — operator color */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                          style={{ background: `linear-gradient(90deg, transparent, ${selectedOperator.color}, transparent)` }} />

                        {/* Watermark */}
                        <div className="absolute top-6 right-6 text-[80px] font-black pointer-events-none select-none" style={{ color: `${selectedOperator.color}06`, lineHeight: 1 }}>
                          {selectedOperator.sig}
                        </div>

                        <div className="p-6 md:p-8">
                          {/* Identity row */}
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                            <div className="flex items-center gap-5">
                              {/* Logo */}
                              <div
                                className="w-16 h-16 rounded flex items-center justify-center text-2xl font-black shrink-0"
                                style={{
                                  background: `${selectedOperator.color}18`,
                                  border: `1px solid ${selectedOperator.color}44`,
                                  color: selectedOperator.color,
                                }}
                              >
                                {selectedOperator.logo}
                              </div>

                              <div>
                                <div className="text-[9px] font-bold tracking-[0.25em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                                  {selectedOperator.sig} // FICHA TÉCNICA
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
                                  {selectedOperator.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                  <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    <MapPin className="w-3 h-3 text-red-500" />
                                    {selectedOperator.headquarters}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    <Calendar className="w-3 h-3 text-red-500" />
                                    EST. {selectedOperator.since}
                                  </span>
                                  {selectedOperator.website && (
                                    <a
                                      href={selectedOperator.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-[10px] font-bold transition-colors"
                                      style={{ color: selectedOperator.color }}
                                    >
                                      <Globe className="w-3 h-3" />
                                      WEBSITE
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Trend badge */}
                            <div className="shrink-0 text-right">
                              <div className="text-[9px] font-bold tracking-[0.25em] mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                                TENDÊNCIA
                              </div>
                              <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded text-[11px] font-bold tracking-widest"
                                style={{
                                  background: selectedOperator.trend === "up" ? "rgba(74,222,128,0.1)"
                                    : selectedOperator.trend === "down" ? "rgba(248,113,113,0.1)"
                                    : "rgba(56,189,248,0.1)",
                                  border: `1px solid ${selectedOperator.trend === "up" ? "rgba(74,222,128,0.2)"
                                    : selectedOperator.trend === "down" ? "rgba(248,113,113,0.2)"
                                    : "rgba(56,189,248,0.2)"}`,
                                  color: selectedOperator.trend === "up" ? "#4ade80"
                                    : selectedOperator.trend === "down" ? "#f87171"
                                    : "#38bdf8",
                                }}
                              >
                                {selectedOperator.trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : selectedOperator.trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                {selectedOperator.trend === "up" ? "CRESCIMENTO" : selectedOperator.trend === "down" ? "DECLÍNIO" : "ESTÁVEL"}
                              </div>
                            </div>
                          </div>

                          {/* KPI row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            {[
                              { label: "PRODUÇÃO",    value: `${selectedOperator.production}K`, sub: "BPD",       icon: Droplets,   color: "#38bdf8" },
                              { label: "MARKET SHARE",value: `${selectedOperator.marketShare}%`, sub: "NACIONAL", icon: PieChart,   color: "#4ade80" },
                              { label: "INVESTIMENTO",value: `$${selectedOperator.investmentYTD}B`, sub: "YTD",  icon: BarChart3,  color: "#fb923c" },
                              { label: "EFICIÊNCIA",  value: `${selectedOperator.efficiency}%`, sub: "OPS",      icon: Gauge,      color: "#a78bfa" },
                            ].map((stat, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                                  <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>{stat.value}</span>
                                  <span className="text-[9px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>{stat.sub}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── Charts Row ── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Radar */}
                        <div className="rounded overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                            <Shield className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              SCORE DE PERFORMANCE // RADAR
                            </span>
                          </div>
                          <div className="h-[260px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                <PolarAngleAxis
                                  dataKey="subject"
                                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}
                                />
                                <Radar
                                  name={selectedOperator.shortName}
                                  dataKey="A"
                                  stroke={selectedOperator.color}
                                  fill={selectedOperator.color}
                                  fillOpacity={0.15}
                                  strokeWidth={2}
                                />
                                <Tooltip content={<TerminalTooltip />} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Area chart */}
                        <div className="rounded overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                            <Radio className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              EVOLUÇÃO MARKET SHARE // 2021-2024
                            </span>
                          </div>
                          <div className="h-[260px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={marketShareHistory}>
                                <defs>
                                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={selectedOperator.color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={selectedOperator.color} stopOpacity={0}   />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false}
                                  tick={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false}
                                  tick={{ fontFamily: "'IBM Plex Mono', monospace" }} />
                                <Tooltip content={<TerminalTooltip />} />
                                <Area
                                  type="monotone"
                                  dataKey={msKey}
                                  stroke={selectedOperator.color}
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#areaGrad)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* ── Tech Details Row ── */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "UPTIME",         value: `${selectedOperator.uptime}%`,         color: "#4ade80" },
                          { label: "DECLÍNIO",       value: `${selectedOperator.declineRate}%/ANO`, color: "#f87171" },
                          { label: "CUSTO/BARRIL",   value: `$${selectedOperator.costPerBarrel}`,   color: "#fb923c" },
                          { label: "RESERVAS",       value: `${selectedOperator.reserves}BB`,       color: "#38bdf8" },
                        ].map((d, i) => (
                          <div key={i} className="rounded p-4"
                            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                            <div className="text-[9px] font-bold tracking-[0.2em] mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>{d.label}</div>
                            <div className="text-lg font-bold tabular-nums" style={{ color: d.color, letterSpacing: "-0.02em" }}>{d.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── Projects & Blocks ── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Projects */}
                        <div className="rounded overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                            <Factory className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              PROJECTOS ACTIVOS // {selectedOperator.projects.length} REGISTOS
                            </span>
                          </div>
                          <div className="p-4 flex flex-wrap gap-2">
                            {selectedOperator.projects.map((project, i) => (
                              <span key={i}
                                className="inline-flex items-center text-[10px] font-bold tracking-wider px-3 py-2 rounded"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "hsl(var(--muted-foreground))",
                                }}>
                                {project}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Blocks */}
                        <div className="rounded overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                            <MapPin className="w-3 h-3" style={{ color: selectedOperator.color }} />
                            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              BLOCOS OPERADOS // {selectedOperator.blocks.length} CONCESSÕES
                            </span>
                          </div>
                          <div className="p-4 flex flex-wrap gap-2">
                            {selectedOperator.blocks.map((block, i) => (
                              <span key={i}
                                className="inline-flex items-center text-[10px] font-bold tracking-wider px-3 py-2 rounded"
                                style={{
                                  background: `${selectedOperator.color}12`,
                                  border: `1px solid ${selectedOperator.color}28`,
                                  color: selectedOperator.color,
                                }}>
                                {block}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── Employee bar ── */}
                      <div className="rounded p-5"
                        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              FORÇA DE TRABALHO // COLABORADORES
                            </span>
                          </div>
                          <span className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
                            {selectedOperator.employees.toLocaleString("pt-BR")} EMP.
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, #dc2626, ${selectedOperator.color})` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((selectedOperator.employees / 8000) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[8px]" style={{ color: "hsl(var(--muted-foreground))" }}>0</span>
                          <span className="text-[8px]" style={{ color: "hsl(var(--muted-foreground))" }}>8.000 EMP.</span>
                        </div>
                      </div>

                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Operators;