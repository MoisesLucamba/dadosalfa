import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { 
  BarChart3, Globe, Shield, TrendingUp, Database,
  ArrowRight, CheckCircle2, ChevronRight, Building2,
  Users, FileText, Scale, Lock, PieChart, Briefcase,
  ExternalLink, Gavel, Mail, Phone, MapPin, Linkedin, Twitter
} from "lucide-react";

// --- Mock Components for UI consistency ---
const Button = ({ children, className, variant, onClick, ...props }: any) => {
  const baseStyles = "px-6 py-2 font-bold transition-all duration-200 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-[#002855] hover:bg-[#001d3d] text-white",
    secondary: "bg-[#C8102E] hover:bg-[#a30d25] text-white",
    outline: "border-2 border-[#002855] text-[#002855] hover:bg-[#002855] hover:text-white",
    ghost: "text-[#002855] hover:bg-gray-100",
    whiteOutline: "border-2 border-white text-white hover:bg-white hover:text-[#002855]"
  };
  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant || 'primary']} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Data & Constants ---
const corporateStats = [
  { value: "25+", label: "Jurisdições Africanas", icon: Globe },
  { value: "500+", label: "Entidades Corporativas", icon: Building2 },
  { value: "98.5%", label: "Precisão Regulatória", icon: Scale },
  { value: "24/7", label: "Monitorização Crítica", icon: Shield }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "USD $14,000/ano",
    users: "Até 6 usuários",
    features: [
      "Dashboard em tempo real",
      "Dados de produção por bloco/operador",
      "Preços Brent e crudes angolanos",
      "Exportações e logística",
      "Previsões IA 30/60/90 dias",
      "Relatórios mensais automáticos",
      "Suporte por email",
    ],
    buttonText: "Fazer Downgrade",
  },
  {
    name: "Professional",
    price: "USD $39,999/ano",
    users: "Até 16 usuários",
    features: [
      "Tudo do plano Starter",
      "Workspaces ilimitados",
      "API de integração básica",
      "Relatórios personalizados",
      "Dados históricos completos",
      "Análise de competidores",
      "Suporte prioritário",
    ],
    buttonText: "Plano Atual",
  },
  {
    name: "Enterprise",
    price: "USD $250,000/ano",
    users: "Usuários ilimitados",
    features: [
      "Tudo do plano Professional",
      "API de integração completa",
      "White-label customizado",
      "Domínio personalizado",
      "Suporte 24/7",
      "Gerente dedicado",
    ],
    buttonText: "Actualizar",
  },
];

