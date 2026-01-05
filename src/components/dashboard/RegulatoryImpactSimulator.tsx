import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Scale, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Calculator,
  Percent,
  Fuel,
  Building2,
  Leaf,
  Globe
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Cell,
} from "recharts";

interface SimulationParams {
  royaltyChange: number; // -10 to +10 percentage points
  taxChange: number; // -10 to +10 percentage points
  environmentalCompliance: number; // 0 to 100 (cost increase %)
  opepQuotaChange: number; // -20 to +20 % production
  brentPriceScenario: number; // 50 to 120 USD
  currencyDevaluation: number; // 0 to 50%
}

interface SimulationResult {
  revenueImpact: number;
  productionCostImpact: number;
  netProfitImpact: number;
  exportVolumeImpact: number;
  governmentTakeChange: number;
  breakEvenPrice: number;
}

const DEFAULT_PARAMS: SimulationParams = {
  royaltyChange: 0,
  taxChange: 0,
  environmentalCompliance: 0,
  opepQuotaChange: 0,
  brentPriceScenario: 78,
  currencyDevaluation: 0,
};

// Base values for Angola oil sector
const BASE_VALUES = {
  dailyProduction: 1100000, // bpd
  currentRoyalty: 16, // %
  currentTax: 50, // %
  operatingCost: 25, // USD per barrel
  currentBrent: 78, // USD
  annualRevenue: 25000000000, // USD (billion)
};

