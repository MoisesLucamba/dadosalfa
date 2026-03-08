import { useMemo, useState, useCallback } from "react";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  DollarSign,
  Ship,
  RefreshCw,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { KPICard } from "@/components/dashboard/KPICard";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { ExportsMap } from "@/components/dashboard/ExportsMap";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { OperatorsTable } from "@/components/dashboard/OperatorsTable";
import { DataSourceIndicator, DATA_SOURCES } from "@/components/dashboard/DataSourceIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { useProductionData, usePriceData, useExportData } from "@/hooks/useData";
import { useLatestDataUpdates, formatLastUpdate, getSourceShortName } from "@/hooks/useDataUpdates";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

/* ─────────────────────────────────────────
   THEME VARS (semantic, for inline styles only)
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
   UTILITIES  (unchanged logic)
───────────────────────────────────────── */
const formatVolume = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M bpd`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K bpd`;
  return `${value.toFixed(0)} bpd`;
};

const formatCurrency = (value: number, compact = false) => {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
};

/* ─────────────────────────────────────────
   KPI HOOK  (unchanged logic)
───────────────────────────────────────── */
const useDashboardKPIs = (productionData: any[], priceData: any[], exportData: any[]) =>
  useMemo(() => {
    const latestDate = productionData?.[0]?.data_date;
    const latestProd = productionData?.filter(p => p.data_date === latestDate) || [];
    const totalDailyProd = latestProd.reduce((s, p) => s + Number(p.daily_production || 0), 0);
    const prevProdData = productionData?.filter(p => p.data_date !== latestDate) || [];
    const prevDate = [...new Set(prevProdData.map(p => p.data_date))].sort().reverse()[0];
    const prevTotalProd = prevProdData.filter(p => p.data_date === prevDate).reduce((s, p) => s + Number(p.daily_production || 0), 0);
    const prodChange = prevTotalProd > 0 ? ((totalDailyProd - prevTotalProd) / prevTotalProd) * 100 : 0;

    const brent = priceData?.find(p => p.crude_type.toLowerCase().includes("brent"));
    const brentPrice = brent?.price || 0;
    const brentChange = brent?.change_percent || 0;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentExports = exportData?.filter(e => e.data_date.startsWith(currentMonth)) || [];
    const totalExportVol = currentExports.reduce((s, e) => s + Number(e.volume || 0), 0);
    const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    const prevExports = exportData?.filter(e => e.data_date.startsWith(prevMonth)) || [];
    const prevExportVol = prevExports.reduce((s, e) => s + Number(e.volume || 0), 0);
    const exportChange = prevExportVol > 0 ? ((totalExportVol - prevExportVol) / prevExportVol) * 100 : 0;

    const totalExportVal = currentExports.reduce((s, e) => s + Number(e.value_usd || 0), 0);
    const estRevenue = totalExportVal > 0 ? totalExportVal : totalExportVol * brentPrice;
    const prevRevenue = prevExportVol * (brentPrice * (1 - brentChange / 100));
    const revChange = prevRevenue > 0 ? ((estRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      production: { value: totalDailyProd, change: prodChange, formatted: formatVolume(totalDailyProd) },
      brent:      { value: brentPrice,     change: brentChange, formatted: formatCurrency(brentPrice) },
      exports:    { value: totalExportVol, change: exportChange, formatted: `${(totalExportVol / 1000000).toFixed(1)}M bbl` },
      revenue:    { value: estRevenue,     change: revChange,   formatted: formatCurrency(estRevenue, true) },
    };
  }, [productionData, priceData, exportData]);

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
    {children}
  </span>
);

