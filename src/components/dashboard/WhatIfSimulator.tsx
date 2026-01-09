import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Fuel,
  RefreshCw,
  Save,
  Trash2,
  Copy,
  LineChart,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

interface ScenarioParams {
  name: string;
  brentPrice: number;
  production: number;
  exchangeRate: number;
  operatingCost: number;
  taxRate: number;
  royaltyRate: number;
}

interface ScenarioResult {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  governmentTake: number;
  breakEven: number;
  cashFlow: number[];
}

const BASE_SCENARIO: ScenarioParams = {
  name: "Base",
  brentPrice: 78,
  production: 1080,
  exchangeRate: 830,
  operatingCost: 28,
  taxRate: 50,
  royaltyRate: 16,
};

const PRESET_SCENARIOS = {
  optimistic: {
    name: "Otimista",
    brentPrice: 95,
    production: 1150,
    exchangeRate: 780,
    operatingCost: 25,
    taxRate: 48,
    royaltyRate: 15,
  },
  pessimistic: {
    name: "Pessimista",
    brentPrice: 60,
    production: 950,
    exchangeRate: 950,
    operatingCost: 32,
    taxRate: 52,
    royaltyRate: 18,
  },
  crisis: {
    name: "Crise",
    brentPrice: 45,
    production: 850,
    exchangeRate: 1100,
    operatingCost: 35,
    taxRate: 55,
    royaltyRate: 20,
  },
};

const calculateResults = (params: ScenarioParams): ScenarioResult => {
  const dailyRevenue = params.brentPrice * params.production * 1000;
  const annualRevenue = dailyRevenue * 365;
  
  const dailyCosts = params.operatingCost * params.production * 1000;
  const annualCosts = dailyCosts * 365;
  
  const grossProfit = annualRevenue - annualCosts;
  const taxAmount = grossProfit * (params.taxRate / 100);
  const royaltyAmount = annualRevenue * (params.royaltyRate / 100);
  const netProfit = grossProfit - taxAmount - royaltyAmount;
  
  const margin = (netProfit / annualRevenue) * 100;
  const governmentTake = taxAmount + royaltyAmount;
  const breakEven = params.operatingCost / (1 - (params.taxRate + params.royaltyRate) / 100);
  
  // Generate 12-month cash flow projection
  const cashFlow = Array.from({ length: 12 }, (_, i) => {
    const monthlyVariation = 1 + (Math.sin(i / 2) * 0.05);
    return (netProfit / 12) * monthlyVariation;
  });
  
  return {
    revenue: annualRevenue,
    costs: annualCosts + governmentTake,
    profit: netProfit,
    margin,
    governmentTake,
    breakEven,
    cashFlow,
  };
};

