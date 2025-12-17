import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, Users, Phone, Mail, Building2 } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Standard",
      price: "50.000",
      period: "por ano",
      description: "Acesso completo à plataforma AlphaData com todas as funcionalidades essenciais",
      popular: true,
      features: [
        "Dashboard em tempo real",
        "Dados de produção por bloco/operador",
        "Preços Brent e crudes angolanos",
        "Exportações e logística",
        "Previsões IA 30/60/90 dias",
        "Risco geopolítico",
        "Relatórios mensais automáticos",
        "Alertas configuráveis",
        "Suporte por email",
        "Até 5 usuários",
      ],
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Soluções sob medida para grandes organizações com necessidades específicas",
      popular: false,
      features: [
        "Tudo do plano Standard",
        "Usuários ilimitados",
        "API de integração",
        "White-label customizado",
        "Domínio personalizado",
        "Relatórios personalizados",
        "Dados históricos completos",
        "Suporte prioritário 24/7",
        "Gerente de conta dedicado",
        "Treinamento on-site",
      ],
    },
    {
      name: "Consultoria",
      price: "Sob consulta",
      period: "",
      description: "Análises especializadas e relatórios customizados para projetos específicos",
      popular: false,
      features: [
        "Estudos de viabilidade",
        "Análise de mercado personalizada",
        "Due diligence petrolífero",
        "Projeções customizadas",
        "Relatórios ad-hoc",
        "Workshops estratégicos",
        "Consultoria regulatória",
        "Suporte a decisões M&A",
      ],
    },
  ];

  const faqs = [
    {
      question: "Qual a duração do contrato?",
      answer: "O plano Standard tem contrato anual. Planos Enterprise e Consultoria são negociados conforme a necessidade do cliente.",
    },
    {
      question: "Posso fazer um teste antes de contratar?",
      answer: "Sim, oferecemos demonstrações personalizadas e período de avaliação para empresas qualificadas.",
    },
    {
      question: "Como funciona o pagamento?",
      answer: "Aceitamos transferência bancária, cartão corporativo e faturamento direto para empresas estabelecidas.",
    },
    {
      question: "Os dados são atualizados em tempo real?",
      answer: "Preços de mercado são atualizados em tempo real. Dados de produção e exportação são atualizados diariamente ou conforme disponibilidade oficial.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/pricing" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/pricing" />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Planos e Preços
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Inteligência estratégica para o setor petrolífero angolano. 
              Escolha o plano que melhor atende às necessidades da sua organização.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`bg-card border-border relative overflow-hidden transition-all hover:border-primary/50 ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Star className="h-3 w-3 inline mr-1" />
                    Mais Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl text-foreground">{plan.name}</CardTitle>
                  <div className="mt-3">
                    {plan.price === "Personalizado" || plan.price === "Sob consulta" ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">{plan.price}</span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">USD </span>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 sm:space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-primary hover:bg-primary/90" 
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {plan.price === "Personalizado" || plan.price === "Sob consulta" 
                      ? "Contactar Vendas" 
                      : "Começar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-bold text-foreground text-center mb-6">
              Por que escolher a AlphaData?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="p-3 rounded-lg bg-primary/20 w-fit mx-auto mb-3">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-foreground mb-1">Dados em Tempo Real</h3>
                  <p className="text-xs text-muted-foreground">Preços e informações atualizados instantaneamente</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/20 w-fit mx-auto mb-3">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-foreground mb-1">Segurança Máxima</h3>
                  <p className="text-xs text-muted-foreground">Dados criptografados e acesso controlado</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="p-3 rounded-lg bg-amber-500/20 w-fit mx-auto mb-3">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-foreground mb-1">IA Avançada</h3>
                  <p className="text-xs text-muted-foreground">Previsões precisas com machine learning</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="p-3 rounded-lg bg-blue-500/20 w-fit mx-auto mb-3">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-foreground mb-1">Suporte Dedicado</h3>
                  <p className="text-xs text-muted-foreground">Equipe especializada no setor petrolífero</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="bg-card border-border mb-8 sm:mb-12">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-foreground text-center">
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm text-foreground mb-2">{faq.question}</h4>
                    <p className="text-xs text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    Precisa de uma solução personalizada?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Nossa equipe está pronta para criar uma proposta sob medida para sua organização.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    vendas@alphadata.ao
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 gap-2">
                    <Phone className="h-4 w-4" />
                    Agendar Demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Pricing;