const intelligencePilars = [
  { 
    id: "mercado",
    title: "Inteligência de Mercado", 
    desc: "Dados consolidados de produção, exportação e preços spot de todos os crudes africanos.",
    content: "Nossa plataforma oferece uma visão granular do mercado energético africano. Monitoramos mais de 150 campos de petróleo e gás, fornecendo dados de produção diária, cronogramas de carregamento e análises de diferencial de preço para crudes como Girassol, Nemba e Dália. Utilizamos algoritmos de IA para prever tendências de oferta e demanda com 98% de precisão histórica.",
    icon: BarChart3
  },
  { 
    id: "geopolitica",
    title: "Análise Geopolítica", 
    desc: "Relatórios de risco país e monitorização de estabilidade política em regiões estratégicas.",
    content: "Analisamos o cenário político e social em 25 jurisdições. Nossos relatórios incluem avaliações de risco de expropriação, estabilidade contratual e impacto de eleições locais nas políticas energéticas. Mantemos uma rede de analistas locais que fornecem 'intelligence' de campo, permitindo que nossos clientes antecipem mudanças regulatórias antes que se tornem lei.",
    icon: Globe
  },
  { 
    id: "logistica",
    title: "Logística e Supply Chain", 
    desc: "Rastreamento de navios, inventários em terminais e otimização de rotas de exportação.",
    content: "Integramos dados de satélite (AIS) para rastrear cada navio-tanque que opera na costa africana. Nossa solução de logística permite otimizar o 'timing' de exportação, monitorar níveis de estoque em terminais estratégicos e identificar gargalos na infraestrutura de transporte, reduzindo custos operacionais e tempos de espera.",
    icon: Database
  },
  { 
    id: "fiscalidade",
    title: "Fiscalidade e Taxas", 
    desc: "Calculadoras avançadas para impostos petrolíferos e taxas de superfície.",
    content: "O sistema fiscal do setor extrativo é complexo. Oferecemos calculadoras parametrizadas para diferentes tipos de contratos (PSA, Concessão, Serviços). Simule o impacto de mudanças no Imposto sobre o Rendimento do Petróleo (IRP), Taxa de Produção e contribuições para o conteúdo local com precisão matemática auditável.",
    icon: PieChart
  },
  { 
    id: "historico",
    title: "Base de Dados Histórica", 
    desc: "Acesso a mais de 30 anos de dados históricos do setor energético africano.",
    content: "Nossa biblioteca digital contém décadas de estatísticas de produção, relatórios anuais de ministérios e séries temporais de preços. Essencial para modelagem financeira de longo prazo e análise de tendências históricas de investimento direto estrangeiro no setor de energia.",
    icon: FileText
  },
  { 
    id: "seguranca",
    title: "Segurança de Dados", 
    desc: "Infraestrutura de nível governamental com encriptação AES-256 e redundância global.",
    content: "A confidencialidade é nossa prioridade. Utilizamos protocolos de segurança bancária, autenticação de múltiplos fatores e auditorias de segurança trimestrais. Seus dados estratégicos são armazenados em servidores redundantes com soberania de dados garantida, protegendo contra espionagem industrial e ciberataques.",
    icon: Lock
  }
];

