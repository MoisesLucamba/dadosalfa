import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  BarChart3,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* ─────────────────────────────────────────
   THEME VARS (semantic)
───────────────────────────────────────── */
const TV = {
  bgSurface: "hsl(var(--card))",
  bgPrimary: "hsl(var(--background))",
  border: "hsl(var(--border))",
  text: "hsl(var(--foreground))",
  textSecondary: "hsl(var(--muted-foreground))",
  textMuted: "hsl(var(--muted-foreground) / 0.6)",
  accentBlue: "hsl(var(--primary))",
  accentAmber: "hsl(var(--accent))",
  accentGreen: "hsl(var(--success))",
  accentRed: "hsl(var(--destructive))",
};

/* ─────────────────────────────────────────
   DATA  (unchanged)
───────────────────────────────────────── */
const brentHistoryData = [
  { date: "Jan", price: 82.5, volume: 125 },
  { date: "Fev", price: 79.8, volume: 118 },
  { date: "Mar", price: 81.2, volume: 132 },
  { date: "Abr", price: 84.6, volume: 145 },
  { date: "Mai", price: 78.3, volume: 128 },
  { date: "Jun", price: 76.9, volume: 115 },
  { date: "Jul", price: 80.1, volume: 138 },
  { date: "Ago", price: 77.5, volume: 122 },
  { date: "Set", price: 75.8, volume: 108 },
  { date: "Out", price: 78.2, volume: 135 },
  { date: "Nov", price: 78.5, volume: 142 },
];

const crudeComparison = [
  { name: "Brent",    price: 78.45, change: 1.8,  color: "#00A3FF" },
  { name: "WTI",      price: 74.12, change: 1.5,  color: "#00D4AA" },
  { name: "Cabinda",  price: 76.82, change: 1.9,  color: "#F5A623" },
  { name: "Girassol", price: 77.18, change: 2.1,  color: "#00A3FF" },
  { name: "Dalia",    price: 76.95, change: 1.7,  color: "#00D4AA" },
  { name: "Nemba",    price: 76.40, change: -1.4, color: "#FF6B35" },
];

const spreadData = [
  { date: "Nov 1",  brentWti: 4.2, cabindaBrent: -1.8 },
  { date: "Nov 5",  brentWti: 4.5, cabindaBrent: -1.6 },
  { date: "Nov 10", brentWti: 4.1, cabindaBrent: -1.9 },
  { date: "Nov 15", brentWti: 4.3, cabindaBrent: -1.7 },
  { date: "Nov 20", brentWti: 4.4, cabindaBrent: -1.5 },
];

const opecNews = [
  { date: "15 Nov 2024", title: "OPEP+ mantém cortes de produção até Q1 2025",            impact: "positivo", description: "Decisão apoia preços a curto prazo, beneficiando exportadores africanos." },
  { date: "12 Nov 2024", title: "Arábia Saudita sinaliza extensão de cortes voluntários", impact: "positivo", description: "Redução adicional de 1M bpd pode elevar Brent acima de $80." },
  { date: "8 Nov 2024",  title: "Rússia cumpre parcialmente quotas de produção",          impact: "neutro",   description: "Incerteza sobre compliance total pode limitar ganhos de preço." },
  { date: "5 Nov 2024",  title: "Demanda chinesa abaixo das expectativas",                impact: "negativo", description: "Crescimento económico lento na China pressiona demanda global." },
];

const volatilityData = [
  { period: "1 Semana",  value: 12.5 },
  { period: "1 Mês",     value: 18.2 },
  { period: "3 Meses",   value: 22.8 },
  { period: "6 Meses",   value: 28.4 },
  { period: "1 Ano",     value: 32.1 },
];