export const WhatIfSimulator = () => {
  const [scenarios, setScenarios] = useState<ScenarioParams[]>([
    { ...BASE_SCENARIO },
    { ...PRESET_SCENARIOS.optimistic },
    { ...PRESET_SCENARIOS.pessimistic },
  ]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  const currentScenario = scenarios[activeScenario];

  const updateScenario = (key: keyof ScenarioParams, value: number | string) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...updated[activeScenario], [key]: value };
    setScenarios(updated);
  };

  const results = useMemo(() => {
    return scenarios.map(calculateResults);
  }, [scenarios]);

  const currentResult = results[activeScenario];

  const addScenario = () => {
    if (scenarios.length >= 5) {
      toast.error("Máximo de 5 cenários permitido");
      return;
    }
    setScenarios([...scenarios, { ...BASE_SCENARIO, name: `Cenário ${scenarios.length + 1}` }]);
    setActiveScenario(scenarios.length);
    toast.success("Novo cenário adicionado");
  };

  const removeScenario = (index: number) => {
    if (scenarios.length <= 1) {
      toast.error("É necessário pelo menos um cenário");
      return;
    }
    const updated = scenarios.filter((_, i) => i !== index);
    setScenarios(updated);
    if (activeScenario >= updated.length) {
      setActiveScenario(updated.length - 1);
    }
    toast.success("Cenário removido");
  };

  const duplicateScenario = (index: number) => {
    if (scenarios.length >= 5) {
      toast.error("Máximo de 5 cenários permitido");
      return;
    }
    const newScenario = { ...scenarios[index], name: `${scenarios[index].name} (cópia)` };
    setScenarios([...scenarios, newScenario]);
    toast.success("Cenário duplicado");
  };

  const applyPreset = (presetKey: keyof typeof PRESET_SCENARIOS) => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...PRESET_SCENARIOS[presetKey] };
    setScenarios(updated);
    toast.success(`Cenário ${PRESET_SCENARIOS[presetKey].name} aplicado`);
  };

  const resetToBase = () => {
    const updated = [...scenarios];
    updated[activeScenario] = { ...BASE_SCENARIO, name: currentScenario.name };
    setScenarios(updated);
    toast.success("Valores base restaurados");
  };

  // Comparison chart data
  const comparisonData = scenarios.map((scenario, index) => ({
    name: scenario.name,
    receita: results[index].revenue / 1e9,
    lucro: results[index].profit / 1e9,
    margem: results[index].margin,
  }));

  // Cash flow projection data
  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const month = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i];
    const data: Record<string, any> = { month };
    scenarios.forEach((scenario, idx) => {
      data[scenario.name] = results[idx].cashFlow[i] / 1e9;
    });
    return data;
  });

  const scenarioColors = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--accent))",
    "hsl(var(--destructive))",
    "#8b5cf6",
  ];

  const formatBillions = (value: number) => `$${(value / 1e9).toFixed(2)}B`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 p-6 card-gradient"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Simulador What-If
          </h3>
          <p className="text-sm text-muted-foreground">
            Modele cenários de preço, produção e câmbio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Comparar
          </Button>
          <Button variant="outline" size="sm" onClick={addScenario} className="gap-2">
            <Save className="w-4 h-4" />
            Novo Cenário
          </Button>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {scenarios.map((scenario, index) => (
          <Button
            key={index}
            variant={activeScenario === index ? "default" : "outline"}
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setActiveScenario(index)}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: scenarioColors[index] }}
            />
            {scenario.name}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="params" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="params">Parâmetros</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-6">
          {/* Presets & Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => applyPreset('optimistic')}>
              Otimista
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('pessimistic')}>
              Pessimista
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset('crisis')}>
              Crise
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={resetToBase} className="gap-1">
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => duplicateScenario(activeScenario)} className="gap-1">
              <Copy className="w-3 h-3" />
              Duplicar
            </Button>
            {scenarios.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeScenario(activeScenario)}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </Button>
            )}
          </div>

          {/* Scenario Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome do Cenário</label>
            <Input
              value={currentScenario.name}
              onChange={(e) => updateScenario('name', e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Brent Price */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Preço Brent (USD/bbl)</span>
              </div>
              <Slider
                value={[currentScenario.brentPrice]}
                onValueChange={([v]) => updateScenario('brentPrice', v)}
                min={30}
                max={150}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$30</span>
                <span className="font-medium text-foreground">${currentScenario.brentPrice}</span>
                <span>$150</span>
              </div>
            </div>

            {/* Production */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Produção (kbpd)</span>
              </div>
              <Slider
                value={[currentScenario.production]}
                onValueChange={([v]) => updateScenario('production', v)}
                min={500}
                max={1500}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>500</span>
                <span className="font-medium text-foreground">{currentScenario.production}</span>
                <span>1500</span>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">Taxa de Câmbio (AOA/USD)</span>
              </div>
              <Slider
                value={[currentScenario.exchangeRate]}
                onValueChange={([v]) => updateScenario('exchangeRate', v)}
                min={500}
                max={1500}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>500</span>
                <span className="font-medium text-foreground">{currentScenario.exchangeRate}</span>
                <span>1500</span>
              </div>
            </div>

            {/* Operating Cost */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Custo Operacional (USD/bbl)</span>
              </div>
              <Slider
                value={[currentScenario.operatingCost]}
                onValueChange={([v]) => updateScenario('operatingCost', v)}
                min={15}
                max={50}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$15</span>
                <span className="font-medium text-foreground">${currentScenario.operatingCost}</span>
                <span>$50</span>
              </div>
            </div>

            {/* Tax Rate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Taxa de Imposto (%)</span>
              </div>
              <Slider
                value={[currentScenario.taxRate]}
                onValueChange={([v]) => updateScenario('taxRate', v)}
                min={30}
                max={70}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span className="font-medium text-foreground">{currentScenario.taxRate}%</span>
                <span>70%</span>
              </div>
            </div>

            {/* Royalty Rate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Royalties (%)</span>
              </div>
              <Slider
                value={[currentScenario.royaltyRate]}
                onValueChange={([v]) => updateScenario('royaltyRate', v)}
                min={5}
                max={30}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span>
                <span className="font-medium text-foreground">{currentScenario.royaltyRate}%</span>
                <span>30%</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="text-xs text-muted-foreground mb-1">Receita Anual</div>
              <div className="text-xl font-bold text-foreground">{formatBillions(currentResult.revenue)}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`p-4 rounded-lg border ${
                currentResult.profit > 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">Lucro Líquido</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${
                currentResult.profit > 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatBillions(currentResult.profit)}
                {currentResult.profit > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-accent/10 border border-accent/30"
            >
              <div className="text-xs text-muted-foreground mb-1">Margem</div>
              <div className="text-xl font-bold text-foreground">{formatPercent(currentResult.margin)}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg bg-secondary/50 border border-border/50"
            >
              <div className="text-xs text-muted-foreground mb-1">Government Take</div>
              <div className="text-xl font-bold text-foreground">{formatBillions(currentResult.governmentTake)}</div>
            </motion.div>
          </div>

          {/* Break Even Alert */}
          <div className={`p-4 rounded-lg border flex items-center justify-between ${
            currentScenario.brentPrice < currentResult.breakEven
              ? 'bg-destructive/10 border-destructive/30'
              : 'bg-success/10 border-success/30'
          }`}>
            <div className="flex items-center gap-3">
              {currentScenario.brentPrice < currentResult.breakEven ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : (
                <TrendingUp className="w-5 h-5 text-success" />
              )}
              <div>
                <div className="text-sm font-medium text-foreground">Preço de Break-Even</div>
                <div className="text-xs text-muted-foreground">
                  {currentScenario.brentPrice < currentResult.breakEven
                    ? 'Preço atual abaixo do break-even'
                    : 'Operação rentável no preço atual'}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${currentResult.breakEven.toFixed(0)}/bbl
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
            <h4 className="text-sm font-semibold text-foreground mb-3">Resumo do Cenário</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Produção: </span>
                <span className="font-medium">{currentScenario.production}k bpd</span>
              </div>
              <div>
                <span className="text-muted-foreground">Preço Brent: </span>
                <span className="font-medium">${currentScenario.brentPrice}/bbl</span>
              </div>
              <div>
                <span className="text-muted-foreground">Custo: </span>
                <span className="font-medium">${currentScenario.operatingCost}/bbl</span>
              </div>
              <div>
                <span className="text-muted-foreground">Imposto: </span>
                <span className="font-medium">{currentScenario.taxRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Royalties: </span>
                <span className="font-medium">{currentScenario.royaltyRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Câmbio: </span>
                <span className="font-medium">{currentScenario.exchangeRate} AOA/USD</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={comparisonData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'margem' ? `${value.toFixed(1)}%` : `$${value.toFixed(2)}B`,
                    name === 'receita' ? 'Receita' : name === 'lucro' ? 'Lucro' : 'Margem'
                  ]}
                />
                <Legend />
                <Bar dataKey="receita" fill="hsl(var(--primary))" name="Receita ($B)" />
                <Bar dataKey="lucro" fill="hsl(var(--success))" name="Lucro ($B)" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cenário</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Receita</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Lucro</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Margem</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Break-Even</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: scenarioColors[index] }}
                        />
                        {scenario.name}
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 font-medium">{formatBillions(results[index].revenue)}</td>
                    <td className={`text-right py-2 px-3 font-medium ${
                      results[index].profit > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatBillions(results[index].profit)}
                    </td>
                    <td className="text-right py-2 px-3 font-medium">{formatPercent(results[index].margin)}</td>
                    <td className="text-right py-2 px-3 font-medium">${results[index].breakEven.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  {scenarios.map((scenario, index) => (
                    <linearGradient key={scenario.name} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioColors[index]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={scenarioColors[index]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}B`, "Cash Flow"]}
                />
                <Legend />
                {scenarios.map((scenario, index) => (
                  <Area
                    key={scenario.name}
                    type="monotone"
                    dataKey={scenario.name}
                    stroke={scenarioColors[index]}
                    fill={`url(#gradient-${index})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
            <p className="text-sm text-muted-foreground">
              Projeção de fluxo de caixa mensal para os próximos 12 meses, considerando os parâmetros definidos em cada cenário.
              Esta projeção inclui variações sazonais estimadas e pode ser usada para planejamento financeiro.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
