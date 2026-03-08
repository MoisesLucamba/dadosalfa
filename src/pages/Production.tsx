import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import {
  BarChart3,
  TrendingDown,
  Factory,
  Gauge,
  Droplets,
  MapPin,
  ChevronRight,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
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
const productionTrendData = [
  { month: "Jan", production: 1120, capacity: 1350 },
  { month: "Fev", production: 1098, capacity: 1350 },
  { month: "Mar", production: 1085, capacity: 1350 },
  { month: "Abr", production: 1110, capacity: 1350 },
  { month: "Mai", production: 1075, capacity: 1350 },
  { month: "Jun", production: 1092, capacity: 1350 },
  { month: "Jul", production: 1065, capacity: 1350 },
  { month: "Ago", production: 1088, capacity: 1350 },
  { month: "Set", production: 1070, capacity: 1350 },
  { month: "Out", production: 1095, capacity: 1350 },
  { month: "Nov", production: 1080, capacity: 1350 },
  { month: "Dez", production: 1078, capacity: 1350 },
];

const operatorProductionData = [
  { name: "TotalEnergies", production: 285, color: "#00A3FF" },
  { name: "Chevron",       production: 198, color: "#00D4AA" },
  { name: "Sonangol EP",   production: 175, color: "#F5A623" },
  { name: "ENI Angola",    production: 168, color: "#00A3FF" },
  { name: "BP Angola",     production: 145, color: "#00D4AA" },
  { name: "Outros",        production: 109, color: "#3D4F6E" },
];

const blockProductionData = [
  { block: "Bloco 17", production: 320, operator: "TotalEnergies", trend:  1.2 },
  { block: "Bloco 0",  production: 210, operator: "Chevron",       trend:  0.8 },
  { block: "Bloco 15", production: 185, operator: "ENI Angola",    trend: -2.5 },
  { block: "Bloco 18", production: 165, operator: "BP Angola",     trend:  1.1 },
  { block: "Bloco 31", production: 142, operator: "BP Angola",     trend: -0.5 },
  { block: "Bloco 32", production: 128, operator: "TotalEnergies", trend:  2.3 },
];

const fieldStatusData = [
  { name: "Produzindo",     value: 45, color: "#00D4AA" },
  { name: "Desenvolvimento",value: 12, color: "#00A3FF" },
  { name: "Exploração",     value:  8, color: "#F5A623" },
  { name: "Manutenção",     value:  5, color: "#3D4F6E" },
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
      <p style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", color: e.color || e.fill || "var(--accent-blue)", margin: "2px 0" }}>
          {e.name}: {e.value != null ? (typeof e.value === "number" ? e.value.toLocaleString() : e.value) : "—"}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
    {children}
  </span>
);

const CardHeader = ({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) => (
  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <h3 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
      {sub && <div style={{ marginTop: 3 }}><SectionLabel>{sub}</SectionLabel></div>}
    </div>
    {right}
  </div>
);

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
const Production = () => {
  const kpis = [
    { label: "Produção Diária", value: "1.08M", unit: "bpd",  change: -2.1, icon: Gauge       },
    { label: "Capacidade",      value: "1.35M", unit: "bpd",  change:  0,   icon: Factory     },
    { label: "Utilização",      value: "80%",   unit: "util", change: -1.5, icon: Droplets    },
    { label: "Taxa Declínio",   value: "−3.2%", unit: "YoY",  change: -0.4, icon: TrendingDown},
  ];

  return (
    <>
      <Helmet>
        <title>Produção Petrolífera | AlphaData</title>
        <meta name="description" content="Dados de produção petrolífera de Angola por bloco, operadora e campo." />
      </Helmet>

      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar activeItem="/production" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Header activeItem="/production" />

          <main style={{ flex: 1, overflowY: "auto", padding: "32px", paddingBottom: 80 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>

              {/* ── PAGE HEADER ── */}
              <div className="fade-up d1" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)" }} />
                    <SectionLabel>Live Analytics</SectionLabel>
                  </div>
                  <h1 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                    Produção Petrolífera
                  </h1>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 4, maxWidth: 440 }}>
                    Monitorização em tempo real da extração por bloco e operadora em Angola.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 6,
                    background: "transparent", border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)", fontFamily: "'Epilogue',sans-serif",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "border-color 180ms ease-out",
                  }}
                  onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)"}
                  onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"}
                  >
                    <Info size={14} />Ajuda
                  </button>
                  <DataExportButton
                    data={blockProductionData.map(d => ({ ...d, date: new Date().toISOString().split("T")[0] }))}
                    columns={[
                      { key: "block",      header: "Bloco" },
                      { key: "operator",   header: "Operadora" },
                      { key: "production", header: "Produção (kbpd)" },
                      { key: "trend",      header: "Tendência (%)" },
                    ]}
                    filename="producao_petrolifera"
                    dateField="date"
                  />
                </div>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ padding: 8, borderRadius: 6, background: "rgba(0,163,255,0.08)", color: "var(--accent-blue)", display: "flex" }}>
                          <Icon size={16} />
                        </div>
                        {kpi.change !== 0 && (
                          <span className="mono" style={{
                            fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
                            color: up ? "var(--accent-green)" : "var(--accent-red)",
                          }}>
                            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {up ? "+" : ""}{kpi.change}%
                          </span>
                        )}
                      </div>
                      <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
                        {kpi.value}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-secondary)" }}>
                          {kpi.label}
                        </span>
                        <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{kpi.unit}</span>
                      </div>
                      <div style={{ marginTop: 12, height: 1, background: `linear-gradient(90deg, ${up || kpi.change === 0 ? "var(--accent-blue)" : "var(--accent-red)"} 0%, transparent 100%)`, opacity: 0.30 }} />
                    </div>
                  );
                })}
              </div>

              {/* ── PRODUCTION TREND CHART ── */}
              <div className="fade-up d3 surface-card" style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                overflow: "hidden", marginBottom: 32, position: "relative",
              }}>
                {/* subtle mesh glow */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, background: "radial-gradient(circle, rgba(0,163,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Tendência de Produção
                    </h3>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      Comparativo entre extração real e limite operacional
                    </p>
                  </div>
                  {/* legend */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "6px 14px", border: "1px solid var(--border-subtle)", borderRadius: 6, background: "var(--bg-primary)" }}>
                    {[
                      { color: "var(--accent-blue)", label: "Produção",   dash: false },
                      { color: "var(--text-muted)",  label: "Capacidade", dash: true  },
                    ].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 2, background: l.color, opacity: l.dash ? 0.5 : 1, borderTop: l.dash ? "2px dashed" : "2px solid", borderColor: l.color }} />
                        <SectionLabel>{l.label}</SectionLabel>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "24px 16px 16px", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productionTrendData}>
                      <defs>
                        <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00A3FF" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#00A3FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeOpacity={0.5} strokeDasharray="4 4" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "IBM Plex Mono" }} domain={[900, 1400]} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-subtle)", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="production" name="Produção"  stroke="var(--accent-blue)" fill="url(#gProd)" strokeWidth={2} animationDuration={800} />
                      <Area type="monotone" dataKey="capacity"   name="Capacidade" stroke="var(--text-muted)"  fill="transparent" strokeWidth={1.5} strokeDasharray="6 6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── OPERATORS + FIELD STATUS ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>

                {/* Operator bar chart */}
                <div className="fade-up d4 surface-card" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <CardHeader title="Produção por Operadora" sub="Market Share por Volume" right={<BarChart3 size={18} style={{ color: "var(--text-muted)" }} />} />
                  <div style={{ padding: "24px 16px 16px", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operatorProductionData} layout="vertical" margin={{ left: 0, right: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name" type="category" axisLine={false} tickLine={false}
                          tick={{ fill: "var(--text-secondary)", fontSize: 12, fontFamily: "DM Sans", fontWeight: 500 }}
                          width={110}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,163,255,0.04)" }} />
                        <Bar dataKey="production" name="kbpd" radius={[0, 4, 4, 0]} barSize={18}>
                          {operatorProductionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.75} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Field status donut */}
                <div className="fade-up d5 surface-card" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <CardHeader title="Status dos Campos" sub="Distribuição Operacional" />
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ height: 180, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={fieldStatusData} innerRadius={60} outerRadius={78} paddingAngle={6} dataKey="value" stroke="none">
                            {fieldStatusData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* center label */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <span className="mono" style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)" }}>70</span>
                        <SectionLabel>Campos</SectionLabel>
                      </div>
                    </div>

                    {/* legend grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                      {fieldStatusData.map((item) => (
                        <div key={item.name} style={{
                          padding: "10px 12px", background: "var(--bg-primary)",
                          borderRadius: 6, border: "1px solid var(--border-subtle)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                            <SectionLabel>{item.name}</SectionLabel>
                          </div>
                          <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BLOCKS TABLE ── */}
              <div className="fade-up d6" style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
              }}>
                {/* table header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Produção por Bloco
                    </h3>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      Detalhamento técnico por unidade de exploração
                    </p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 14px", borderRadius: 6,
                    background: "rgba(0,163,255,0.08)", border: "1px solid rgba(0,163,255,0.20)",
                  }}>
                    <MapPin size={14} style={{ color: "var(--accent-blue)" }} />
                    <span style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--accent-blue)" }}>
                      6 Blocos Activos
                    </span>
                  </div>
                </div>

                {/* col headers */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 48px", padding: "10px 24px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-primary)" }}>
                  {["Bloco", "Operadora", "Produção (kbpd)", "Tendência", ""].map((h, i) => (
                    <span key={i} style={{
                      fontFamily: "'Epilogue',sans-serif", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)",
                      textAlign: i >= 2 && i < 4 ? "right" : i === 4 ? "center" : "left",
                    }}>{h}</span>
                  ))}
                </div>

                {/* rows */}
                {blockProductionData.map((block, index) => {
                  const up = block.trend >= 0;
                  const blockNum = block.block.split(" ")[1];
                  return (
                    <div key={block.block} className="data-row" style={{
                      display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 48px",
                      padding: "14px 24px", alignItems: "center",
                      background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
                      borderBottom: index < blockProductionData.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      cursor: "pointer",
                    }}>
                      {/* block name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="row-icon" style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600,
                          color: "var(--text-muted)", transition: "background 180ms, color 180ms",
                          flexShrink: 0,
                        }}>
                          {blockNum}
                        </div>
                        <span className="row-name" style={{ fontFamily: "'Epilogue',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", transition: "color 180ms" }}>
                          {block.block}
                        </span>
                      </div>

                      {/* operator */}
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
                        {block.operator}
                      </span>

                      {/* production */}
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                        {block.production.toLocaleString()}
                      </span>

                      {/* trend badge */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span className="badge-pill" style={{
                          color: up ? "var(--accent-green)" : "var(--accent-red)",
                          background: up ? "rgba(0,212,170,0.10)" : "rgba(255,107,53,0.10)",
                        }}>
                          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {up ? "+" : ""}{block.trend}%
                        </span>
                      </div>

                      {/* chevron action */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button style={{
                          padding: 6, borderRadius: 6, border: "none",
                          background: "transparent", cursor: "pointer",
                          color: "var(--text-muted)", transition: "background 180ms, color 180ms",
                          display: "flex",
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface-hover)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </>
  );
};

export default Production;