/* ─────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1E2A45", border: "1px solid var(--border-subtle)",
      borderRadius: 6, padding: "10px 14px", fontSize: 11,
    }}>
      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", color: e.color || e.fill || "var(--accent-blue)", margin: "2px 0" }}>
          {e.name}: {e.value != null ? (typeof e.value === "number" ? e.value.toFixed(2) : e.value) : "—"}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const impactMeta = (impact: string) => ({
  positivo: { color: "var(--accent-green)", bg: "rgba(0,212,170,0.10)", Icon: ArrowUpRight },
  negativo: { color: "var(--accent-red)",   bg: "rgba(255,107,53,0.10)", Icon: ArrowDownRight },
  neutro:   { color: "var(--text-secondary)", bg: "rgba(107,122,153,0.10)", Icon: Minus },
}[impact] || { color: "var(--text-secondary)", bg: "rgba(107,122,153,0.10)", Icon: Minus });

const volatColor = (v: number) =>
  v > 25 ? "var(--accent-red)" : v > 15 ? "var(--accent-amber)" : "var(--accent-green)";

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
    {children}
  </span>
);

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
const Prices = () => {
  const kpis = [
    { label: "Brent Crude",  value: "$78.45", change: 1.8,  sub: "USD/bbl",  icon: DollarSign },
    { label: "WTI Crude",    value: "$74.12", change: 1.5,  sub: "USD/bbl",  icon: DollarSign },
    { label: "Spread B-W",   value: "$4.33",  change: 0.3,  sub: "Diferencial", icon: Activity },
    { label: "Volatilidade", value: "18.2%",  change: -2.1, sub: "IV 30d",   icon: Zap },
  ];

  return (
    <>
      <Helmet>
        <title>Preços & Mercado | AlphaData</title>
      </Helmet>

      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar activeItem="/prices" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Header activeItem="/prices" />

          <main style={{ flex: 1, overflowY: "auto", padding: "32px", paddingBottom: 80 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>

              {/* ── PAGE HEADER ── */}
              <div className="fade-up d1" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Globe size={12} style={{ color: "var(--accent-blue)" }} />
                    <SectionLabel>Global Market Intelligence</SectionLabel>
                  </div>
                  <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                    Preços &amp; Mercado
                  </h1>
                  <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Benchmarks globais e análise de spreads para o crude angolano.
                  </p>
                </div>
                <DataExportButton
                  data={brentHistoryData.map((d, i) => ({ ...d, date: `2024-${String(i + 1).padStart(2, "0")}-01` }))}
                  columns={[
                    { key: "date", header: "Data" },
                    { key: "price", header: "Preço (USD)" },
                    { key: "volume", header: "Volume" },
                  ]}
                  filename="precos_brent"
                  dateField="date"
                />
              </div>

              {/* ── KPI CARDS ── */}
              <div className="fade-up d2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
                {kpis.map((kpi, i) => {
                  const up = kpi.change >= 0;
                  const Icon = kpi.icon;
                  return (
                    <div key={i} className="surface-card" style={{
                      padding: 20, background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)", borderRadius: 8,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.4)", cursor: "default",
                    }}>
                      {/* top row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ padding: 8, borderRadius: 6, background: "rgba(0,163,255,0.08)", color: "var(--accent-blue)", display: "flex" }}>
                          <Icon size={16} />
                        </div>
                        <span className="mono" style={{
                          fontSize: 11, fontWeight: 600,
                          color: up ? "var(--accent-green)" : "var(--accent-red)",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {up ? "+" : ""}{kpi.change}%
                        </span>
                      </div>
                      {/* value */}
                      <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
                        {kpi.value}
                      </div>
                      {/* label */}
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-secondary)" }}>
                          {kpi.label}
                        </span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--text-muted)" }}>
                          {kpi.sub}
                        </span>
                      </div>
                      {/* hairline accent */}
                      <div style={{ marginTop: 12, height: 1, background: `linear-gradient(90deg, ${up ? "var(--accent-green)" : "var(--accent-red)"} 0%, transparent 100%)`, opacity: 0.35 }} />
                    </div>
                  );
                })}
              </div>

              {/* ── BRENT HISTORY CHART ── */}
              <div className="fade-up d3 surface-card" style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                overflow: "hidden", marginBottom: 32,
              }}>
                {/* header bar */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Histórico Brent Crude
                    </h3>
                    <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      Análise de preço vs liquidez de mercado
                    </p>
                  </div>
                  {/* legend */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 14px", border: "1px solid var(--border-subtle)", borderRadius: 6, background: "var(--bg-primary)" }}>
                    {[{ color: "var(--accent-blue)", label: "Preço" }, { color: "var(--text-muted)", label: "Volume" }].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "24px 16px 16px", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={brentHistoryData}>
                      <defs>
                        <linearGradient id="gBrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00A3FF" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#00A3FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeOpacity={0.5} strokeDasharray="4 4" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Outfit" }} dy={8} />
                      <YAxis yAxisId="price" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "IBM Plex Mono" }} domain={[70, 90]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area yAxisId="price" type="monotone" dataKey="price" name="Brent" stroke="var(--accent-blue)" fill="url(#gBrent)" strokeWidth={2} animationDuration={800} />
                      <Bar yAxisId="price" dataKey="volume" fill="var(--text-muted)" fillOpacity={0.12} radius={[2, 2, 0, 0]} barSize={14} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── BENCHMARKS + SPREADS ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>

                {/* Benchmarks table */}
                <div className="fade-up d4 surface-card" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Benchmarks</h3>
                      <SectionLabel>Comparativo em Tempo Real</SectionLabel>
                    </div>
                    <BarChart3 size={18} style={{ color: "var(--text-muted)" }} />
                  </div>

                  {/* table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 0, padding: "10px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Crude", "Spot (USD)", "24h"].map((h, i) => (
                      <span key={i} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", textAlign: i > 0 ? "right" : "left" }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {crudeComparison.map((crude, i) => {
                    const up = crude.change >= 0;
                    return (
                      <div key={crude.name} className="data-row" style={{
                        display: "grid", gridTemplateColumns: "1fr auto auto", gap: 0,
                        padding: "14px 24px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 3, height: 20, borderRadius: 2, background: crude.color, opacity: 0.8 }} />
                          <div>
                            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{crude.name}</div>
                            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "var(--text-muted)" }}>Spot</div>
                          </div>
                        </div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                          ${crude.price.toFixed(2)}
                        </span>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: up ? "var(--accent-green)" : "var(--accent-red)", textAlign: "right", paddingLeft: 20, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {up ? "+" : ""}{crude.change}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Spreads chart */}
                <div className="fade-up d5 surface-card" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Spreads de Referência</h3>
                    <SectionLabel>Diferenciais de Mercado</SectionLabel>
                  </div>

                  <div style={{ flex: 1, padding: "24px 16px 8px", minHeight: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spreadData}>
                        <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeOpacity={0.5} strokeDasharray="3 3" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "Outfit" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} domain={[-3, 6]} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="stepAfter" dataKey="brentWti"     name="Brent-WTI"     stroke="var(--accent-blue)"  strokeWidth={2} dot={false} />
                        <Line type="stepAfter" dataKey="cabindaBrent" name="Cabinda-Brent" stroke="var(--accent-amber)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* spread stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid var(--border-subtle)" }}>
                    {[
                      { label: "Brent-WTI",    value: "+$4.33", color: "var(--accent-blue)" },
                      { label: "Cabinda-Brent", value: "-$1.63", color: "var(--accent-amber)" },
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: "16px 24px",
                        borderRight: i === 0 ? "1px solid var(--border-subtle)" : "none",
                      }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: s.color, marginBottom: 6 }}>
                          {s.label}
                        </div>
                        <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── OPEC + VOLATILITY ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>

                {/* OPEC news */}
                <div className="fade-up d5">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Impacto OPEP+</h3>
                    <SectionLabel>Latest Updates</SectionLabel>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {opecNews.map((news, i) => {
                      const { color, bg, Icon } = impactMeta(news.impact);
                      return (
                        <div key={i} className="surface-card" style={{
                          padding: 20, background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)", borderRadius: 8,
                          boxShadow: "0 4px 24px rgba(0,0,0,0.4)", cursor: "default",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock size={12} style={{ color: "var(--text-muted)" }} />
                              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--text-muted)" }}>{news.date}</span>
                            </div>
                            <span className="badge-pill" style={{ color, background: bg }}>
                              {news.impact}
                            </span>
                          </div>
                          <h4 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.4 }}>
                            {news.title}
                          </h4>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                            {news.description}
                          </p>
                          {/* left accent border on read */}
                          <div style={{ marginTop: 14, height: 1, background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, opacity: 0.30 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Volatility */}
                <div className="fade-up d6 surface-card" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Volatilidade</h3>
                    <Zap size={18} style={{ color: "var(--accent-amber)" }} />
                  </div>

                  <div style={{ padding: "20px 24px" }}>
                    {volatilityData.map((item, i) => (
                      <div key={item.period} style={{ marginBottom: i < volatilityData.length - 1 ? 20 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
                            {item.period}
                          </span>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: volatColor(item.value) }}>
                            {item.value}%
                          </span>
                        </div>
                        <div style={{ height: 2, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / 40) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                            style={{ height: "100%", borderRadius: 2, background: volatColor(item.value) }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* average block */}
                    <div style={{
                      marginTop: 24, padding: "14px 16px",
                      background: "var(--bg-primary)", borderRadius: 6,
                      border: "1px solid var(--border-subtle)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-muted)", marginBottom: 4 }}>
                          Média do Sector
                        </div>
                        <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>21.4%</span>
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--accent-amber)" }}>IV 30d</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── WHAT-IF SIMULATOR ── */}
              <div className="fade-up d6" style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
              }}>
                <WhatIfSimulator />
              </div>

            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </>
  );
};

export default Prices;