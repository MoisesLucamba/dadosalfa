import { useState, useMemo } from "react";
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
  Phone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addMonths, addYears } from "date-fns";
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

// Plans configuration
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 14000,
    maxUsers: 6,
    maxWorkspaces: 1,
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
    maxWorkspaces: -1, // unlimited
    popular: true,
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
    maxUsers: -1, // unlimited
    maxWorkspaces: -1,
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

// Mock billing history data
const mockBillingHistory = [
  { id: '1', date: new Date('2025-12-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Dezembro 2025', invoice: 'INV-2025-012' },
  { id: '2', date: new Date('2025-11-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Novembro 2025', invoice: 'INV-2025-011' },
  { id: '3', date: new Date('2025-10-01'), amount: 39999, status: 'paid', description: 'Plano Professional - Outubro 2025', invoice: 'INV-2025-010' },
  { id: '4', date: new Date('2025-09-01'), amount: 14000, status: 'paid', description: 'Plano Starter - Setembro 2025', invoice: 'INV-2025-009' },
  { id: '5', date: new Date('2025-08-01'), amount: 14000, status: 'paid', description: 'Plano Starter - Agosto 2025', invoice: 'INV-2025-008' },
];

// Mock current subscription
const mockSubscription = {
  plan: 'professional',
  status: 'active',
  startDate: new Date('2025-09-01'),
  renewalDate: addYears(new Date(), 1),
  billingCycle: 'annual',
  currentUsers: 8,
  maxUsers: 16,
  currentWorkspaces: 3,
  usagePercent: 50,
};

const Subscription = () => {
  const { user } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const currentPlan = PLANS.find(p => p.id === mockSubscription.plan);

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeDialog(true);
  };

  const handleDowngrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowDowngradeDialog(true);
  };

  const confirmPlanChange = async (type: 'upgrade' | 'downgrade') => {
    setProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Plano ${type === 'upgrade' ? 'atualizado' : 'alterado'} com sucesso!`, {
      description: 'As alterações entrarão em vigor no próximo ciclo de faturação.',
    });
    
    setProcessing(false);
    setShowUpgradeDialog(false);
    setShowDowngradeDialog(false);
  };

  const downloadInvoice = (invoice: string) => {
    toast.success(`Fatura ${invoice} a ser descarregada...`);
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter': return 'bg-slate-500';
      case 'professional': return 'bg-primary';
      case 'enterprise': return 'bg-amber-500';
      default: return 'bg-muted';
    }
  };

  const targetPlan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/subscription" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/subscription" />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Gestão de Subscrição
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie seu plano, utilizadores e histórico de faturação
                </p>
              </div>
            </div>

            {/* Current Plan Overview */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${getPlanColor(mockSubscription.plan)}`}>
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">
                          Plano {currentPlan?.name}
                        </h2>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          Activo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${currentPlan?.price.toLocaleString()}/ano • Renovação em {format(mockSubscription.renewalDate, "dd MMM yyyy", { locale: pt })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Contrato
                    </Button>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Zap className="h-4 w-4" />
                      Actualizar Plano
                    </Button>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/50">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Utilizadores</span>
                      <span className="text-sm font-medium text-foreground">
                        {mockSubscription.currentUsers}/{currentPlan?.maxUsers === -1 ? '∞' : currentPlan?.maxUsers}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan?.maxUsers === -1 ? 20 : (mockSubscription.currentUsers / (currentPlan?.maxUsers || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Workspaces</span>
                      <span className="text-sm font-medium text-foreground">
                        {mockSubscription.currentWorkspaces}/{currentPlan?.maxWorkspaces === -1 ? '∞' : currentPlan?.maxWorkspaces}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan?.maxWorkspaces === -1 ? 30 : (mockSubscription.currentWorkspaces / (currentPlan?.maxWorkspaces || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Uso Geral</span>
                      <span className="text-sm font-medium text-foreground">
                        {mockSubscription.usagePercent}%
                      </span>
                    </div>
                    <Progress value={mockSubscription.usagePercent} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="plans" className="space-y-6">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="billing">Histórico de Faturação</TabsTrigger>
                <TabsTrigger value="payment">Método de Pagamento</TabsTrigger>
              </TabsList>

              {/* Plans Comparison */}
              <TabsContent value="plans" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {PLANS.map((plan) => {
                    const isCurrent = plan.id === mockSubscription.plan;
                    const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === mockSubscription.plan);
                    const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === mockSubscription.plan);
                    
                    return (
                      <Card 
                        key={plan.id}
                        className={`bg-card border-border relative transition-all hover:border-primary/50 ${
                          isCurrent ? 'ring-2 ring-primary' : ''
                        } ${plan.popular ? 'border-primary/30' : ''}`}
                      >
                        {isCurrent && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                            Plano Atual
                          </div>
                        )}
                        {plan.popular && !isCurrent && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                            Mais Popular
                          </div>
                        )}
                        
                        <CardHeader className="pb-4">
                          <div className={`p-3 rounded-lg ${getPlanColor(plan.id)} w-fit mb-3`}>
                            {plan.id === 'starter' && <Users className="h-6 w-6 text-white" />}
                            {plan.id === 'professional' && <Zap className="h-6 w-6 text-white" />}
                            {plan.id === 'enterprise' && <Building2 className="h-6 w-6 text-white" />}
                          </div>
                          <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">USD </span>
                            <span className="text-2xl font-bold text-foreground">
                              ${plan.price.toLocaleString()}
                              {plan.priceMax && `- $${plan.priceMax.toLocaleString()}`}
                            </span>
                            <span className="text-sm text-muted-foreground">/ano</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Até {plan.maxUsers === -1 ? 'ilimitados' : plan.maxUsers} usuários
                            </span>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {isCurrent ? (
                            <Button variant="outline" className="w-full" disabled>
                              Plano Atual
                            </Button>
                          ) : isUpgrade ? (
                            <Button 
                              className="w-full gap-2 bg-primary hover:bg-primary/90"
                              onClick={() => handleUpgrade(plan.id)}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                              Actualizar
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full gap-2"
                              onClick={() => handleDowngrade(plan.id)}
                            >
                              <ArrowDownRight className="h-4 w-4" />
                              Fazer Downgrade
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Custom Plan CTA */}
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Precisa de algo personalizado?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Entre em contacto para discutir soluções empresariais à medida
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        vendas@alphadata.ao
                      </Button>
                      <Button className="gap-2">
                        <Phone className="h-4 w-4" />
                        Agendar Demonstração
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing History */}
              <TabsContent value="billing" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Histórico de Faturação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockBillingHistory.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${item.status === 'paid' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                              {item.status === 'paid' ? (
                                <Check className="h-5 w-5 text-primary" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(item.date, "dd MMM yyyy", { locale: pt })} • {item.invoice}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">
                                ${item.amount.toLocaleString()}
                              </p>
                              <Badge 
                                variant="secondary"
                                className={item.status === 'paid' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}
                              >
                                {item.status === 'paid' ? 'Pago' : 'Pendente'}
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadInvoice(item.invoice)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Method */}
              <TabsContent value="payment" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Método de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-slate-800">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                            <p className="text-xs text-muted-foreground">Expira 12/2027</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">Principal</Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Adicionar Cartão
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Transferência Bancária
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Próxima Cobrança</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ${currentPlan?.price.toLocaleString()} USD será cobrado em {format(mockSubscription.renewalDate, "dd MMM yyyy", { locale: pt })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar para {targetPlan?.name}</DialogTitle>
            <DialogDescription>
              Terá acesso a todas as funcionalidades do plano {targetPlan?.name} imediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Plano Atual</span>
                <span className="text-sm font-medium">${currentPlan?.price.toLocaleString()}/ano</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Novo Plano</span>
                <span className="text-sm font-bold text-primary">${targetPlan?.price.toLocaleString()}/ano</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A diferença proporcional será cobrada no próximo ciclo de faturação.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmPlanChange('upgrade')}
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  Confirmar Upgrade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fazer Downgrade para {targetPlan?.name}</DialogTitle>
            <DialogDescription>
              Algumas funcionalidades poderão ser limitadas com esta mudança.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Atenção</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se tiver mais de {targetPlan?.maxUsers} utilizadores ou {targetPlan?.maxWorkspaces} workspace(s), 
                    terá de remover os excedentes antes de confirmar.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Plano Atual</span>
                <span className="text-sm font-medium">${currentPlan?.price.toLocaleString()}/ano</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Novo Plano</span>
                <span className="text-sm font-bold text-foreground">${targetPlan?.price.toLocaleString()}/ano</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => confirmPlanChange('downgrade')}
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4" />
                  Confirmar Downgrade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
