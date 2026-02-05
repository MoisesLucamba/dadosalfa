import React, { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Check,
  Clock,
  FileText,
  Download,
  AlertCircle,
  Calendar,
  Star,
  Zap,
  Building2,
  Mail,
  Phone,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addYears } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// --- Types ---

interface Plan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxWorkspaces: number;
  features: string[];
  popular?: boolean;
  color: string;
  priceMax?: number;
}

interface BillingHistoryItem {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoice: string;
}

interface SubscriptionData {
  plan: string;
  status: 'active' | 'past_due' | 'canceled';
  startDate: Date;
  renewalDate: Date;
  billingCycle: 'monthly' | 'annual';
  currentUsers: number;
  currentWorkspaces: number;
  usagePercent: number;
}

// --- Constants & Mock Data ---

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 14000,
    maxUsers: 6,
    maxWorkspaces: 1,
    color: 'bg-slate-500',
    features: [
      'Dashboard em tempo real',
      'Dados de produção por bloco/operador',
      'Preços Brent e crudes angolanos',
      'Exportações e logística',
      'Previsões IA 30/60/90 dias',
      'Relatórios mensais automáticos',
      'Suporte por email',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 39999,
    maxUsers: 16,
    maxWorkspaces: -1,
    popular: true,
    color: 'bg-primary',
    features: [
      'Tudo do plano Starter',
      'Workspaces ilimitados',
      'API de integração básica',
      'Relatórios personalizados',
      'Dados históricos completos',
      'Análise de competidores',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 60000,
    priceMax: 100000,
    maxUsers: -1,
    maxWorkspaces: -1,
    color: 'bg-amber-500',
    features: [
      'Tudo do plano Professional',
      'Usuários ilimitados',
      'API de integração completa',
      'White-label customizado',
      'Domínio personalizado',
      'Suporte 24/7',
      'Gerente dedicado',
    ],
  },
];