// --- Main Component ---
export default function InstitutionalLanding() {
  const [currentPage, setCurrentPage] = useState("home");
  const [activePlan, setActivePlan] = useState(1);
  const [selectedPilar, setSelectedPilar] = useState<any>(null);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" onClick={() => setCurrentPage("home")}>
            <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto" />
          </Link>
          <div className="hidden lg:flex items-center gap-6 border-l border-border pl-8">
            {[
              { id: "solucoes", label: "Soluções" },
              { id: "regulacao", label: "Regulação" },
              { id: "dados", label: "Dados" },
              { id: "sobre", label: "Sobre" }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setCurrentPage(item.id)}
                className={`text-sm font-bold uppercase tracking-tight transition-colors ${currentPage === item.id ? 'text-primary' : 'text-foreground hover:text-primary'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="hidden md:flex text-foreground hover:bg-muted">Portal do Cliente</Button>
          </Link>
          <Link to="/auth">
            <Button variant="primary" className="rounded-none px-8 bg-primary text-primary-foreground hover:bg-primary/90">SOLICITAR ACESSO</Button>
          </Link>
        </div>
      </div>
    </nav>
  );

  const renderFooter = () => (
    <footer className="bg-[#1a1a1a] text-white py-20 border-t-8 border-[#002855]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <Link to="/" onClick={() => setCurrentPage("home")}>
              <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto mb-6 brightness-200" />
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Líder em Market Intelligence para o setor energético africano. Sediada em Luanda, com presença global e compromisso com a transparência de dados.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Soluções</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-bold">
              <li><button onClick={() => setCurrentPage("solucoes")} className="hover:text-white transition-colors">Inteligência de Mercado</button></li>
              <li><button onClick={() => setCurrentPage("regulacao")} className="hover:text-white transition-colors">Análise Regulatória</button></li>
              <li><button onClick={() => setCurrentPage("dados")} className="hover:text-white transition-colors">Logística de Crudes</button></li>
              <li><button onClick={() => setCurrentPage("solucoes")} className="hover:text-white transition-colors">Consultoria Técnica</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Empresa</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-bold">
              <li><button onClick={() => setCurrentPage("sobre")} className="hover:text-white transition-colors">Sobre a AlphaData</button></li>
              <li><button onClick={() => setCurrentPage("sobre")} className="hover:text-white transition-colors">Equipa Executiva</button></li>
              <li><button onClick={() => setCurrentPage("carreiras")} className="hover:text-white transition-colors">Carreiras</button></li>
              <li><button onClick={() => setCurrentPage("contacto")} className="hover:text-white transition-colors">Contacto</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Legal</h4>
            <ul className="space-y-3 text-xs text-gray-400 font-bold">
              <li><button onClick={() => setCurrentPage("termos")} className="hover:text-white transition-colors">Termos e Condições</button></li>
              <li><button onClick={() => setCurrentPage("privacidade")} className="hover:text-white transition-colors">Política de Privacidade</button></li>
              <li><button onClick={() => setCurrentPage("compliance")} className="hover:text-white transition-colors">Conformidade Anti-Corrupção</button></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div>© 2024 ALPHADATA INTELLIGENCE. TODOS OS DIREITOS RESERVADOS.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Linkedin className="w-3 h-3"/> LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Twitter className="w-3 h-3"/> Twitter</a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Bloomberg</a>
          </div>
        </div>
      </div>
    </footer>
  );

  // --- Page Components ---

  const HomePage = () => (
    <>
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 bg-[#002855] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#C8102E] opacity-10 skew-x-[-20deg] translate-x-20" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-12 h-1 bg-[#C8102E] mb-6" />
              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] mb-8 tracking-tight">
                Inteligência Estratégica para o Setor de <span className="text-[#C8102E]">Energia em África.</span>
              </h1>
              <p className="text-xl text-blue-100/80 mb-10 leading-relaxed font-light max-w-xl">
                Providenciamos dados críticos, análise regulatória e monitorização de mercado para governos, operadoras e investidores institucionais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" className="h-14 px-8 text-base shadow-lg">DEMONSTRAÇÃO TÉCNICA</Button>
                <Button variant="whiteOutline" className="h-14 px-8 text-base">RELATÓRIO ANUAL 2024</Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl p-2 border border-gray-200">
              <div className="bg-[#f8f9fa] rounded p-6">
                <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#002855] rounded flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[#002855] text-sm">MONITOR DE PRODUÇÃO NACIONAL</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live: Angola Blocks</div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "BRENT SPOT", val: "$78.45", change: "+1.2%" },
                    { label: "PROD. DIÁRIA", val: "1.08M", change: "-0.5%" },
                    { label: "EXPORTAÇÕES", val: "942K", change: "+2.1%" }
                  ].map((d, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-100 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-500 mb-1">{d.label}</div>
                      <div className="text-xl font-black text-[#002855]">{d.val}</div>
                      <div className={`text-[10px] font-bold ${d.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{d.change}</div>
                    </div>
                  ))}
                </div>
                <div className="h-40 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-gray-200" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {corporateStats.map((stat, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#002855]">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-[#002855]">{stat.value}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pilares de Inteligência */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#002855] mb-4 uppercase tracking-tighter">Pilares de Inteligência</h2>
            <div className="w-20 h-1 bg-[#C8102E] mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {intelligencePilars.map((sol, i) => (
              <div key={i} className="p-8 border border-gray-100 hover:border-[#002855]/20 hover:shadow-xl transition-all group flex flex-col">
                <sol.icon className="w-10 h-10 text-[#C8102E] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-[#002855] mb-4 uppercase">{sol.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-grow">{sol.desc}</p>
                <button 
                  onClick={() => setSelectedPilar(sol)}
                  className="text-[10px] font-black text-[#002855] uppercase tracking-widest flex items-center gap-2 hover:text-[#C8102E] self-start"
                >
                  Saber mais <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal para Saber Mais */}
      <AnimatePresence>
        {selectedPilar && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPilar(null)}
              className="absolute inset-0 bg-[#002855]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white max-w-2xl w-full p-10 shadow-2xl border-t-8 border-[#C8102E]"
            >
              <button onClick={() => setSelectedPilar(null)} className="absolute top-4 right-4 text-gray-400 hover:text-[#002855]">
                <Lock className="w-6 h-6 rotate-45" />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-[#C8102E]">
                  <selectedPilar.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[#002855] uppercase">{selectedPilar.title}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                {selectedPilar.content}
              </p>
              <Button variant="primary" className="w-full py-4" onClick={() => setSelectedPilar(null)}>FECHAR DETALHES</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-[#002855] mb-12 uppercase tracking-tighter">Planos de Acesso</h2>
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            {pricingPlans.map((plan, i) => (
              <button
                key={i}
                className={`px-8 py-3 font-bold transition-all ${i === activePlan ? "bg-[#C8102E] text-white shadow-lg" : "bg-white text-[#002855] border border-gray-200 hover:border-[#002855]"}`}
                onClick={() => setActivePlan(i)}
              >
                {plan.name}
              </button>
            ))}
          </div>
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePlan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-10 border border-gray-200 shadow-xl text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#002855]/5 -mr-16 -mt-16 rounded-full" />
                <h3 className="text-3xl font-black text-[#002855] mb-2">{pricingPlans[activePlan].name}</h3>
                <p className="text-2xl text-[#C8102E] font-black mb-2">{pricingPlans[activePlan].price}</p>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-8">{pricingPlans[activePlan].users}</p>
                <div className="grid md:grid-cols-2 gap-4 mb-10">
                  {pricingPlans[activePlan].features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Button variant="primary" className="w-full py-4 text-lg">{pricingPlans[activePlan].buttonText}</Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );

  const SolucoesPage = () => (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Nossas Soluções</span>
          <h1 className="text-5xl font-black text-[#002855] mb-6">Ecossistema de Inteligência Energética</h1>
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            Oferecemos um conjunto integrado de ferramentas e serviços projetados para mitigar riscos e maximizar oportunidades no setor de óleo e gás em África.
          </p>
        </div>

        <div className="grid gap-12">
          {intelligencePilars.map((pilar, i) => (
            <div key={i} className={`flex flex-col lg:flex-row gap-12 items-center p-12 border border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50 lg:flex-row-reverse'}`}>
              <div className="lg:w-1/2">
                <div className="w-16 h-16 bg-[#002855] text-white flex items-center justify-center mb-6">
                  <pilar.icon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-[#002855] mb-6 uppercase">{pilar.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  {pilar.content}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 font-bold text-[#002855]"><CheckCircle2 className="w-5 h-5 text-[#C8102E]"/> Relatórios Customizados</li>
                  <li className="flex items-center gap-3 font-bold text-[#002855]"><CheckCircle2 className="w-5 h-5 text-[#C8102E]"/> Integração via API</li>
                  <li className="flex items-center gap-3 font-bold text-[#002855]"><CheckCircle2 className="w-5 h-5 text-[#C8102E]"/> Suporte Técnico Especializado</li>
                </ul>
                <Button variant="outline">SOLICITAR DEMONSTRAÇÃO</Button>
              </div>
              <div className="lg:w-1/2 w-full h-80 bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                <pilar.icon className="w-24 h-24 text-gray-400 opacity-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RegulacaoPage = () => (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Compliance & Regulação</span>
            <h1 className="text-5xl font-black text-[#002855] mb-6">Navegue pela Complexidade com Segurança Jurídica</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Monitoramos em tempo real as alterações legislativas em 25 jurisdições africanas, fornecendo análises de impacto imediato para sua operação.
            </p>
            <div className="space-y-4">
              {[
                "Monitorização de Diários da República",
                "Análise de Risco de Compliance (AML/KYC)",
                "Modelagem de Acordos de Partilha de Produção (PSA)",
                "Relatórios de Sustentabilidade e ESG"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-lg font-bold text-[#002855]">
                  <CheckCircle2 className="w-6 h-6 text-[#C8102E]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#002855] p-10 text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-[#C8102E]" />
              SIMULADOR DE IMPACTO REGULATÓRIO
            </h3>
            <div className="space-y-8">
              <div className="p-6 bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-widest">Alteração Legislativa: Lei das Receitas Petrolíferas</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Impacto em Royalties</span>
                  <span className="text-sm font-bold text-[#C8102E]">+2.5%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#C8102E] h-full w-[65%]" />
                </div>
              </div>
              <div className="p-6 bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-widest">Compliance de Conteúdo Local</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Requisito Mínimo</span>
                  <span className="text-sm font-bold text-blue-400">40%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full w-[40%]" />
                </div>
              </div>
              <Button variant="secondary" className="w-full py-6 text-lg">EXECUTAR ANÁLISE DE CENÁRIO</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DadosPage = () => (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Data Intelligence</span>
          <h1 className="text-5xl font-black text-[#002855] mb-6 uppercase tracking-tighter">A Maior Base de Dados Energética de África</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Dados brutos transformados em insights acionáveis através de processamento avançado e validação por especialistas do setor.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {[
            { label: "Data Points Diários", val: "2.5M+", icon: Database },
            { label: "Campos Monitorados", val: "150+", icon: MapPin },
            { label: "Anos de Histórico", val: "30+", icon: FileText },
            { label: "Precisão de Dados", val: "99.9%", icon: Shield }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 border border-gray-100 shadow-lg text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#C8102E] mx-auto mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-[#002855] mb-2">{item.val}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#f8f9fa] p-12 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-black text-[#002855] mb-6 uppercase">Infraestrutura de Dados</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Nossa arquitetura de dados é construída para escala e segurança. Utilizamos redundância geográfica e encriptação de ponta a ponta para garantir que a informação crítica esteja sempre disponível e protegida.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3 font-bold text-[#002855]"><Lock className="w-5 h-5 text-[#C8102E]"/> AES-256 Encryption</div>
                <div className="flex items-center gap-3 font-bold text-[#002855]"><Globe className="w-5 h-5 text-[#C8102E]"/> Global CDN</div>
                <div className="flex items-center gap-3 font-bold text-[#002855]"><Shield className="w-5 h-5 text-[#C8102E]"/> SOC2 Compliant</div>
                <div className="flex items-center gap-3 font-bold text-[#002855]"><TrendingUp className="w-5 h-5 text-[#C8102E]"/> Real-time Sync</div>
              </div>
            </div>
            <div className="lg:w-1/2 w-full bg-[#002855] h-64 flex items-center justify-center">
              <div className="text-white font-mono text-sm opacity-50">
                {`{ "status": "active", "nodes": 12, "latency": "14ms" }`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SobrePage = () => (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Sobre a AlphaData</span>
            <h1 className="text-5xl font-black text-[#002855] mb-6">Liderando a Revolução de Dados em África</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Fundada com a missão de trazer transparência e inteligência ao setor energético africano, a AlphaData tornou-se a parceira de confiança para as maiores organizações do continente.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Combinamos expertise técnica profunda com tecnologia de ponta para fornecer uma visão clara de um mercado frequentemente opaco. Nossa equipe é composta por engenheiros de petróleo, analistas de dados, juristas e especialistas em geopolítica.
            </p>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-[#002855]">2015</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fundação</div>
              </div>
              <div className="w-px h-12 bg-gray-200 mx-4" />
              <div className="text-center">
                <div className="text-3xl font-black text-[#002855]">Luanda</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sede Central</div>
              </div>
              <div className="w-px h-12 bg-gray-200 mx-4" />
              <div className="text-center">
                <div className="text-3xl font-black text-[#002855]">85+</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Especialistas</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-100 border-2 border-[#002855] p-4">
              <div className="w-full h-full bg-[#002855] flex items-center justify-center text-white">
                <Users className="w-32 h-32 opacity-20" />
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 bg-[#C8102E] p-8 text-white shadow-xl hidden md:block">
              <div className="text-4xl font-black mb-1">100%</div>
              <div className="text-xs font-bold uppercase tracking-widest">Foco em África</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ContactoPage = () => (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-black text-[#002855] mb-6 uppercase tracking-tighter">Entre em Contacto</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nossa equipe de especialistas está pronta para ajudar sua organização a navegar no mercado energético africano.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="bg-white p-10 border border-gray-100 shadow-xl">
            <Mail className="w-10 h-10 text-[#C8102E] mb-6" />
            <h3 className="text-xl font-bold text-[#002855] mb-4 uppercase">E-mail</h3>
            <p className="text-gray-500 mb-4">Para consultas gerais e suporte técnico:</p>
            <a href="mailto:info@alphadata.ai" className="text-[#C8102E] font-bold hover:underline">info@alphadata.ai</a>
          </div>
          <div className="bg-white p-10 border border-gray-100 shadow-xl">
            <Phone className="w-10 h-10 text-[#C8102E] mb-6" />
            <h3 className="text-xl font-bold text-[#002855] mb-4 uppercase">Telefone</h3>
            <p className="text-gray-500 mb-4">Fale diretamente com nosso escritório central:</p>
            <p className="text-[#C8102E] font-bold">+244 900 000 000</p>
          </div>
          <div className="bg-white p-10 border border-gray-100 shadow-xl">
            <MapPin className="w-10 h-10 text-[#C8102E] mb-6" />
            <h3 className="text-xl font-bold text-[#002855] mb-4 uppercase">Escritório</h3>
            <p className="text-gray-500 mb-4">Edifício Sky Center, Piso 12</p>
            <p className="text-[#C8102E] font-bold">Luanda, Angola</p>
          </div>
        </div>
      </div>
    </div>
  );

  const SimpleContentPage = ({ title, content }: any) => (
    <div className="pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black text-[#002855] mb-10 uppercase tracking-tighter border-b-4 border-[#C8102E] pb-4 inline-block">{title}</h1>
        <div className="prose prose-lg text-gray-600 leading-relaxed space-y-6">
          {content.map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>
        <Button variant="primary" className="mt-12" onClick={() => setCurrentPage("home")}>VOLTAR AO INÍCIO</Button>
      </div>
    </div>
  );

  // --- Router Logic ---
  const renderContent = () => {
    switch (currentPage) {
      case "home": return <HomePage />;
      case "solucoes": return <SolucoesPage />;
      case "regulacao": return <RegulacaoPage />;
      case "dados": return <DadosPage />;
      case "sobre": return <SobrePage />;
      case "contacto": return <ContactoPage />;
      case "carreiras": return <SimpleContentPage title="Carreiras" content={["Junte-se à equipe que está moldando o futuro da inteligência de dados em África.", "Estamos sempre à procura de talentos em engenharia de dados, análise de mercado e especialistas do setor energético.", "Envie seu CV para careers@alphadata.ai"]} />;
      case "termos": return <SimpleContentPage title="Termos e Condições" content={["Estes termos regem o uso da plataforma AlphaData Intelligence.", "O acesso aos dados é restrito a usuários autorizados sob contrato de licença corporativa.", "A redistribuição de dados sem autorização prévia é estritamente proibida."]} />;
      case "privacidade": return <SimpleContentPage title="Política de Privacidade" content={["A AlphaData está comprometida com a proteção de seus dados corporativos e pessoais.", "Utilizamos os mais altos padrões de encriptação e segurança para garantir a integridade da informação.", "Não compartilhamos dados de clientes com terceiros sem consentimento explícito."]} />;
      case "compliance": return <SimpleContentPage title="Conformidade Anti-Corrupção" content={["A AlphaData opera sob os mais rigorosos padrões éticos e de conformidade.", "Mantemos políticas estritas contra suborno e corrupção, em linha com as melhores práticas internacionais (FCPA, UK Bribery Act).", "Todos os nossos colaboradores e parceiros passam por processos regulares de due diligence."]} />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-[#002855]/10">
      {renderNavbar()}
      
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* CTA Final - Common to most pages */}
      {currentPage !== 'contacto' && (
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-black text-[#002855] mb-8 uppercase tracking-tighter">Pronto para elevar o nível da sua análise?</h2>
            <p className="text-lg text-gray-500 mb-12">
              Agende uma reunião com os nossos especialistas para uma demonstração personalizada das nossas capacidades de inteligência.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button variant="primary" className="h-16 px-10 text-lg w-full">FALAR COM UM ESPECIALISTA</Button>
              </Link>
              <Button variant="outline" className="h-16 px-10 text-lg w-full sm:w-auto">VER PLANOS CORPORATIVOS</Button>
            </div>
          </div>
        </section>
      )}

      {renderFooter()}
    </div>
  );
}