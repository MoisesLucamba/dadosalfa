import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { ExportsMap } from "@/components/dashboard/ExportsMap";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { OperatorsTable } from "@/components/dashboard/OperatorsTable";
import { DataSourceIndicator, DATA_SOURCES } from "@/components/dashboard/DataSourceIndicator";
import { BarChart3, DollarSign, Ship, Gauge, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import { useProductionData, usePriceData, useExportData } from "@/hooks/useData";
import { useLatestDataUpdates, formatLastUpdate, getSourceShortName } from "@/hooks/useDataUpdates";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { data: productionData, isLoading: loadingProduction, refetch: refetchProduction } = useProductionData();
  const { data: priceData, isLoading: loadingPrice, refetch: refetchPrice } = usePriceData();
  const { data: exportData, isLoading: loadingExport, refetch: refetchExport } = useExportData();
  const { data: dataUpdates } = useLatestDataUpdates();
  const { data: isAdmin } = useIsAdmin();
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);

  const isLoading = loadingProduction || loadingPrice || loadingExport;

  // Fetch real-time prices from AI
  const syncRealTimePrices = async () => {
    setIsSyncingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-oil-prices", {
        body: { action: "sync" }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Preços atualizados com sucesso!", {
          description: data.data?.source || "Dados sincronizados com o mercado"
        });
        refetchPrice();
      } else {
        throw new Error(data?.error || "Falha ao sincronizar preços");
      }
    } catch (error: any) {
      console.error("Error syncing prices:", error);
      if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
        toast.error("Limite de requisições excedido", {
          description: "Aguarde alguns minutos antes de tentar novamente"
        });
      } else {
        toast.error("Erro ao atualizar preços", {
          description: error.message || "Tente novamente mais tarde"
        });
      }
    } finally {
      setIsSyncingPrices(false);
    }
  };

  // Calculate KPIs from real data
  const kpis = useMemo(() => {
    // Total Production (sum of daily production from latest date)
    const latestProductionDate = productionData?.[0]?.data_date;
    const latestProduction = productionData?.filter(p => p.data_date === latestProductionDate) || [];
    const totalDailyProduction = latestProduction.reduce((sum, p) => sum + Number(p.daily_production || 0), 0);
    
    // Previous month production for comparison
    const previousProduction = productionData?.filter(p => p.data_date !== latestProductionDate) || [];
    const previousDates = [...new Set(previousProduction.map(p => p.data_date))].sort().reverse();
    const prevDate = previousDates[0];
    const prevProduction = previousProduction.filter(p => p.data_date === prevDate);
    const prevTotalProduction = prevProduction.reduce((sum, p) => sum + Number(p.daily_production || 0), 0);
    const productionChange = prevTotalProduction > 0 
      ? ((totalDailyProduction - prevTotalProduction) / prevTotalProduction) * 100 
      : 0;

    // Brent Price (latest)
    const brentPrice = priceData?.find(p => p.crude_type.toLowerCase().includes("brent"));
    const brentPriceValue = brentPrice?.price || 0;
    const brentChange = brentPrice?.change_percent || 0;

    // Exports (sum of volume from current month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExports = exportData?.filter(e => e.data_date.startsWith(currentMonth)) || [];
    const totalExportVolume = currentMonthExports.reduce((sum, e) => sum + Number(e.volume || 0), 0);
    
    // Previous month exports
    const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    const prevMonthExports = exportData?.filter(e => e.data_date.startsWith(prevMonth)) || [];
    const prevExportVolume = prevMonthExports.reduce((sum, e) => sum + Number(e.volume || 0), 0);
    const exportChange = prevExportVolume > 0 
      ? ((totalExportVolume - prevExportVolume) / prevExportVolume) * 100 
      : 0;

    // Estimated Revenue (exports * brent price)
    const totalExportValue = currentMonthExports.reduce((sum, e) => sum + Number(e.value_usd || 0), 0);
    const estimatedRevenue = totalExportValue > 0 ? totalExportValue : totalExportVolume * brentPriceValue;
    const prevRevenue = prevExportVolume * (brentPriceValue * (1 - brentChange / 100));
    const revenueChange = prevRevenue > 0 
      ? ((estimatedRevenue - prevRevenue) / prevRevenue) * 100 
      : 0;

    return {
      production: {
        value: totalDailyProduction,
        change: productionChange,
        formatted: totalDailyProduction >= 1000000 
          ? `${(totalDailyProduction / 1000000).toFixed(2)}M bpd`
          : totalDailyProduction >= 1000 
            ? `${(totalDailyProduction / 1000).toFixed(0)}K bpd`
            : `${totalDailyProduction.toFixed(0)} bpd`
      },
      brentPrice: {
        value: brentPriceValue,
        change: brentChange,
        formatted: `$${brentPriceValue.toFixed(2)}`
      },
      exports: {
        value: totalExportVolume,
        change: exportChange,
        formatted: totalExportVolume >= 1000000 
          ? `${(totalExportVolume / 1000000).toFixed(0)}M bbl`
          : totalExportVolume >= 1000 
            ? `${(totalExportVolume / 1000).toFixed(0)}K bbl`
            : `${totalExportVolume.toFixed(0)} bbl`
      },
      revenue: {
        value: estimatedRevenue,
        change: revenueChange,
        formatted: estimatedRevenue >= 1000000000 
          ? `$${(estimatedRevenue / 1000000000).toFixed(1)}B`
          : estimatedRevenue >= 1000000 
            ? `$${(estimatedRevenue / 1000000).toFixed(1)}M`
            : `$${estimatedRevenue.toFixed(0)}`
      }
    };
  }, [productionData, priceData, exportData]);

  // Get price cards data
  const priceCards = useMemo(() => {
    const crudeTypes = ["Brent", "Cabinda", "Girassol", "Nemba", "Dalia"];
    return crudeTypes.map(type => {
      const priceEntry = priceData?.find(p => 
        p.crude_type.toLowerCase().includes(type.toLowerCase())
      );
      return {
        name: type === "Brent" ? "Brent Crude" : type,
        price: priceEntry?.price || 0,
        change: priceEntry?.change_percent || 0
      };
    }).filter(p => p.price > 0).slice(0, 3);
  }, [priceData]);

  const hasNoData = !isLoading && (
    (!productionData || productionData.length === 0) &&
    (!priceData || priceData.length === 0) &&
    (!exportData || exportData.length === 0)
  );

  const handleRefresh = () => {
    refetchProduction();
    refetchPrice();
    refetchExport();
    toast.success("Dados atualizados");
  };

  return (
    <>
      <Helmet>
        <title>AlphaData | Market Intelligence para o Setor Petrolífero de Angola</title>
        <meta
          name="description"
          content="Plataforma de Market Intelligence e Previsão com IA para o setor petrolífero angolano. Dashboards interativos, relatórios inteligentes e previsões baseadas em IA."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
              {/* Page Header */}
              <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Principal</h1>
                  <p className="text-sm md:text-base text-muted-foreground">Visão geral do mercado petrolífero angolano</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={syncRealTimePrices}
                    disabled={isSyncingPrices}
                    className="gap-2"
                  >
                    <Zap className={`h-4 w-4 ${isSyncingPrices ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{isSyncingPrices ? "Atualizando..." : "Preços em Tempo Real"}</span>
                    <span className="sm:hidden">{isSyncingPrices ? "..." : "Preços"}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Atualizar</span>
                  </Button>
                </div>
              </div>

              {/* No Data Alert */}
              {hasNoData && (
                <Alert className="border-warning/50 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-sm">
                      Não há dados disponíveis. {isAdmin ? "Adicione dados no painel administrativo." : "Aguarde a inserção de dados pelo administrador."}
                    </span>
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => navigate("/admin")}>
                        Ir para Admin
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </>
                ) : (
                  <>
                    <KPICard
                      title="Produção Total"
                      value={kpis.production.formatted}
                      change={Number(kpis.production.change.toFixed(1))}
                      changeLabel="vs. período anterior"
                      icon={<Gauge className="w-5 h-5" />}
                      delay={0}
                      source={dataUpdates?.production ? getSourceShortName(dataUpdates.production.source) : undefined}
                      lastUpdate={dataUpdates?.production ? formatLastUpdate(dataUpdates.production.created_at) : undefined}
                    />
                    <KPICard
                      title="Preço Brent"
                      value={kpis.brentPrice.formatted}
                      change={Number(kpis.brentPrice.change.toFixed(1))}
                      changeLabel="vs. ontem"
                      icon={<DollarSign className="w-5 h-5" />}
                      variant="accent"
                      delay={0.05}
                      source={dataUpdates?.price ? getSourceShortName(dataUpdates.price.source) : undefined}
                      lastUpdate={dataUpdates?.price ? formatLastUpdate(dataUpdates.price.created_at) : undefined}
                    />
                    <KPICard
                      title="Exportações (Mês)"
                      value={kpis.exports.formatted}
                      change={Number(kpis.exports.change.toFixed(1))}
                      changeLabel="vs. mês anterior"
                      icon={<Ship className="w-5 h-5" />}
                      delay={0.1}
                      source={dataUpdates?.export ? getSourceShortName(dataUpdates.export.source) : undefined}
                      lastUpdate={dataUpdates?.export ? formatLastUpdate(dataUpdates.export.created_at) : undefined}
                    />
                    <KPICard
                      title="Receita Estimada"
                      value={kpis.revenue.formatted}
                      change={Number(kpis.revenue.change.toFixed(1))}
                      changeLabel="vs. mês anterior"
                      icon={<BarChart3 className="w-5 h-5" />}
                      variant="primary"
                      delay={0.15}
                      source="Calculado"
                      lastUpdate={dataUpdates?.price ? formatLastUpdate(dataUpdates.price.created_at) : undefined}
                    />
                  </>
                )}
              </div>

              {/* Price Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </>
                ) : priceCards.length > 0 ? (
                  priceCards.map((card, index) => (
                    <PriceCard 
                      key={card.name}
                      name={card.name} 
                      price={card.price} 
                      change={card.change} 
                      delay={0.2 + index * 0.05} 
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sem dados de preços disponíveis</p>
                    {isAdmin && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => navigate("/admin")}
                        className="mt-2"
                      >
                        Adicionar preços
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProductionChart />
                </div>
                <div>
                  <ExportsMap />
                </div>
              </div>

              {/* AI Insights & Operators */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <OperatorsTable />
                </div>
                <div>
                  <AIInsights />
                </div>
              </div>

              {/* Data Sources */}
              <DataSourceIndicator 
                sources={[
                  ...DATA_SOURCES.prices,
                  ...DATA_SOURCES.production,
                  ...DATA_SOURCES.exports,
                ]} 
              />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Index;
