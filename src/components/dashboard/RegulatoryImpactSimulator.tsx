import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Calculator,
  Percent,
  Building2,
  Leaf,
  Globe,
  Info,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Activity
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface SimulationParams {
  royaltyChange: number;
  taxChange: number;
  environmentalCompliance: number;
  opepQuotaChange: number;
  brentPriceScenario: number;
  currencyDevaluation: number;
}

interface SimulationResult {
  revenueImpact: number;
  productionCostImpact: number;
  netProfitImpact: number;
  exportVolumeImpact: number;
  governmentTakeChange: number;
  breakEvenPrice: number;
  viabilityScore: number; // 0 to 100
}

const DEFAULT_PARAMS: SimulationParams = {
  royaltyChange: 0,
  taxChange: 0,
  environmentalCompliance: 0,
  opepQuotaChange: 0,
  brentPriceScenario: 78,
  currencyDevaluation: 0,
};

const BASE_VALUES = {
  dailyProduction: 1100000,
  currentRoyalty: 16,
  currentTax: 50,
  operatingCost: 25,
  currentBrent: 78,
  annualRevenue: 25000000000,
};

export const RegulatoryImpactSimulator = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [activeScenario, setActiveScenario] = useState<string>("baseline");

  const scenarios = {
    optimistic: {
      label: "Otimista",
      description: "Preços altos e incentivos fiscais",
      params: {
        royaltyChange: -2,
        taxChange: -3,
        environmentalCompliance: 5,
        opepQuotaChange: 5,
        brentPriceScenario: 95,
        currencyDevaluation: 5,
      }
    },
    baseline: {
      label: "Base",
      description: "Condições atuais de mercado",
      params: DEFAULT_PARAMS
    },
    pessimistic: {
      label: "Pessimista",
      description: "Queda de preços e custos elevados",
      params: {
        royaltyChange: 2,
        taxChange: 3,
        environmentalCompliance: 15,
        opepQuotaChange: -5,
        brentPriceScenario: 60,
        currencyDevaluation: 20,
      }
    },
    crisis: {
      label: "Crise",
      description: "Cenário de stress extremo",
      params: {
        royaltyChange: 5,
        taxChange: 8,
        environmentalCompliance: 30,
        opepQuotaChange: -15,
        brentPriceScenario: 45,
        currencyDevaluation: 40,
      }
    },
  };

  const applyScenario = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    if (scenarioKey !== "custom") {
      setParams(scenarios[scenarioKey as keyof typeof scenarios].params);
    }
  };

  const results = useMemo<SimulationResult>(() => {
    const productionMultiplier = 1 + (params.opepQuotaChange / 100);
    const newProduction = BASE_VALUES.dailyProduction * productionMultiplier;
    
    const baseRevenue = BASE_VALUES.dailyProduction * BASE_VALUES.currentBrent * 365;
    const newRevenue = newProduction * params.brentPriceScenario * 365;
    const revenueImpact = ((newRevenue - baseRevenue) / baseRevenue) * 100;

    const envCostIncrease = params.environmentalCompliance / 100;
    const currencyCostIncrease = params.currencyDevaluation / 200;
    const newOperatingCost = BASE_VALUES.operatingCost * (1 + envCostIncrease + currencyCostIncrease);
    const productionCostImpact = ((newOperatingCost - BASE_VALUES.operatingCost) / BASE_VALUES.operatingCost) * 100;

    const currentGovTake = BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax;
    const newGovTake = (BASE_VALUES.currentRoyalty + params.royaltyChange) + (BASE_VALUES.currentTax + params.taxChange);
    const governmentTakeChange = newGovTake - currentGovTake;

    const currentMargin = BASE_VALUES.currentBrent - BASE_VALUES.operatingCost;
    const currentProfitPerBarrel = currentMargin * (1 - currentGovTake / 100);
    const newMargin = params.brentPriceScenario - newOperatingCost;
    const newProfitPerBarrel = newMargin * (1 - newGovTake / 100);
    const netProfitImpact = ((newProfitPerBarrel - currentProfitPerBarrel) / currentProfitPerBarrel) * 100;

    const breakEvenPrice = newOperatingCost / (1 - newGovTake / 100);

    // Calculate viability score (0-100)
    let score = 50;
    score += (params.brentPriceScenario - breakEvenPrice) * 2;
    score -= governmentTakeChange * 2;
    score = Math.max(0, Math.min(100, score));

    return {
      revenueImpact,
      productionCostImpact,
      netProfitImpact,
      exportVolumeImpact: params.opepQuotaChange,
      governmentTakeChange,
      breakEvenPrice,
      viabilityScore: score
    };
  }, [params]);

  const projectionData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((month, index) => {
      const factor = 1 + (results.netProfitImpact / 100) * ((index + 1) / 12);
      return {
        month,
        baseline: 100,
        scenario: Math.round(100 * factor),
      };
    });
  }, [results.netProfitImpact]);

  const getViabilityColor = (score: number) => {
    if (score > 70) return "text-emerald-500";
    if (score > 40) return "text-amber-500";
    return "text-rose-500";
  };

  const getViabilityLabel = (score: number) => {
    if (score > 70) return "Alta Atratividade";
    if (score > 40) return "Risco Moderado";
    return "Inviável / Crítico";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Impacto Regulatório</h1>
          </div>
          <p className="text-muted-foreground">Análise preditiva para o setor petrolífero angolano</p>
        </div>
        
        <div className="flex items-center gap-4 bg-secondary/20 p-3 rounded-xl border border-border/50">
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score de Viabilidade</p>
            <p className={`text-xl font-bold ${getViabilityColor(results.viabilityScore)}`}>
              {getViabilityLabel(results.viabilityScore)}
            </p>
          </div>
          <div className="w-12 h-12 relative">
             <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="stroke-muted fill-none"
                  strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`fill-none transition-all duration-500 ease-in-out ${
                    results.viabilityScore > 70 ? 'stroke-emerald-500' : results.viabilityScore > 40 ? 'stroke-amber-500' : 'stroke-rose-500'
                  }`}
                  strokeWidth="3"
                  strokeDasharray={`${results.viabilityScore}, 100`}
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {Math.round(results.viabilityScore)}%
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" /> Cenários Pré-definidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <Button
                    key={key}
                    variant={activeScenario === key ? "default" : "outline"}
                    className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 text-left"
                    onClick={() => applyScenario(key)}
                  >
                    <span className="text-xs font-bold">{scenario.label}</span>
                    <span className="text-[10px] opacity-70 font-normal leading-tight">{scenario.description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ajustes de Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fiscal Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <Building2 className="w-3 h-3" /> Fiscalidade
                </div>
                <div className="space-y-4">
                  <ParameterSlider 
                    label="Royalties" 
                    value={params.royaltyChange} 
                    min={-10} max={10} 
                    unit="pp"
                    onChange={(v) => { setParams({...params, royaltyChange: v}); setActiveScenario("custom"); }}
                  />
                  <ParameterSlider 
                    label="Imposto de Rendimento" 
                    value={params.taxChange} 
                    min={-10} max={10} 
                    unit="pp"
                    onChange={(v) => { setParams({...params, taxChange: v}); setActiveScenario("custom"); }}
                  />
                </div>
              </div>

              {/* Market Group */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <Globe className="w-3 h-3" /> Mercado & Operação
                </div>
                <div className="space-y-4">
                  <ParameterSlider 
                    label="Preço Brent" 
                    value={params.brentPriceScenario} 
                    min={40} max={120} 
                    unit="USD"
                    onChange={(v) => { setParams({...params, brentPriceScenario: v}); setActiveScenario("custom"); }}
                  />
                  <ParameterSlider 
                    label="Quota OPEP+" 
                    value={params.opepQuotaChange} 
                    min={-20} max={20} 
                    unit="%"
                    onChange={(v) => { setParams({...params, opepQuotaChange: v}); setActiveScenario("custom"); }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results & Visualizations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              label="Impacto na Receita" 
              value={results.revenueImpact} 
              icon={<DollarSign className="w-4 h-4" />}
              trend={results.revenueImpact > 0 ? "up" : "down"}
            />
            <MetricCard 
              label="Margem de Lucro" 
              value={results.netProfitImpact} 
              icon={<TrendingUp className="w-4 h-4" />}
              trend={results.netProfitImpact > 0 ? "up" : "down"}
            />
            <MetricCard 
              label="Break-even" 
              value={results.breakEvenPrice} 
              icon={<Scale className="w-4 h-4" />}
              unit="$/bbl"
              isAbsolute
              status={results.breakEvenPrice > params.brentPriceScenario ? "danger" : "success"}
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="analysis">Análise de Impacto</TabsTrigger>
              <TabsTrigger value="projection">Projeção 12 Meses</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Distribuição de Valor</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Gov Take', value: BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax + results.governmentTakeChange },
                            { name: 'Custos', value: (results.productionCostImpact / 100 + 1) * 25 },
                            { name: 'Margem', value: Math.max(0, params.brentPriceScenario - results.breakEvenPrice) }
                          ]}
                          cx="50%" cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--muted))" />
                          <Cell fill="hsl(var(--accent))" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Insights Estratégicos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InsightItem 
                      condition={results.viabilityScore < 40}
                      type="danger"
                      text="Risco elevado de desinvestimento. A carga fiscal supera a viabilidade operacional."
                    />
                    <InsightItem 
                      condition={results.breakEvenPrice > 65}
                      type="warning"
                      text="Vulnerabilidade alta a choques de preço externos. Necessário otimizar custos."
                    />
                    <InsightItem 
                      condition={results.netProfitImpact > 15}
                      type="success"
                      text="Cenário altamente atrativo para novos investimentos e exploração."
                    />
                    <InsightItem 
                      condition={true}
                      type="info"
                      text={`O Government Take atual situa-se em ${(BASE_VALUES.currentRoyalty + BASE_VALUES.currentTax + results.governmentTakeChange).toFixed(1)}%.`}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projection">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <defs>
                          <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="baseline" 
                          stroke="hsl(var(--muted-foreground))" 
                          fill="transparent" 
                          strokeDasharray="5 5" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="scenario" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorScenario)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ParameterSlider = ({ label, value, min, max, unit, onChange }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="font-mono">
        {value > 0 && "+"}{value}{unit}
      </Badge>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={label.includes("Brent") ? 1 : 0.5}
      onValueChange={([v]) => onChange(v)}
      className="cursor-pointer"
    />
  </div>
);

const MetricCard = ({ label, value, icon, trend, unit = "%", isAbsolute = false, status }: any) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 bg-secondary/50 rounded-md text-muted-foreground">
          {icon}
        </div>
        {status === "danger" ? (
          <Badge variant="destructive" className="animate-pulse">Crítico</Badge>
        ) : trend && (
          <div className={`flex items-center text-xs font-bold ${trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trend === "up" ? "Alta" : "Queda"}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold">
          {!isAbsolute && value > 0 && "+"}{value.toFixed(1)}{unit}
        </p>
      </div>
    </CardContent>
  </Card>
);

const InsightItem = ({ condition, type, text }: any) => {
  if (!condition && type !== "info") return null;
  
  const styles = {
    danger: "bg-rose-500/10 text-rose-600 border-rose-200",
    warning: "bg-amber-500/10 text-amber-600 border-amber-200",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    info: "bg-blue-500/10 text-blue-600 border-blue-200"
  };

  const icons = {
    danger: <XCircle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle2 className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs font-medium ${styles[type as keyof typeof styles]}`}>
      <div className="mt-0.5">{icons[type as keyof typeof icons]}</div>
      <p className="leading-relaxed">{text}</p>
    </div>
  );
};