export const RegulatoryImpactSimulator = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [activeScenario, setActiveScenario] = useState<string>("custom");

  const scenarios = {
    optimistic: {
      royaltyChange: -2,
      taxChange: -3,
      environmentalCompliance: 5,
      opepQuotaChange: 5,
      brentPriceScenario: 90,
      currencyDevaluation: 5,
    },
    baseline: DEFAULT_PARAMS,
    pessimistic: {
      royaltyChange: 3,
      taxChange: 5,
      environmentalCompliance: 20,
      opepQuotaChange: -10,
      brentPriceScenario: 65,
      currencyDevaluation: 25,
    },
    crisis: {
      royaltyChange: 5,
      taxChange: 8,
      environmentalCompliance: 30,
      opepQuotaChange: -20,
      brentPriceScenario: 50,
      currencyDevaluation: 40,
    },
  };

  const applyScenario = (scenarioName: string) => {
    setActiveScenario(scenarioName);
    if (scenarioName !== "custom" && scenarios[scenarioName as keyof typeof scenarios]) {
      setParams(scenarios[scenarioName as keyof typeof scenarios]);
    }
  };

  const results = useMemo<SimulationResult>(() => {
    // Calculate impacts
    const priceRatio = params.brentPriceScenario / BASE_VALUES.currentBrent;
    const productionMultiplier = 1 + (params.opepQuotaChange / 100);
    const newProduction = BASE_VALUES.dailyProduction * productionMultiplier;
    
    // Revenue impact
    const baseRevenue = BASE_VALUES.dailyProduction * BASE_VALUES.currentBrent * 365;
    const newRevenue = newProduction * params.brentPriceScenario * 365;
    const revenueImpact = ((newRevenue - baseRevenue) / baseRevenue) * 100;

    // Cost impact (environmental + currency)
    const envCostIncrease = params.environmentalCompliance / 100;
    const currencyCostIncrease = params.currencyDevaluation / 200; // Partial impact on local costs
    const newOperatingCost = BASE_VALUES.operatingCost * (1 + envCostIncrease + currencyCostIncrease);
    const productionCostImpact = ((newOperatingCost - BASE_VALUES.operatingCost) / BASE_VALUES.operatingCost) * 100;

    // Government take change
    const currentGovTake = BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax;
    const newGovTake = (BASE_VALUES.currentRoyalty + params.royaltyChange) + (BASE_VALUES.currentTax + params.taxChange);
    const governmentTakeChange = newGovTake - currentGovTake;

    // Net profit impact
    const currentMargin = BASE_VALUES.currentBrent - BASE_VALUES.operatingCost;
    const currentProfitPerBarrel = currentMargin * (1 - currentGovTake / 100);
    const newMargin = params.brentPriceScenario - newOperatingCost;
    const newProfitPerBarrel = newMargin * (1 - newGovTake / 100);
    const netProfitImpact = ((newProfitPerBarrel - currentProfitPerBarrel) / currentProfitPerBarrel) * 100;

    // Export volume impact
    const exportVolumeImpact = params.opepQuotaChange;

    // Break-even price
    const breakEvenPrice = newOperatingCost / (1 - newGovTake / 100);

    return {
      revenueImpact,
      productionCostImpact,
      netProfitImpact,
      exportVolumeImpact,
      governmentTakeChange,
      breakEvenPrice,
    };
  }, [params]);

  // Generate projection data for chart
  const projectionData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((month, index) => {
      const factor = 1 + (results.netProfitImpact / 100) * ((index + 1) / 12);
      const baseLine = 100;
      return {
        month,
        baseline: baseLine,
        scenario: Math.round(baseLine * factor),
      };
    });
  }, [results.netProfitImpact]);

  const impactMetrics = [
    { label: 'Receita', value: results.revenueImpact, icon: DollarSign },
    { label: 'Custos', value: results.productionCostImpact, icon: BarChart3, inverted: true },
    { label: 'Lucro Líquido', value: results.netProfitImpact, icon: TrendingUp },
    { label: 'Exportações', value: results.exportVolumeImpact, icon: Fuel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 p-6 card-gradient"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Simulador de Impacto Regulatório
          </h3>
          <p className="text-sm text-muted-foreground">Simule cenários fiscais e regulatórios para o setor petrolífero angolano</p>
        </div>
        <Scale className="w-5 h-5 text-accent" />
      </div>

      <Tabs defaultValue="params" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="params">Parâmetros</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-6">
          {/* Scenario Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(scenarios).map((scenario) => (
              <Button
                key={scenario}
                variant={activeScenario === scenario ? "default" : "outline"}
                size="sm"
                onClick={() => applyScenario(scenario)}
                className="capitalize"
              >
                {scenario === 'baseline' ? 'Base' : 
                 scenario === 'optimistic' ? 'Otimista' :
                 scenario === 'pessimistic' ? 'Pessimista' : 'Crise'}
              </Button>
            ))}
            <Button
              variant={activeScenario === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveScenario("custom")}
            >
              Personalizado
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fiscal Parameters */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Parâmetros Fiscais
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Alteração Royalties</span>
                    <span className={`font-medium ${params.royaltyChange > 0 ? 'text-destructive' : params.royaltyChange < 0 ? 'text-success' : 'text-foreground'}`}>
                      {params.royaltyChange > 0 ? '+' : ''}{params.royaltyChange}%
                    </span>
                  </div>
                  <Slider
                    value={[params.royaltyChange]}
                    onValueChange={([v]) => { setParams({...params, royaltyChange: v}); setActiveScenario("custom"); }}
                    min={-10}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-10%</span>
                    <span className="text-xs">Atual: {BASE_VALUES.currentRoyalty}%</span>
                    <span>+10%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Alteração Impostos</span>
                    <span className={`font-medium ${params.taxChange > 0 ? 'text-destructive' : params.taxChange < 0 ? 'text-success' : 'text-foreground'}`}>
                      {params.taxChange > 0 ? '+' : ''}{params.taxChange}%
                    </span>
                  </div>
                  <Slider
                    value={[params.taxChange]}
                    onValueChange={([v]) => { setParams({...params, taxChange: v}); setActiveScenario("custom"); }}
                    min={-10}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-10%</span>
                    <span className="text-xs">Atual: {BASE_VALUES.currentTax}%</span>
                    <span>+10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental & Market */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Leaf className="w-4 h-4 text-success" />
                Ambiente & Mercado
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Custos Ambientais</span>
                    <span className={`font-medium ${params.environmentalCompliance > 10 ? 'text-destructive' : 'text-foreground'}`}>
                      +{params.environmentalCompliance}%
                    </span>
                  </div>
                  <Slider
                    value={[params.environmentalCompliance]}
                    onValueChange={([v]) => { setParams({...params, environmentalCompliance: v}); setActiveScenario("custom"); }}
                    min={0}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Preço Brent (USD)</span>
                    <span className="font-medium text-foreground">${params.brentPriceScenario}</span>
                  </div>
                  <Slider
                    value={[params.brentPriceScenario]}
                    onValueChange={([v]) => { setParams({...params, brentPriceScenario: v}); setActiveScenario("custom"); }}
                    min={40}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$40</span>
                    <span>$120</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OPEP+ & Currency */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                OPEP+ & Quotas
              </h4>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Alteração Quota Produção</span>
                  <span className={`font-medium ${params.opepQuotaChange < 0 ? 'text-destructive' : params.opepQuotaChange > 0 ? 'text-success' : 'text-foreground'}`}>
                    {params.opepQuotaChange > 0 ? '+' : ''}{params.opepQuotaChange}%
                  </span>
                </div>
                <Slider
                  value={[params.opepQuotaChange]}
                  onValueChange={([v]) => { setParams({...params, opepQuotaChange: v}); setActiveScenario("custom"); }}
                  min={-20}
                  max={20}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Percent className="w-4 h-4 text-destructive" />
                Risco Cambial
              </h4>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Desvalorização Kwanza</span>
                  <span className={`font-medium ${params.currencyDevaluation > 20 ? 'text-destructive' : 'text-foreground'}`}>
                    +{params.currencyDevaluation}%
                  </span>
                </div>
                <Slider
                  value={[params.currencyDevaluation]}
                  onValueChange={([v]) => { setParams({...params, currencyDevaluation: v}); setActiveScenario("custom"); }}
                  min={0}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Impact Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const isPositive = metric.inverted ? metric.value < 0 : metric.value > 0;
              const isNegative = metric.inverted ? metric.value > 0 : metric.value < 0;
              
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className={`text-xl font-bold flex items-center gap-1 ${
                    isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {metric.value > 0 ? '+' : ''}{metric.value.toFixed(1)}%
                    {isPositive && <TrendingUp className="w-4 h-4" />}
                    {isNegative && <TrendingDown className="w-4 h-4" />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Government Take</span>
                  <div className="text-2xl font-bold text-foreground">
                    {(BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax + results.governmentTakeChange).toFixed(0)}%
                  </div>
                </div>
                <div className={`text-sm font-medium ${results.governmentTakeChange > 0 ? 'text-destructive' : results.governmentTakeChange < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {results.governmentTakeChange > 0 ? '+' : ''}{results.governmentTakeChange.toFixed(0)}pp
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Break-Even Price</span>
                  <div className="text-2xl font-bold text-foreground">
                    ${results.breakEvenPrice.toFixed(0)}/bbl
                  </div>
                </div>
                {results.breakEvenPrice > params.brentPriceScenario && (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
              </div>
              {results.breakEvenPrice > params.brentPriceScenario && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Operação não viável neste cenário
                </p>
              )}
            </div>
          </div>

          {/* Impact Summary */}
          <div className="p-4 rounded-lg bg-secondary/20 border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-3">Resumo do Impacto</h4>
            <div className="space-y-2 text-sm">
              {results.netProfitImpact < -20 && (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Cenário crítico: redução significativa da rentabilidade pode levar à suspensão de investimentos</span>
                </div>
              )}
              {results.governmentTakeChange > 5 && (
                <div className="flex items-start gap-2 text-accent">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Aumento do government take pode reduzir atratividade para IOCs</span>
                </div>
              )}
              {results.breakEvenPrice > 60 && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Break-even elevado aumenta vulnerabilidade a quedas de preço</span>
                </div>
              )}
              {results.netProfitImpact > 10 && (
                <div className="flex items-start gap-2 text-success">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Cenário favorável: condições propícias para aumento de investimento</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="scenario"
                  name="Cenário Simulado"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Projeção de rentabilidade relativa (base = 100) ao longo de 12 meses
          </p>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
