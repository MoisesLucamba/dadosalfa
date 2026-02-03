import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { 
  BarChart3, Globe, Shield, TrendingUp, Database,
  ArrowRight, CheckCircle2, ChevronRight, Building2,
  Users, FileText, Scale, Lock, PieChart, Briefcase,
  ExternalLink, Gavel
} from "lucide-react";

/**
 * Landing Page Institucional e Corporativa:
 * 1. Paleta de Cores: Azul Marinho (#002855), Vermelho Corporativo (#C8102E), Branco Puro e Preto.
 * 2. Estilo: Sóbrio, limpo, tipografia estruturada (serifada para títulos se possível, ou sans-serif robusta).
 * 3. Componentes: Simuladores de Regulação, Dashboards de Dados Técnicos e Seções de Autoridade.
 * 4. UX: Foco em legibilidade e profissionalismo.
 */

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
export default function InstitutionalLanding() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || 'pt';

  const getLocalizedText = (pt: string, en: string) => (lang === 'en' ? en : pt);
  const [activePlan, setActivePlan] = useState(0);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-[#002855]/10">
      
      {/* Header Institucional */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b-2 border-[#f0f0f0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/">
              <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto" />
            </Link>
            <div className="hidden lg:flex items-center gap-6 border-l border-gray-200 pl-8">
              {["Soluções", "Regulação", "Dados", "Sobre"].map((item) => (
                <a key={item} href="#" className="text-sm font-bold text-[#002855] hover:text-[#C8102E] transition-colors uppercase tracking-tight">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-[#002855] font-bold">Portal do Cliente</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-[#002855] hover:bg-[#001d3d] text-white px-6 rounded-none font-bold">
                SOLICITAR ACESSO
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Estilo Corporativo */}
      <section className="relative pt-40 pb-24 bg-[#002855] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#C8102E] opacity-10 skew-x-[-20deg] translate-x-20" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-12 h-1 bg-[#C8102E] mb-6" />
              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] mb-8 tracking-tight">
                Inteligência Estratégica para o Setor de <span className="text-[#C8102E]">Energia em África.</span>
              </h1>
              <p className="text-xl text-blue-100/80 mb-10 leading-relaxed font-light max-w-xl">
                Providenciamos dados críticos, análise regulatória e monitorização de mercado para governos, operadoras e investidores institucionais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-[#C8102E] hover:bg-[#a30d25] text-white h-14 px-8 rounded-none font-bold text-base shadow-lg">
                  DEMONSTRAÇÃO TÉCNICA
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#002855] h-14 px-8 rounded-none font-bold text-base transition-all">
                  RELATÓRIO ANUAL 2024
                </Button>
              </div>
            </motion.div>

            {/* Dashboard Mockup - Sóbrio */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-2xl p-2 border border-gray-200"
            >
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

      {/* Section: Regulação e Compliance - O Grande Diferencial */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white p-8 border-t-4 border-[#C8102E] shadow-xl">
                <h3 className="text-xl font-bold text-[#002855] mb-6 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-[#C8102E]" />
                  SIMULADOR DE IMPACTO REGULATÓRIO
                </h3>
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Alteração Legislativa: Lei das Receitas Petrolíferas</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Impacto em Royalties</span>
                      <span className="text-sm font-bold text-[#C8102E]">+2.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
                      <div className="bg-[#C8102E] h-full w-[65%]" />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Compliance de Conteúdo Local</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Requisito Mínimo</span>
                      <span className="text-sm font-bold text-[#002855]">40%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
                      <div className="bg-[#002855] h-full w-[40%]" />
                    </div>
                  </div>
                  <Button className="w-full bg-[#002855] rounded-none font-bold py-6">
                    EXECUTAR ANÁLISE DE CENÁRIO
                  </Button>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Segurança Jurídica</span>
              <h2 className="text-4xl font-black text-[#002855] mb-6 leading-tight">
                Navegue pela Complexidade <br /> Regulatória com Precisão.
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                O nosso motor de análise monitoriza em tempo real as alterações legislativas em 25 jurisdições africanas, simulando o impacto financeiro imediato para a sua operação.
              </p>
              <ul className="space-y-4">
                {[
                  "Monitorização de Diários da República",
                  "Análise de Risco de Compliance (AML/KYC)",
                  "Modelagem de Acordos de Partilha de Produção (PSA)",
                  "Relatórios de Sustentabilidade e ESG"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#002855]">
                    <CheckCircle2 className="w-5 h-5 text-[#C8102E]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid - Limpo e Sério */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#002855] mb-4 uppercase tracking-tighter">Pilares de Inteligência</h2>
            <div className="w-20 h-1 bg-[#C8102E] mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Inteligência de Mercado", 
                desc: "Dados consolidados de produção, exportação e preços spot de todos os crudes africanos.",
                icon: BarChart3
              },
              { 
                title: "Análise Geopolítica", 
                desc: "Relatórios de risco país e monitorização de estabilidade política em regiões estratégicas.",
                icon: Globe
              },
              { 
                title: "Logística e Supply Chain", 
                desc: "Rastreamento de navios, inventários em terminais e otimização de rotas de exportação.",
                icon: Database
              },
              { 
                title: "Fiscalidade e Taxas", 
                desc: "Calculadoras avançadas para impostos petrolíferos e taxas de superfície.",
                icon: PieChart
              },
              { 
                title: "Base de Dados Histórica", 
                desc: "Acesso a mais de 30 anos de dados históricos do setor energético africano.",
                icon: FileText
              },
              { 
                title: "Segurança de Dados", 
                desc: "Infraestrutura de nível governamental com encriptação AES-256 e redundância global.",
                icon: Lock
              }
            ].map((sol, i) => (
              <div key={i} className="p-8 border border-gray-100 hover:border-[#002855]/20 hover:shadow-xl transition-all group">
                <sol.icon className="w-10 h-10 text-[#C8102E] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-[#002855] mb-4 uppercase">{sol.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{sol.desc}</p>
                <a href="#" className="text-[10px] font-black text-[#002855] uppercase tracking-widest flex items-center gap-2 hover:text-[#C8102E]">
                  Saber mais <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - Parceiros/Testemunhos */}
      <section className="py-24 bg-[#002855] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#C8102E] font-black text-xs uppercase tracking-[0.2em] mb-4 block">Confiança Institucional</span>
            <h2 className="text-3xl font-bold">Apoiando as maiores organizações do sector.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                quote: "A AlphaData é a nossa fonte primária para análise de benchmarks regionais. A precisão dos dados é inigualável no continente.",
                author: "Dr. Alberto Silva",
                role: "Consultor de Estratégia, Ministério dos Recursos Minerais"
              },
              {
                quote: "A capacidade de simular cenários regulatórios reduziu o nosso tempo de análise de risco em mais de 70%.",
                author: "Eng.ª Carla Santos",
                role: "Diretora de Operações, Consórcio de Exploração"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white/5 p-10 border-l-4 border-[#C8102E]">
                <p className="text-lg italic mb-6 text-blue-50">"{t.quote}"</p>
                <div className="font-bold text-white"></div>
                <div className="text-xs text-blue-300 uppercase tracking-widest mt-1">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

  <div className="bg-gray-50 py-12 px-6 max-w-4xl mx-auto">
      {/* Botões de seleção */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {pricingPlans.map((plan, i) => (
          <Button
            key={i}
            className={`px-5 py-2 rounded-none font-bold ${
              i === activePlan
                ? "bg-[#C8102E] text-white"
                : "bg-white text-[#002855] border border-[#002855]"
            }`}
            onClick={() => setActivePlan(i)}
          >
            {plan.name}
          </Button>
        ))}
      </div>

      {/* Detalhes do plano com animação */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePlan}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-6 border border-gray-200 rounded shadow-lg text-left"
          >
            <h3 className="text-2xl font-bold text-[#002855] mb-1">{pricingPlans[activePlan].name}</h3>
            <p className="text-xl text-[#C8102E] font-extrabold mb-1">{pricingPlans[activePlan].price}</p>
            <p className="text-sm text-gray-500 mb-4">{pricingPlans[activePlan].users}</p>
            <ul className="mb-4 space-y-1 list-disc list-inside text-gray-600">
              {pricingPlans[activePlan].features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <Button className="bg-[#002855] hover:bg-[#001d3d] text-white rounded-none font-bold w-full py-2">
              {pricingPlans[activePlan].buttonText}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>


      {/* CTA Final - Sério e Direto */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-[#002855] mb-8 uppercase tracking-tighter">Pronto para elevar o nível da sua análise?</h2>
          <p className="text-lg text-gray-500 mb-12">
            Agende uma reunião com os nossos especialistas para uma demonstração personalizada das nossas capacidades de inteligência.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="bg-[#002855] hover:bg-[#001d3d] text-white h-16 px-10 rounded-none font-bold text-lg w-full sm:w-auto">
              FALAR COM UM ESPECIALISTA
            </Button>
            <Button variant="outline" className="border-[#002855] text-[#002855] h-16 px-10 rounded-none font-bold text-lg w-full sm:w-auto">
              VER PLANOS CORPORATIVOS
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Institucional */}
      <footer className="bg-[#1a1a1a] text-white py-20 border-t-8 border-[#002855]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto mb-6 brightness-200" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Líder em Market Intelligence para o setor energético africano. Sediada em Luanda, com presença global.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Soluções</h4>
              <ul className="space-y-3 text-xs text-gray-400 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Inteligência de Mercado</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Análise Regulatória</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Logística de Crudes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Consultoria Técnica</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Empresa</h4>
              <ul className="space-y-3 text-xs text-gray-400 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Sobre a AlphaData</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Equipa Executiva</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#C8102E] mb-6">Legal</h4>
              <ul className="space-y-3 text-xs text-gray-400 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Termos e Condições</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conformidade Anti-Corrupção</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div>© 2024 ALPHADATA INTELLIGENCE. TODOS OS DIREITOS RESERVADOS.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Bloomberg Terminal</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}