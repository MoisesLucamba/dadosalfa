import { useMemo, useState, useCallback } from "react";
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
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";

// Layout Components
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

// Dashboard Components
import { KPICard } from "@/components/dashboard/KPICard";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { ExportsMap } from "@/components/dashboard/ExportsMap";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { OperatorsTable } from "@/components/dashboard/OperatorsTable";
import { DataSourceIndicator, DATA_SOURCES } from "@/components/dashboard/DataSourceIndicator";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Hooks & Integrations
import { useProductionData, usePriceData, useExportData } from "@/hooks/useData";
import { useLatestDataUpdates, formatLastUpdate, getSourceShortName } from "@/hooks/useDataUpdates";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

/**
 * UTILITIES: Number Formatting
 */
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
};

/**
 * CUSTOM HOOK: Dashboard KPI Logic
 * Encapsulates complex calculations for better readability
 */
const useDashboardKPIs = (productionData: any[], priceData: any[], exportData: any[]) => {
  return useMemo(() => {
    // 1. Production KPIs
    const latestDate = productionData?.[0]?.data_date;
    const latestProd = productionData?.filter(p => p.data_date === latestDate) || [];
    const totalDailyProd = latestProd.reduce((sum, p) => sum + Number(p.daily_production || 0), 0);
    
    const prevProdData = productionData?.filter(p => p.data_date !== latestDate) || [];
    const prevDate = [...new Set(prevProdData.map(p => p.data_date))].sort().reverse()[0];
    const prevTotalProd = prevProdData
      .filter(p => p.data_date === prevDate)
      .reduce((sum, p) => sum + Number(p.daily_production || 0), 0);

    const prodChange = prevTotalProd > 0 ? ((totalDailyProd - prevTotalProd) / prevTotalProd) * 100 : 0;

    // 2. Price KPIs (Brent)
    const brent = priceData?.find(p => p.crude_type.toLowerCase().includes("brent"));
    const brentPrice = brent?.price || 0;
    const brentChange = brent?.change_percent || 0;

    // 3. Export KPIs
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentExports = exportData?.filter(e => e.data_date.startsWith(currentMonth)) || [];
    const totalExportVol = currentExports.reduce((sum, e) => sum + Number(e.volume || 0), 0);
    
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    const prevExports = exportData?.filter(e => e.data_date.startsWith(prevMonth)) || [];
    const prevExportVol = prevExports.reduce((sum, e) => sum + Number(e.volume || 0), 0);
    
    const exportChange = prevExportVol > 0 ? ((totalExportVol - prevExportVol) / prevExportVol) * 100 : 0;

    // 4. Revenue KPIs
    const totalExportVal = currentExports.reduce((sum, e) => sum + Number(e.value_usd || 0), 0);
    const estRevenue = totalExportVal > 0 ? totalExportVal : totalExportVol * brentPrice;
    const prevRevenue = prevExportVol * (brentPrice * (1 - brentChange / 100));
    const revChange = prevRevenue > 0 ? ((estRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      production: { value: totalDailyProd, change: prodChange, formatted: formatVolume(totalDailyProd) },
      brent: { value: brentPrice, change: brentChange, formatted: formatCurrency(brentPrice) },
      exports: { value: totalExportVol, change: exportChange, formatted: `${(totalExportVol/1000000).toFixed(1)}M bbl` },
      revenue: { value: estRevenue, change: revChange, formatted: formatCurrency(estRevenue, true) }
    };
  }, [productionData, priceData, exportData]);
};

/**
 * MAIN COMPONENT: Index
 */
const Index = () => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  // Data Fetching
  const { data: prodData, isLoading: loadProd, refetch: refetchProd } = useProductionData();
  const { data: priceData, isLoading: loadPrice, refetch: refetchPrice } = usePriceData();
  const { data: exportData, isLoading: loadExport, refetch: refetchExport } = useExportData();
  const { data: updates } = useLatestDataUpdates();
  const { data: isAdmin } = useIsAdmin();

  const isLoading = loadProd || loadPrice || loadExport;
  const kpis = useDashboardKPIs(prodData || [], priceData || [], exportData || []);

  // Handlers
  const handleSyncPrices = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-oil-prices", {
        body: { action: "sync" }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Mercado Sincronizado", {
          description: data.data?.source || "Preços atualizados em tempo real"
        });
        refetchPrice();
      } else {
        throw new Error(data?.error || "Falha na sincronização");
      }
    } catch (err: any) {
      const isRateLimit = err.message?.includes("429") || err.message?.includes("Rate limit");
      toast.error(isRateLimit ? "Limite atingido" : "Erro de conexão", {
        description: isRateLimit ? "Aguarde um momento" : "Não foi possível atualizar os preços"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [refetchPrice]);

  const handleRefreshAll = () => {
    Promise.all([refetchProd(), refetchPrice(), refetchExport()]);
    toast.info("Atualizando dashboard...");
  };

  // Derived Data
  const topPriceCards = useMemo(() => {
    const types = ["Brent", "Cabinda", "Girassol"];
    return types.map(t => {
      const entry = priceData?.find(p => p.crude_type.toLowerCase().includes(t.toLowerCase()));
      return { name: t, price: entry?.price || 0, change: entry?.change_percent || 0 };
    }).filter(p => p.price > 0);
  }, [priceData]);

  const hasNoData = !isLoading && (!prodData?.length && !priceData?.length && !exportData?.length);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Helmet>
        <title>AlphaData | Intelligence Hub</title>
      </Helmet>

      <Sidebar activeItem="/" />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header activeItem="/" />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 scroll-smooth bg-background text-foreground">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Visão Geral</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Dashboard Principal
                </h1>
                <p className="text-muted-foreground max-w-md">
                  Monitoramento em tempo real do ecossistema petrolífero de Angola.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleSyncPrices}
                  disabled={isSyncing}
                  className="bg-card shadow-sm border-border hover:border-primary/50 transition-all"
                >
                  <Zap className={`w-4 h-4 mr-2 text-accent ${isSyncing ? 'animate-pulse' : ''}`} />
                  {isSyncing ? "Sincronizando..." : "Live Prices"}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleRefreshAll}
                  disabled={isLoading}
                  className="shadow-md shadow-primary/20"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </header>

            {/* Alerts */}
            {hasNoData && (
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <span>Nenhum dado encontrado para o período atual.</span>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => navigate("/admin")}>
                      Configurar Dados
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* KPI Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl shadow-sm" />)
              ) : (
                <>
                  <KPICard
                    title="Produção Diária"
                    value={kpis.production.formatted}
                    change={kpis.production.change}
                    icon={<TrendingUp className="w-5 h-5" />}
                    source={updates?.production ? getSourceShortName(updates.production.source) : "ANPG"}
                    lastUpdate={updates?.production ? formatLastUpdate(updates.production.created_at) : ""}
                  />
                  <KPICard
                    title="Brent Crude"
                    value={kpis.brent.formatted}
                    change={kpis.brent.change}
                    variant="accent"
                    icon={<DollarSign className="w-5 h-5" />}
                    source={updates?.price ? getSourceShortName(updates.price.source) : "Market"}
                    lastUpdate={updates?.price ? formatLastUpdate(updates.price.created_at) : ""}
                  />
                  <KPICard
                    title="Exportações"
                    value={kpis.exports.formatted}
                    change={kpis.exports.change}
                    icon={<Ship className="w-5 h-5" />}
                    source={updates?.export ? getSourceShortName(updates.export.source) : "Customs"}
                    lastUpdate={updates?.export ? formatLastUpdate(updates.export.created_at) : ""}
                  />
                  <KPICard
                    title="Receita Est."
                    value={kpis.revenue.formatted}
                    change={kpis.revenue.change}
                    variant="primary"
                    icon={<BarChart3 className="w-5 h-5" />}
                    source="Calculado"
                    lastUpdate={updates?.price ? formatLastUpdate(updates.price.created_at) : ""}
                  />
                </>
              )}
            </section>

            {/* Secondary Prices */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              ) : (
                topPriceCards.map((card, i) => (
                  <PriceCard key={card.name} {...card} delay={0.1 * i} />
                ))
              )}
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-card p-1 rounded-3xl shadow-sm border border-border">
                  <ProductionChart />
                </div>
                <div className="bg-card p-1 rounded-3xl shadow-sm border border-border">
                  <OperatorsTable />
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-card p-1 rounded-3xl shadow-sm border border-border">
                  <ExportsMap />
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-1 rounded-3xl border border-primary/10">
                  <AIInsights />
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <footer className="pt-8 border-t border-border">
              <DataSourceIndicator 
                sources={[...DATA_SOURCES.prices, ...DATA_SOURCES.production, ...DATA_SOURCES.exports]} 
              />
            </footer>
          </div>
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  );
};

export default Index;