/* ─────────────────────────────────────────
   KPI MINI CARD  (inline, theme-native)
───────────────────────────────────────── */
const KPIBlock = ({
  label, value, change, unit, icon: Icon, accentColor = "var(--accent-blue)",
}: {
  label: string; value: string; change: number; unit: string;
  icon: React.ComponentType<any>; accentColor?: string;
}) => {
  const up = change >= 0;
  return (
    <div className="surface-card" style={{
      padding: 20, background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)", borderRadius: 8,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)", cursor: "default",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 6, background: `${accentColor}14`, color: accentColor, display: "flex" }}>
          <Icon size={16} />
        </div>
        {change !== 0 && (
          <span className="mono" style={{
            fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
            color: up ? "var(--accent-green)" : "var(--accent-red)",
          }}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? "+" : ""}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{unit}</span>
      </div>
      {/* hairline gradient */}
      <div style={{ marginTop: 12, height: 1, background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`, opacity: 0.28 }} />
    </div>
  );
};

/* ─────────────────────────────────────────
   PRICE TICKER  (replaces PriceCard slots)
───────────────────────────────────────── */
const PriceTicker = ({ name, price, change }: { name: string; price: number; change: number }) => {
  const up = change >= 0;
  return (
    <div className="surface-card" style={{
      padding: "14px 20px", background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)", borderRadius: 8,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <SectionLabel>{name}</SectionLabel>
        <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>
          ${price.toFixed(2)}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <span className="mono" style={{
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
          color: up ? "var(--accent-green)" : "var(--accent-red)",
          justifyContent: "flex-end",
        }}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {up ? "+" : ""}{change.toFixed(2)}%
        </span>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
          USD/bbl
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const Index = () => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const { showTour, trigger: triggerTour, reset: resetTour } = useOnboardingTour();

  const { data: prodData,   isLoading: loadProd,   refetch: refetchProd  } = useProductionData();
  const { data: priceData,  isLoading: loadPrice,  refetch: refetchPrice } = usePriceData();
  const { data: exportData, isLoading: loadExport, refetch: refetchExport } = useExportData();
  const { data: updates } = useLatestDataUpdates();
  const { data: isAdmin }  = useIsAdmin();

  const isLoading = loadProd || loadPrice || loadExport;
  const kpis = useDashboardKPIs(prodData || [], priceData || [], exportData || []);

  const handleSyncPrices = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-oil-prices", { body: { action: "sync" } });
      if (error) throw error;
      if (data?.success) {
        toast.success("Mercado Sincronizado", { description: data.data?.source || "Preços atualizados em tempo real" });
        refetchPrice();
      } else throw new Error(data?.error || "Falha na sincronização");
    } catch (err: any) {
      const isRateLimit = err.message?.includes("429") || err.message?.includes("Rate limit");
      toast.error(isRateLimit ? "Limite atingido" : "Erro de conexão", {
        description: isRateLimit ? "Aguarde um momento" : "Não foi possível atualizar os preços",
      });
    } finally { setIsSyncing(false); }
  }, [refetchPrice]);

  const handleRefreshAll = () => {
    Promise.all([refetchProd(), refetchPrice(), refetchExport()]);
    toast.info("Atualizando dashboard...");
  };

  const topPriceCards = useMemo(() => {
    return ["Brent", "Cabinda", "Girassol"].map(t => {
      const entry = priceData?.find(p => p.crude_type.toLowerCase().includes(t.toLowerCase()));
      return { name: t, price: entry?.price || 0, change: entry?.change_percent || 0 };
    }).filter(p => p.price > 0);
  }, [priceData]);

  const hasNoData = !isLoading && (!prodData?.length && !priceData?.length && !exportData?.length);

  const kpiDefs = [
    { key: "production", label: "Produção Diária", unit: "bpd",      icon: TrendingUp,  accent: "var(--accent-blue)"  },
    { key: "brent",      label: "Brent Crude",     unit: "USD/bbl",  icon: DollarSign,  accent: "var(--accent-amber)" },
    { key: "exports",    label: "Exportações",      unit: "mensal",   icon: Ship,        accent: "var(--accent-green)" },
    { key: "revenue",    label: "Receita Est.",     unit: "USD",      icon: BarChart3,   accent: "var(--accent-blue)"  },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Helmet><title>AlphaData | Intelligence Hub</title></Helmet>

      <Sidebar activeItem="/" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* mesh glow */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 500, height: 500, background: "radial-gradient(circle, rgba(0,163,255,0.03) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        <Header activeItem="/" onHelpClick={triggerTour} />

        <main style={{ flex: 1, overflowY: "auto", padding: "32px", paddingBottom: 88, position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>

            {/* ── PAGE HEADER ── */}
            <div className="fade-up d1" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <LayoutDashboard size={12} style={{ color: "var(--accent-blue)" }} />
                  <SectionLabel>Visão Geral</SectionLabel>
                </div>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                  Dashboard Principal
                </h1>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 4, maxWidth: 440 }}>
                  Monitoramento em tempo real do ecossistema petrolífero de Angola.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Live Prices button */}
                <button
                  onClick={handleSyncPrices}
                  disabled={isSyncing}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 6,
                    background: "transparent", border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)", fontFamily: "'Outfit',sans-serif",
                    fontSize: 13, fontWeight: 600, cursor: isSyncing ? "not-allowed" : "pointer",
                    opacity: isSyncing ? 0.6 : 1,
                    transition: "border-color 180ms ease-out",
                  }}
                  onMouseOver={e => !isSyncing && ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)")}
                  onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)")}
                >
                  <Zap size={14} style={{ color: "var(--accent-amber)", animation: isSyncing ? "pulse 1s ease-in-out infinite" : "none" }} />
                  {isSyncing ? "Sincronizando..." : "Live Prices"}
                </button>

                {/* Refresh button */}
                <button
                  onClick={handleRefreshAll}
                  disabled={isLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 6,
                    background: "var(--accent-blue)", border: "none",
                    color: "#0A0E1A", fontFamily: "'Outfit',sans-serif",
                    fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "filter 180ms ease-out",
                  }}
                  onMouseOver={e => !isLoading && ((e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)")}
                  onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.filter = "none")}
                >
                  <RefreshCw size={14} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
                  Atualizar
                </button>
              </div>
            </div>

            {/* ── ALERT ── */}
            {hasNoData && (
              <div className="fade-up d1" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderRadius: 8, marginBottom: 24,
                background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)",
                borderLeft: "3px solid var(--accent-red)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={16} style={{ color: "var(--accent-red)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "var(--text-primary)" }}>
                    Nenhum dado encontrado para o período atual.
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    style={{
                      fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      color: "var(--accent-red)", background: "transparent",
                      border: "1px solid rgba(255,107,53,0.30)", borderRadius: 4,
                      padding: "4px 12px", cursor: "pointer",
                    }}
                  >
                    Configurar
                  </button>
                )}
              </div>
            )}

            {/* ── KPI GRID ── */}
            <div className="fade-up d2" data-tour="kpi-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {isLoading
                ? [...Array(4)].map((_, i) => <div key={i} className="skeleton-dark" style={{ height: 128 }} />)
                : kpiDefs.map((def, i) => {
                    const data = kpis[def.key as keyof typeof kpis];
                    return (
                      <KPIBlock
                        key={def.key}
                        label={def.label}
                        value={data.formatted}
                        change={data.change}
                        unit={def.unit}
                        icon={def.icon}
                        accentColor={def.accent}
                      />
                    );
                  })
              }
            </div>

            {/* ── PRICE TICKERS ── */}
            <div className="fade-up d3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
              {isLoading
                ? [...Array(3)].map((_, i) => <div key={i} className="skeleton-dark" style={{ height: 72 }} />)
                : topPriceCards.map((card, i) => (
                    <PriceTicker key={card.name} {...card} />
                  ))
              }
            </div>

            {/* ── MAIN CONTENT GRID ── */}
            <div className="fade-up d4" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>

              {/* left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div data-tour="production-chart" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <ProductionChart />
                </div>
                <div style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <OperatorsTable />
                </div>
              </div>

              {/* right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div data-tour="export-btn" style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <ExportsMap />
                </div>

                {/* AI Insights panel — amber accent */}
                <div style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderTop: "2px solid var(--accent-amber)",
                  borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  <AIInsights />
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="fade-up d6" style={{ paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
              <DataSourceIndicator
                sources={[...DATA_SOURCES.prices, ...DATA_SOURCES.production, ...DATA_SOURCES.exports]}
              />
            </div>

          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Onboarding Tour */}
      <OnboardingTour forceShow={showTour} onComplete={resetTour} />
    </div>
  );
};

export default Index;