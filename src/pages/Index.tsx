import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { ExportsMap } from "@/components/dashboard/ExportsMap";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { OperatorsTable } from "@/components/dashboard/OperatorsTable";
import { BarChart3, DollarSign, Ship, Gauge } from "lucide-react";

const Index = () => {
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
              <div className="mb-4 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Principal</h1>
                <p className="text-sm md:text-base text-muted-foreground">Visão geral do mercado petrolífero angolano</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Produção Total"
                  value="1.08M bpd"
                  change={-2.1}
                  changeLabel="vs. mês anterior"
                  icon={<Gauge className="w-5 h-5" />}
                  delay={0}
                />
                <KPICard
                  title="Preço Brent"
                  value="$78.45"
                  change={1.8}
                  changeLabel="vs. ontem"
                  icon={<DollarSign className="w-5 h-5" />}
                  variant="accent"
                  delay={0.05}
                />
                <KPICard
                  title="Exportações (Nov)"
                  value="46M bbl"
                  change={3.2}
                  changeLabel="vs. Out"
                  icon={<Ship className="w-5 h-5" />}
                  delay={0.1}
                />
                <KPICard
                  title="Receita Estimada"
                  value="$3.6B"
                  change={-0.8}
                  changeLabel="vs. mês anterior"
                  icon={<BarChart3 className="w-5 h-5" />}
                  variant="primary"
                  delay={0.15}
                />
              </div>

              {/* Price Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PriceCard name="Brent Crude" price={78.45} change={1.8} delay={0.2} />
                <PriceCard name="Cabinda" price={76.82} change={1.5} delay={0.25} />
                <PriceCard name="Girassol" price={77.18} change={2.1} delay={0.3} />
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
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Index;