const MOCK_BILLING_HISTORY: BillingHistoryItem[] = [
  { id: '1', date: new Date('2025-12-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Dezembro 2025', invoice: 'INV-2025-012' },
  { id: '2', date: new Date('2025-11-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Novembro 2025', invoice: 'INV-2025-011' },
  { id: '3', date: new Date('2025-10-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Outubro 2025', invoice: 'INV-2025-010' },
  { id: '4', date: new Date('2025-09-01'), amount: 14000, status: 'paid', description: 'Plano Starter - Setembro 2025', invoice: 'INV-2025-009' },
  { id: '5', date: new Date('2025-08-01'), amount: 14000, status: 'paid', description: 'Plano Starter - Agosto 2025', invoice: 'INV-2025-008' },
];

const MOCK_SUBSCRIPTION: SubscriptionData = {
  plan: 'professional',
  status: 'active',
  startDate: new Date('2025-09-01'),
  renewalDate: addYears(new Date(), 1),
  billingCycle: 'annual',
  currentUsers: 8,
  currentWorkspaces: 3,
  usagePercent: 50,
};

// --- Helper Functions ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);
};

// --- Sub-components ---

const UsageMetric = ({ 
  label, 
  current, 
  max, 
  percent 
}: { 
  label: string; 
  current: number; 
  max: number; 
  percent?: number 
}) => {
  const displayMax = max === -1 ? '∞' : max;
  const progressValue = percent ?? (max === -1 ? 20 : (current / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">
          {current}{max !== undefined && ` / ${displayMax}`}
          {percent !== undefined && '%'}
        </span>
      </div>
      <Progress value={progressValue} className="h-2" />
    </div>
  );
};

const PlanCard = ({ 
  plan, 
  isCurrent, 
  onAction 
}: { 
  plan: Plan; 
  isCurrent: boolean; 
  onAction: (id: string, type: 'upgrade' | 'downgrade') => void 
}) => {
  const currentPlanIndex = PLANS.findIndex(p => p.id === MOCK_SUBSCRIPTION.plan);
  const thisPlanIndex = PLANS.findIndex(p => p.id === plan.id);
  const isUpgrade = thisPlanIndex > currentPlanIndex;

  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-200 hover:shadow-md",
      plan.popular && "border-primary shadow-sm scale-[1.02] z-10",
      isCurrent && "bg-muted/30"
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">Mais Popular</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{plan.name}</span>
          {isCurrent && <Badge variant="outline" className="text-xs">Plano Atual</Badge>}
        </CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
          <span className="text-muted-foreground text-sm ml-1">/ano</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-6">
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          variant={isCurrent ? "outline" : plan.popular ? "default" : "secondary"}
          className="w-full mt-4"
          disabled={isCurrent}
          onClick={() => !isCurrent && onAction(plan.id, isUpgrade ? 'upgrade' : 'downgrade')}
        >
          {isCurrent ? "Plano Atual" : isUpgrade ? "Fazer Upgrade" : "Mudar para este Plano"}
        </Button>
      </CardContent>
    </Card>
  );
};

// --- Main Component ---

const Subscription = () => {
  const { user } = useAuth();
  const [dialogState, setDialogState] = useState<{
    type: 'upgrade' | 'downgrade' | null;
    planId: string | null;
  }>({ type: null, planId: null });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlan = useMemo(() => 
    PLANS.find(p => p.id === MOCK_SUBSCRIPTION.plan) || PLANS[0], 
  []);

  const targetPlan = useMemo(() => 
    PLANS.find(p => p.id === dialogState.planId), 
  [dialogState.planId]);

  const handlePlanAction = useCallback((planId: string, type: 'upgrade' | 'downgrade') => {
    setDialogState({ type, planId });
  }, []);

  const closeDialog = () => setDialogState({ type: null, planId: null });

  const confirmPlanChange = async () => {
    setIsProcessing(true);
    try {
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Plano ${dialogState.type === 'upgrade' ? 'atualizado' : 'alterado'} com sucesso!`, {
        description: 'As alterações entrarão em vigor no próximo ciclo de faturação.',
      });
      
      closeDialog();
    } catch (error) {
      toast.error("Erro ao alterar o plano. Por favor, tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/subscription" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/subscription" />
        
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Gestão de Subscrição
              </h1>
              <p className="text-muted-foreground">
                Gerencie o seu plano, utilizadores e histórico de faturação de forma centralizada.
              </p>
            </header>

            {/* Current Plan Hero Card */}
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
              <CardContent className="p-0">
                <div className="p-6 lg:p-8 flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex gap-5">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0",
                      currentPlan.color
                    )}>
                      <Star className="h-7 w-7 fill-current" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">Plano {currentPlan.name}</h2>
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">
                          Ativo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(currentPlan.price)}/ano • Próxima renovação: {format(MOCK_SUBSCRIPTION.renewalDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="outline" size="sm" className="h-10 gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Contrato
                    </Button>
                    <Button size="sm" className="h-10 gap-2 shadow-sm">
                      <Zap className="h-4 w-4" />
                      Atualizar Agora
                    </Button>
                  </div>
                </div>

                {/* Usage Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 lg:p-8 bg-muted/30 border-t border-border/50">
                  <UsageMetric 
                    label="Utilizadores" 
                    current={MOCK_SUBSCRIPTION.currentUsers} 
                    max={currentPlan.maxUsers} 
                  />
                  <UsageMetric 
                    label="Workspaces" 
                    current={MOCK_SUBSCRIPTION.currentWorkspaces} 
                    max={currentPlan.maxWorkspaces} 
                  />
                  <UsageMetric 
                    label="Uso Geral" 
                    current={MOCK_SUBSCRIPTION.usagePercent} 
                    max={100}
                    percent={MOCK_SUBSCRIPTION.usagePercent}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 gap-6">
                <TabsTrigger 
                  value="plans" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none h-full px-2"
                >
                  Planos Disponíveis
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none h-full px-2"
                >
                  Histórico de Faturação
                </TabsTrigger>
                <TabsTrigger 
                  value="payment" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none h-full px-2"
                >
                  Método de Pagamento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PLANS.map((plan) => (
                    <PlanCard 
                      key={plan.id} 
                      plan={plan} 
                      isCurrent={plan.id === MOCK_SUBSCRIPTION.plan}
                      onAction={handlePlanAction}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="billing" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Faturas Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 font-medium">Data</th>
                            <th className="px-4 py-3 font-medium">Descrição</th>
                            <th className="px-4 py-3 font-medium">Valor</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {MOCK_BILLING_HISTORY.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                {format(item.date, "dd MMM yyyy", { locale: pt })}
                              </td>
                              <td className="px-4 py-4 font-medium">{item.description}</td>
                              <td className="px-4 py-4">{formatCurrency(item.amount)}</td>
                              <td className="px-4 py-4">
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
                                  Pago
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payment" className="pt-6">
                <Card>
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">Nenhum cartão guardado</h3>
                      <p className="text-sm text-muted-foreground">Adicione um método de pagamento para futuras renovações.</p>
                    </div>
                    <Button variant="outline">Adicionar Cartão</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dynamic Dialog for Plan Changes */}
      <Dialog open={!!dialogState.type} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogState.type === 'upgrade' ? (
                <><ArrowUpRight className="h-5 w-5 text-primary" /> Upgrade de Plano</>
              ) : (
                <><ArrowDownRight className="h-5 w-5 text-destructive" /> Alteração de Plano</>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === 'upgrade' 
                ? `Está prestes a mudar para o plano ${targetPlan?.name}. Terá acesso imediato a todas as novas funcionalidades.`
                : `Está a mudar para o plano ${targetPlan?.name}. Algumas funcionalidades e limites serão reduzidos.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {dialogState.type === 'downgrade' && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10 flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive-foreground/80">
                  Certifique-se de que o seu uso atual ({MOCK_SUBSCRIPTION.currentUsers} utilizadores) 
                  está dentro dos limites do novo plano ({targetPlan?.maxUsers === -1 ? 'ilimitado' : targetPlan?.maxUsers}).
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano Atual</span>
                <span className="font-medium">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novo Plano</span>
                <span className="font-bold text-primary">{targetPlan?.name}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-baseline">
                <span className="text-sm font-medium">Novo Valor</span>
                <span className="text-xl font-bold">{targetPlan ? formatCurrency(targetPlan.price) : '-'}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={closeDialog} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmPlanChange} 
              disabled={isProcessing}
              variant={dialogState.type === 'downgrade' ? 'destructive' : 'default'}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <><Clock className="h-4 w-4 animate-spin mr-2" /> Processando</>
              ) : (
                'Confirmar Mudança'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;