import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DataExportButton } from "@/components/dashboard/DataExportButton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ship, Globe, Clock, DollarSign, Anchor,
  TrendingUp, MapPin, Activity, Box,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useExportData } from "@/hooks/useData";

/* ─── Theme vars ──────────────────────────────────────────────────────── */
const TV = {
  bgSurface: "hsl(var(--card))",
  border: "hsl(var(--border))",
  text: "hsl(var(--foreground))",
  textSecondary: "hsl(var(--muted-foreground))",
};

/* ─── Tooltip ─────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 text-xs font-medium bg-card border border-border rounded-md shadow-lg">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-primary font-bold">{payload[0]?.value?.toLocaleString()} bbl</div>
    </div>
  );
};

/* ─── Status Badge ────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || "";
  const map: Record<string, { label: string; cls: string }> = {
    in_transit:  { label: "Em Trânsito", cls: "bg-primary/10 text-primary border-primary/20" },
    arrived:     { label: "Chegou",      cls: "bg-success/10 text-success border-success/20" },
    loading:     { label: "A Carregar",  cls: "bg-accent/10 text-accent border-accent/20" },
    delivered:   { label: "Entregue",    cls: "bg-success/10 text-success border-success/20" },
  };
  const config = map[s] || { label: status || "—", cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded border ${config.cls}`}>
      {config.label}
    </span>
  );
};

const DEST_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316"];

/* ═════════════════════════════════════════════════════════════════════════ */
const Exports = () => {
  const { data: exportData, isLoading } = useExportData();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  /* ── Derived data from real DB ────────────────────────────────────────── */
  const monthlyVolumes = useMemo(() => {
    if (!exportData?.length) return [];
    const byMonth: Record<string, number> = {};
    exportData.forEach(e => {
      const d = new Date(e.data_date);
      const key = d.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }).toUpperCase();
      byMonth[key] = (byMonth[key] || 0) + Number(e.volume || 0);
    });
    return Object.entries(byMonth).slice(0, 12).reverse().map(([month, volume]) => ({ month, volume: Math.round(volume) }));
  }, [exportData]);

  const destinationBreakdown = useMemo(() => {
    if (!exportData?.length) return [];
    const byDest: Record<string, number> = {};
    exportData.forEach(e => { byDest[e.destination] = (byDest[e.destination] || 0) + Number(e.volume || 0); });
    const total = Object.values(byDest).reduce((a, b) => a + b, 0);
    return Object.entries(byDest)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([country, volume], i) => ({
        country,
        volume: Math.round(volume),
        percentage: total > 0 ? Math.round((volume / total) * 100) : 0,
        color: DEST_COLORS[i % DEST_COLORS.length],
      }));
  }, [exportData]);

  const recentShipments = useMemo(() => {
    if (!exportData?.length) return [];
    return exportData.slice(0, 8).map(e => ({
      vessel: e.tanker_name || "—",
      destination: e.destination,
      volume: Number(e.volume || 0),
      departure: e.departure_date,
      eta: e.arrival_date,
      status: e.status || "in_transit",
      value: Number(e.value_usd || 0),
    }));
  }, [exportData]);

  const totalVolume = useMemo(() => exportData?.reduce((a, e) => a + Number(e.volume || 0), 0) || 0, [exportData]);
  const totalValue = useMemo(() => exportData?.reduce((a, e) => a + Number(e.value_usd || 0), 0) || 0, [exportData]);
  const uniqueDestinations = useMemo(() => new Set(exportData?.map(e => e.destination)).size, [exportData]);

  const kpis = [
    { label: "Volume Total", value: totalVolume > 1e6 ? `${(totalVolume / 1e6).toFixed(1)}M bbl` : `${(totalVolume / 1e3).toFixed(0)}K bbl`, icon: Ship, color: "hsl(var(--primary))" },
    { label: "Destinos Activos", value: String(uniqueDestinations), icon: Globe, color: "hsl(var(--success))" },
    { label: "Embarques", value: String(exportData?.length || 0), icon: Clock, color: "hsl(var(--accent))" },
    { label: "Receita Estimada", value: totalValue > 1e9 ? `$${(totalValue / 1e9).toFixed(1)}B` : `$${(totalValue / 1e6).toFixed(0)}M`, icon: DollarSign, color: "#fb923c" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Helmet><title>AlphaData — Exportações</title></Helmet>

      <Sidebar activeItem="/exports" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeItem="/exports" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Analytics / Exportações</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Exportações</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitorização de fluxos, destinos e infraestrutura portuária</p>
              </div>
              <DataExportButton
                data={recentShipments}
                columns={[
                  { key: "vessel", header: "Navio" },
                  { key: "destination", header: "Destino" },
                  { key: "volume", header: "Volume" },
                  { key: "status", header: "Status" },
                ]}
                filename="exportacoes_angola"
              />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative overflow-hidden rounded-lg p-5 bg-card border border-border card-hover group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <k.icon className="w-4 h-4" style={{ color: k.color }} />
                    <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground font-mono-data">{k.value}</div>
                  )}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Area Chart */}
              <div className="lg:col-span-8 rounded-lg overflow-hidden bg-card border border-border">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">Volume Mensal de Exportação</span>
                  </div>
                </div>
                <div className="p-5 h-[300px]">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : monthlyVolumes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyVolumes}>
                        <defs>
                          <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#exportGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados de exportação</div>
                  )}
                </div>
              </div>

              {/* Donut */}
              <div className="lg:col-span-4 rounded-lg overflow-hidden bg-card border border-border">
                <div className="px-5 py-4 border-b border-border bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">Destinos — Quota Global</span>
                </div>
                <div className="px-5 pt-4">
                  <div className="h-[160px]">
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={destinationBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="volume" strokeWidth={0}>
                            {destinationBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                          </Pie>
                          <Tooltip content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="px-3 py-2 text-xs font-medium bg-card border border-border rounded-md shadow-lg">
                                <span className="text-primary font-bold">{payload[0].name}: {Number(payload[0].value).toLocaleString()} bbl</span>
                              </div>
                            ) : null
                          } />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="pb-5 space-y-2 mt-2">
                    {destinationBreakdown.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-4 rounded-sm" style={{ background: d.color }} />
                          <span className="text-xs font-medium text-muted-foreground">{d.country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono-data">{d.volume.toLocaleString()}</span>
                          <span className="text-xs font-bold text-foreground font-mono-data">{d.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="rounded-lg overflow-hidden bg-card border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Embarques Recentes</span>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                  {recentShipments.length} registos
                </span>
              </div>

              {/* Desktop headers */}
              <div className="hidden sm:grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50"
                style={{ gridTemplateColumns: "1fr 100px 100px 80px" }}>
                <span>Navio / Destino</span>
                <span>Volume</span>
                <span>Valor</span>
                <span className="text-right">Status</span>
              </div>

              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : recentShipments.length > 0 ? (
                <div>
                  {recentShipments.map((ship, i) => (
                    <div key={i}>
                      {/* Desktop row */}
                      <div
                        className="hidden sm:grid px-5 py-3.5 transition-colors duration-150 relative border-b border-border/30 hover:bg-muted/30 cursor-default"
                        style={{ gridTemplateColumns: "1fr 100px 100px 80px", alignItems: "center" }}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {hoveredRow === i && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center rounded bg-muted border border-border">
                            <Ship className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{ship.vessel}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {ship.destination}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-foreground font-mono-data">{ship.volume.toLocaleString()} bbl</div>
                        <div className="text-sm text-muted-foreground font-mono-data">${(ship.value / 1e6).toFixed(1)}M</div>
                        <div className="flex justify-end"><StatusBadge status={ship.status} /></div>
                      </div>

                      {/* Mobile row */}
                      <div className="sm:hidden px-4 py-4 flex items-center justify-between border-b border-border/30">
                        <div>
                          <div className="text-sm font-medium text-foreground">{ship.vessel}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{ship.destination} · {ship.volume.toLocaleString()} bbl</div>
                        </div>
                        <StatusBadge status={ship.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">Sem dados de exportação</div>
              )}
            </div>

          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Exports;
