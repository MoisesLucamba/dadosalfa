import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import alphadataLogo from "@/assets/alphadata-logo.png";
import heroDashboard from "@/assets/hero-dashboard.png";
import {
  BarChart3, Globe, Shield, TrendingUp, Database,
  ArrowRight, CheckCircle2, Building2,
  Users, FileText, Scale, Lock, PieChart,
  ExternalLink, Gavel, Mail, Phone, MapPin,
  Linkedin, Twitter, Activity, ChevronRight,
  Terminal, Zap, AlertCircle
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────── */
const T = {
  black:    "#0a0a0a",
  white:    "#ffffff",
  offwhite: "#f7f7f5",
  gray50:   "#fafafa",
  gray100:  "#f0f0ee",
  gray200:  "#e0e0de",
  gray400:  "#9a9a98",
  gray600:  "#5a5a58",
  red:      "#C8102E",
  redDeep:  "#9b0d22",
  navy:     "#002855",
  navyMid:  "#1e3a5f",
  mono:     "'IBM Plex Mono', monospace",
  display:  "'Plus Jakarta Sans', sans-serif",
  sans:     "'Outfit', sans-serif",
};

/* ─── Data ───────────────────────────────────────────── */

// Stats técnicos reais — sem métricas comerciais falsas
const corporateStats = [
  { value: "25+",   label: "Jurisdições Africanas Cobertas", icon: Globe },
  { value: "6",     label: "Módulos de Análise Integrados",  icon: BarChart3 },
  { value: "AI",    label: "Motor de IA Proprietário",       icon: Zap },
  { value: "2026",  label: "Fundada em Luanda",              icon: Activity },
];

const pricingPlans = [
  {
    name: "Starter", tier: "01",
    price: "USD $14,000", period: "/ano",
    users: "Até 6 utilizadores",
    features: [
      "Dashboard em tempo real",
      "Dados de produção por bloco",
      "Preços Brent e crudes angolanos",
      "Exportações e logística",
      "Previsões IA 30/60/90 dias",
      "Relatórios mensais",
      "Suporte por email",
    ],
    cta: "Contactar Vendas",
  },
  {
    name: "Professional", tier: "02",
    price: "USD $39,999", period: "/ano",
    users: "Até 16 utilizadores",
    features: [
      "Tudo do plano Starter",
      "Workspaces ilimitados",
      "API de integração básica",
      "Relatórios personalizados",
      "Dados históricos completos",
      "Análise de competidores",
      "Suporte prioritário",
    ],
    cta: "Solicitar Demo",
    featured: true,
  },
  {
    name: "Enterprise", tier: "03",
    price: "USD $250,000", period: "/ano",
    users: "Utilizadores ilimitados",
    features: [
      "Tudo do Professional",
      "API de integração completa",
      "White-label customizado",
      "Domínio personalizado",
      "Suporte 24/7 dedicado",
      "Gerente de conta exclusivo",
    ],
    cta: "Solicitar Proposta",
  },
];

const intelligencePilars = [
  {
    id: "mercado",
    title: "Inteligência de Mercado",
    desc: "Dados consolidados de produção, exportação e preços spot de crudes africanos, actualizados diariamente.",
    content: "A nossa plataforma oferece uma visão granular do mercado energético africano. Cobrimos blocos petrolíferos angolanos, cronogramas de carregamento e análises de diferencial de preço com base em fontes oficiais e feeds de mercado.",
    icon: BarChart3,
  },
  {
    id: "geopolitica",
    title: "Análise Geopolítica",
    desc: "Relatórios de risco país e monitorização de estabilidade política em regiões estratégicas de África.",
    content: "Analisamos o cenário político e regulatório em jurisdições africanas prioritárias. Os nossos relatórios incluem avaliações de risco operacional, estabilidade contratual e impacto de alterações legislativas nas políticas energéticas.",
    icon: Globe,
  },
  {
    id: "logistica",
    title: "Logística e Supply Chain",
    desc: "Rastreamento de navios, inventários em terminais e análise de rotas de exportação.",
    content: "Integramos dados públicos AIS e informação portuária para mapear o fluxo de exportação de crude angolano, identificando padrões logísticos e oportunidades de optimização.",
    icon: Database,
  },
  {
    id: "fiscalidade",
    title: "Fiscalidade e Taxas",
    desc: "Calculadoras para impostos petrolíferos angolanos e análise comparativa de regimes fiscais.",
    content: "Disponibilizamos calculadoras para contratos PSA e Concessão, permitindo simular o impacto de variações no IRP, taxa de produção e royalties com base na legislação angolana vigente.",
    icon: PieChart,
  },
  {
    id: "historico",
    title: "Base de Dados Histórica",
    desc: "Séries temporais de produção, preços e exportação do sector energético angolano e africano.",
    content: "A nossa biblioteca de dados cobre décadas de estatísticas de produção e exportação angolanas, com fontes auditáveis provenientes de relatórios ministeriais e organismos oficiais.",
    icon: FileText,
  },
  {
    id: "seguranca",
    title: "Segurança de Dados",
    desc: "Infraestrutura cloud com encriptação AES-256, autenticação multifactor e backups redundantes.",
    content: "A plataforma está construída sobre infraestrutura cloud segura, com encriptação de ponta a ponta, controlos de acesso por perfil e políticas de privacidade conformes com as melhores práticas internacionais.",
    icon: Lock,
  },
];

/* ─── Animated number ────────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Reusable primitives ────────────────────────────── */
const PrimaryBtn = ({ children, className = "", onClick, ...p }: any) => (
  <button onClick={onClick} {...p}
    className={`relative overflow-hidden group flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] ${className}`}
    style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "14px 28px", background: T.red, color: T.white, border: "none", cursor: "pointer", boxShadow: `0 4px 20px rgba(200,16,46,0.25)` }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.redDeep}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.red}
  >
    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 100%)" }} />
    <span className="relative flex items-center gap-2">{children}</span>
  </button>
);

const OutlineBtn = ({ children, className = "", onClick, dark = false }: any) => (
  <button onClick={onClick}
    className={`flex items-center justify-center gap-2 transition-all duration-200 ${className}`}
    style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "13px 28px", background: "transparent", color: dark ? T.white : T.black, border: `1.5px solid ${dark ? "rgba(255,255,255,0.3)" : T.gray200}`, cursor: "pointer" }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = dark ? T.white : T.black; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = dark ? "rgba(255,255,255,0.3)" : T.gray200; }}
  >
    {children}
  </button>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-5">
    <div style={{ width: 24, height: 2, background: T.red, flexShrink: 0 }} />
    <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.red, letterSpacing: "0.25em", textTransform: "uppercase" }}>
      {children}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
export default function InstitutionalLanding() {
  const [currentPage, setCurrentPage] = useState("home");
  const [activePlan, setActivePlan] = useState(1);
  const [selectedPilar, setSelectedPilar] = useState<any>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Navbar ──────────────────────────────────────── */
  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: navScrolled ? "rgba(255,255,255,0.97)" : T.white,
        borderBottom: navScrolled ? `1px solid ${T.gray200}` : `1px solid ${T.gray100}`,
        backdropFilter: navScrolled ? "blur(10px)" : "none",
        boxShadow: navScrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
      }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => setCurrentPage("home")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center" style={{ background: "#ffffff", border: `1px solid ${T.gray200}`, flexShrink: 0 }}>
              <img src={alphadataLogo} alt="Elastra" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 800, color: T.black, letterSpacing: "0.04em" }}>ELASTRA</span>
              <span style={{ fontFamily: T.mono, fontSize: 7.5, fontWeight: 600, color: T.red, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>South Atlantic</span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-1" style={{ borderLeft: `1px solid ${T.gray200}`, paddingLeft: 28 }}>
            {[{id:"solucoes",l:"Soluções"},{id:"regulacao",l:"Regulação"},{id:"dados",l:"Dados"},{id:"sobre",l:"Sobre"}].map(item => (
              <button key={item.id} onClick={() => setCurrentPage(item.id)}
                className="transition-colors duration-150"
                style={{
                  fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                  textTransform: "uppercase", padding: "8px 14px",
                  color: currentPage === item.id ? T.red : T.gray600,
                  background: "none", border: "none", cursor: "pointer",
                }}
                onMouseEnter={e => { if (currentPage !== item.id) (e.currentTarget as HTMLElement).style.color = T.black; }}
                onMouseLeave={e => { if (currentPage !== item.id) (e.currentTarget as HTMLElement).style.color = T.gray600; }}
              >
                {item.l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <button style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "8px 14px", color: T.gray600, background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.black}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.gray600}
            >
              Portal do Cliente
            </button>
          </Link>
          <Link to="/auth">
            <PrimaryBtn>Solicitar Acesso <ChevronRight style={{width:12,height:12}} /></PrimaryBtn>
          </Link>
        </div>
      </div>
    </nav>
  );

  /* ── Footer ──────────────────────────────────────── */
  const Footer = () => (
    <footer style={{ background: T.black, color: T.white, borderTop: `4px solid ${T.red}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center" style={{ background: "#ffffff" }}>
                <img src={alphadataLogo} alt="Elastra" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-none">
                <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 800, color: T.white, letterSpacing: "0.04em" }}>ELASTRA</span>
                <span style={{ fontFamily: T.mono, fontSize: 7.5, fontWeight: 600, color: T.red, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>South Atlantic</span>
              </div>
            </div>
            <p style={{ fontFamily: T.sans, fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 280 }}>
              Elastra South Atlantic — Plataforma angolana de Market Intelligence para o sector energético. Fundada em Luanda em 2026.
            </p>
            <div className="flex items-center gap-4 mt-8">
              {[{icon: Linkedin, l:"LinkedIn"},{icon: Twitter, l:"Twitter"},{icon: ExternalLink, l:"Bloomberg"}].map(s => (
                <a key={s.l} href="#" className="flex items-center gap-1.5 transition-colors"
                  style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.white}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"}
                >
                  <s.icon style={{ width: 10, height: 10 }} />{s.l}
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Soluções", links: [{l:"Inteligência de Mercado",p:"solucoes"},{l:"Análise Regulatória",p:"regulacao"},{l:"Logística de Crudes",p:"dados"},{l:"Consultoria Técnica",p:"solucoes"}] },
            { title: "Empresa",  links: [{l:"Sobre a Elastra",p:"sobre"},{l:"Carreiras",p:"carreiras"},{l:"Contacto",p:"contacto"}] },
            { title: "Legal",    links: [{l:"Termos e Condições",p:"termos"},{l:"Política de Privacidade",p:"privacidade"},{l:"Conformidade Anti-Corrupção",p:"compliance"}] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: T.red, textTransform: "uppercase", marginBottom: 20 }}>
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.l}>
                    <button onClick={() => setCurrentPage(link.p)}
                      style={{ fontFamily: T.sans, fontSize: 12.5, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.white}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}
                    >
                      {link.l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            © 2026 Elastra Intelligence · Todos os direitos reservados
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
            LUANDA · ANGOLA
          </span>
        </div>
      </div>
    </footer>
  );

  /* ── HOME ────────────────────────────────────────── */
  const HomePage = () => (
    <>
      {/* Hero */}
      <section className="relative pt-32 overflow-hidden" style={{ background: T.white }}>
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, transparent 1px, transparent 60px, rgba(0,0,0,0.025) 61px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, transparent 1px, transparent 60px, rgba(0,0,0,0.025) 61px)
          `,
          backgroundSize: "61px 61px",
        }} />

        {/* Red accent slab — right side */}
        <div className="absolute top-0 right-0 w-[28%] h-full pointer-events-none" style={{
          background: "linear-gradient(180deg, rgba(200,16,46,0.04) 0%, transparent 60%)",
          borderLeft: `1px solid rgba(200,16,46,0.1)`,
        }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          {/* Running ticker */}
          <div className="mb-12 flex items-center gap-4 overflow-hidden" style={{ borderBottom: `1px solid ${T.gray100}`, paddingBottom: 16 }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", flexShrink: 0, background: T.red, color: T.white, padding: "3px 8px" }}>
              LIVE
            </span>
            <div className="overflow-hidden flex-1">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex gap-12 whitespace-nowrap"
                style={{ fontFamily: T.mono, fontSize: 9, color: T.gray400, letterSpacing: "0.1em" }}
              >
                {["BRENT CRUDE: $82.14 +0.43%", "ANGOLA LNG: $9.82/MMBtu -0.12%", "GIRASSOL: $81.90 +0.31%", "CABINDA CRUDE: $80.45 -0.08%", "NEMBA: $83.20 +0.55%", "NATURAL GAS: $2.84 +1.2%",
                  "BRENT CRUDE: $82.14 +0.43%", "ANGOLA LNG: $9.82/MMBtu -0.12%", "GIRASSOL: $81.90 +0.31%", "CABINDA CRUDE: $80.45 -0.08%", "NEMBA: $83.20 +0.55%", "NATURAL GAS: $2.84 +1.2%"
                ].map((t, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full" style={{ background: T.red, flexShrink: 0 }} />{t}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_480px] gap-16 pb-0 items-start">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <SectionLabel>Terminal de Inteligência Energética</SectionLabel>

              <h1 style={{ fontFamily: T.display, fontSize: "clamp(40px,5.5vw,72px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", color: T.black, marginBottom: 24 }}>
                Inteligência<br />
                Estratégica<br />
                para o <span style={{ color: T.red }}>Setor</span><br />
                <span style={{ color: T.red }}>Energético</span><br />
                de África.
              </h1>

              <p style={{ fontFamily: T.sans, fontSize: 16, color: T.gray600, lineHeight: 1.75, maxWidth: 480, marginBottom: 36 }}>
                Dados críticos, análise regulatória e monitorização de mercado para governos, operadoras e investidores que actuam no sector petrolífero angolano e africano.
              </p>

              <div className="flex flex-wrap gap-3">
                <PrimaryBtn>Agendar Demonstração <ArrowRight style={{ width: 13, height: 13 }} /></PrimaryBtn>
                <OutlineBtn onClick={() => setCurrentPage("sobre")}>Conhecer a Elastra</OutlineBtn>
              </div>

              {/* Technology strip — apenas credenciais técnicas */}
              <div className="mt-12 flex items-center gap-6 flex-wrap" style={{ paddingTop: 20, borderTop: `1px solid ${T.gray100}` }}>
                {["AES-256 Encryption", "REST API", "Real-time Data", "Cloud Infrastructure"].map(badge => (
                  <div key={badge} className="flex items-center gap-1.5">
                    <CheckCircle2 style={{ width: 11, height: 11, color: T.red, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.mono, fontSize: 8, color: T.gray400, letterSpacing: "0.12em", textTransform: "uppercase" }}>{badge}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dashboard visual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
              style={{ marginTop: 0 }}
            >
              {/* Frame decoration */}
              <div className="absolute -top-3 -left-3 w-8 h-8 pointer-events-none" style={{ borderTop: `2px solid ${T.red}`, borderLeft: `2px solid ${T.red}` }} />
              <div className="absolute -bottom-3 -right-3 w-8 h-8 pointer-events-none" style={{ borderBottom: `2px solid ${T.navy}`, borderRight: `2px solid ${T.navy}` }} />

              <div style={{ border: `1px solid ${T.gray200}`, boxShadow: "0 24px 80px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: T.gray50, borderBottom: `1px solid ${T.gray200}` }}>
                  {["#ff5f57","#febc2e","#28c840"].map(c => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
                  <div className="flex-1 mx-3 px-3 py-1 rounded" style={{ background: T.gray100 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray400 }}>app.alphadata.ao/dashboard</span>
                  </div>
                </div>
                <img src={heroDashboard} alt="Elastra Dashboard" className="w-full h-auto block" />
              </div>

              {/* Floating badge */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 px-3 py-2 shadow-lg" style={{ background: T.black, border: `1px solid ${T.red}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                  <span style={{ fontFamily: T.mono, fontSize: 8, color: T.white, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>SISTEMA OPERACIONAL</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar — apenas factos técnicos/institucionais, sem métricas comerciais */}
        <div className="mt-20" style={{ background: T.black, borderTop: `3px solid ${T.red}` }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {corporateStats.map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.25)" }}>
                    <s.icon style={{ width: 16, height: 16, color: T.red }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.white, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Pillars */}
      <section style={{ background: T.white, paddingTop: 96, paddingBottom: 96 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[320px,1fr] gap-16 mb-16">
            <div>
              <SectionLabel>Pilares de Inteligência</SectionLabel>
              <h2 style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, color: T.black, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
                Cada dimensão do mercado, coberta.
              </h2>
            </div>
            <div className="flex items-end">
              <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.75, maxWidth: 500 }}>
                Combinámos fontes de dados oficiais, análise especializada e tecnologia de IA para entregar inteligência accionável em cada dimensão do mercado petrolífero angolano e africano.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: T.gray200, border: `1px solid ${T.gray200}` }}>
            {intelligencePilars.map((sol, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="group flex flex-col p-8 cursor-pointer transition-all duration-200"
                style={{ background: T.white }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.gray50}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.white}
                onClick={() => setSelectedPilar(sol)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: T.gray50, border: `1px solid ${T.gray200}` }}>
                    <sol.icon style={{ width: 16, height: 16, color: T.red }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray200, letterSpacing: "0.1em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700, color: T.black, marginBottom: 10, letterSpacing: "-0.01em" }}>
                  {sol.title}
                </h3>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.gray600, lineHeight: 1.7, flexGrow: 1, marginBottom: 20 }}>
                  {sol.desc}
                </p>
                <div className="flex items-center gap-2 transition-all duration-200 group-hover:gap-3"
                  style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.red, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Saber mais <ArrowRight style={{ width: 11, height: 11 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilar Modal */}
      <AnimatePresence>
        {selectedPilar && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPilar(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.75)", backdropFilter: "blur(8px)" }}
            />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative max-w-xl w-full p-10"
              style={{ background: T.white, border: `1px solid ${T.gray200}`, borderTop: `4px solid ${T.red}`, boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}
            >
              <button onClick={() => setSelectedPilar(null)}
                style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: T.gray400, fontFamily: T.mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.black}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.gray400}
              >
                ESC ✕
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center" style={{ background: T.gray50, border: `1px solid ${T.gray200}` }}>
                  <selectedPilar.icon style={{ width: 16, height: 16, color: T.red }} />
                </div>
                <h3 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 700, color: T.black, letterSpacing: "-0.015em" }}>
                  {selectedPilar.title}
                </h3>
              </div>
              <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.8, marginBottom: 28 }}>
                {selectedPilar.content}
              </p>
              <PrimaryBtn className="w-full justify-center" onClick={() => setSelectedPilar(null)}>
                Fechar
              </PrimaryBtn>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing */}
      <section style={{ background: T.offwhite, paddingTop: 96, paddingBottom: 96, borderTop: `1px solid ${T.gray200}` }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <SectionLabel>Planos de Acesso</SectionLabel>
            <h2 style={{ fontFamily: T.display, fontSize: 42, fontWeight: 800, color: T.black, letterSpacing: "-0.025em" }}>
              Escolha o nível de acesso adequado à sua organização.
            </h2>
            {/* Honest launch note */}
            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.gray400, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 16 }}>
              Preços de lançamento · Acesso antecipado disponível
            </p>
          </div>

          {/* Plan tabs */}
          <div className="flex justify-center gap-0 mb-12" style={{ border: `1px solid ${T.gray200}`, display: "inline-flex", margin: "0 auto 48px", width: "fit-content", position: "relative", left: "50%", transform: "translateX(-50%)" }}>
            {pricingPlans.map((p, i) => (
              <button key={i} onClick={() => setActivePlan(i)}
                style={{
                  fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", padding: "12px 28px", cursor: "pointer",
                  background: activePlan === i ? T.red : T.white,
                  color: activePlan === i ? T.white : T.gray600,
                  border: "none",
                  borderRight: i < pricingPlans.length - 1 ? `1px solid ${T.gray200}` : "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ color: activePlan === i ? "rgba(255,255,255,0.5)" : T.gray400, marginRight: 6 }}>{p.tier}</span>
                {p.name}
              </button>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activePlan}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
                style={{ background: T.white, border: `1px solid ${T.gray200}`, borderTop: `3px solid ${T.red}`, padding: 40, position: "relative", overflow: "hidden" }}
              >
                {/* Subtle number watermark */}
                <div style={{ position: "absolute", top: -10, right: 24, fontFamily: T.mono, fontSize: 96, fontWeight: 900, color: T.gray100, lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
                  {pricingPlans[activePlan].tier}
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <h3 style={{ fontFamily: T.display, fontSize: 30, fontWeight: 800, color: T.black, letterSpacing: "-0.02em" }}>
                      {pricingPlans[activePlan].name}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: T.red }}>
                      {pricingPlans[activePlan].price}
                    </span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.gray400 }}>
                      {pricingPlans[activePlan].period}
                    </span>
                  </div>
                  <p style={{ fontFamily: T.mono, fontSize: 9, color: T.gray400, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 28 }}>
                    {pricingPlans[activePlan].users}
                  </p>

                  <div className="grid md:grid-cols-2 gap-3 mb-10">
                    {pricingPlans[activePlan].features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 style={{ width: 13, height: 13, color: T.red, flexShrink: 0 }} />
                        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.gray600 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <PrimaryBtn className="w-full justify-center">
                    {pricingPlans[activePlan].cta} <ChevronRight style={{ width: 13, height: 13 }} />
                  </PrimaryBtn>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );

  /* ── SOLUÇÕES ────────────────────────────────────── */
  const SolucoesPage = () => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-16 max-w-3xl">
          <SectionLabel>Nossas Soluções</SectionLabel>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(32px,4vw,56px)", fontWeight: 800, color: T.black, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
            Ecossistema de Inteligência Energética
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 16, color: T.gray600, lineHeight: 1.75 }}>
            Um conjunto integrado de ferramentas desenhado para mitigar riscos e identificar oportunidades no sector de óleo e gás em Angola e África.
          </p>
        </div>

        <div className="space-y-1">
          {intelligencePilars.map((pilar, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="group grid lg:grid-cols-[80px,2fr,3fr,auto] gap-8 items-center p-8 transition-all duration-200 cursor-pointer"
              style={{ background: T.white, border: `1px solid ${T.gray100}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.gray50}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.white}
            >
              <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 900, color: T.gray100, letterSpacing: "-0.02em" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="w-9 h-9 flex items-center justify-center mb-3" style={{ background: "rgba(200,16,46,0.06)", border: `1px solid rgba(200,16,46,0.15)` }}>
                  <pilar.icon style={{ width: 15, height: 15, color: T.red }} />
                </div>
                <h2 style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: T.black, letterSpacing: "-0.01em" }}>{pilar.title}</h2>
              </div>
              <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.gray600, lineHeight: 1.7 }}>{pilar.content}</p>
              <div className="flex items-center gap-1 group-hover:gap-2 transition-all"
                style={{ fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Ver mais <ArrowRight style={{ width: 11, height: 11 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── REGULAÇÃO ───────────────────────────────────── */
  const RegulacaoPage = () => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <SectionLabel>Compliance & Regulação</SectionLabel>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(30px,3.8vw,50px)", fontWeight: 800, color: T.black, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
              Navegue na complexidade regulatória com clareza.
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.75, marginBottom: 28 }}>
              A nossa plataforma agrega alterações legislativas do sector petrolífero angolano e de jurisdições africanas estratégicas, com análise de impacto operacional imediato.
            </p>
            <ul className="space-y-3">
              {[
                "Monitorização do Diário da República de Angola",
                "Análise de Risco Regulatório e Fiscal",
                "Modelagem de Acordos PSA e Concessão",
                "Acompanhamento de Directivas OPEP+",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 style={{ width: 14, height: 14, color: T.red, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.sans, fontSize: 14, color: T.black, fontWeight: 600 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Simulator card */}
          <div style={{ background: T.black, padding: 36, border: `1px solid rgba(255,255,255,0.08)`, borderTop: `3px solid ${T.red}` }}>
            <div className="flex items-center gap-2 mb-8">
              <Gavel style={{ width: 14, height: 14, color: T.red }} />
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.white, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Simulador de Impacto Regulatório
              </span>
            </div>
            {[
              { label: "Lei das Receitas Petrolíferas", sub: "Impacto Estimado em Royalties", val: "+2.5%", pct: 65, color: T.red },
              { label: "Compliance de Conteúdo Local", sub: "Requisito Mínimo ANPG", val: "40%", pct: 40, color: "#60a5fa" },
            ].map((item, i) => (
              <div key={i} className="p-5 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em", textTransform: "uppercase" }}>{item.label}</span>
                <div className="flex justify-between mt-2 mb-3">
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{item.sub}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", height: 3, borderRadius: 99, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ background: item.color, height: "100%", borderRadius: 99 }} />
                </div>
              </div>
            ))}
            <PrimaryBtn className="w-full justify-center mt-4">Executar Análise de Cenário</PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── DADOS ───────────────────────────────────────── */
  const DadosPage = () => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <SectionLabel>Data Intelligence</SectionLabel>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(32px,4vw,56px)", fontWeight: 800, color: T.black, letterSpacing: "-0.025em", marginBottom: 16 }}>
            Dados estruturados para o sector energético africano.
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, maxWidth: 540, margin: "0 auto" }}>
            Construída desde a fundação com rigor técnico e fontes verificáveis.
          </p>
        </div>

        {/* Métricas técnicas verificáveis — sem números de clientes/receita */}
        <div className="grid md:grid-cols-4 gap-px mb-20" style={{ background: T.gray200, border: `1px solid ${T.gray200}` }}>
          {[
            { l: "Jurisdições Cobertas",    v: 25,  s: "+",  icon: Globe    },
            { l: "Fontes de Dados Activas",  v: 40,  s: "+",  icon: Database },
            { l: "Módulos da Plataforma",    v: 6,   s: "",   icon: FileText },
            { l: "Uptime da Infraestrutura", v: 99,  s: ".9%",icon: Shield   },
          ].map((item, i) => (
            <div key={i} style={{ background: T.white, padding: "36px 28px", textAlign: "center" }}>
              <div className="w-10 h-10 flex items-center justify-center mx-auto mb-5" style={{ background: T.gray50, border: `1px solid ${T.gray200}` }}>
                <item.icon style={{ width: 16, height: 16, color: T.red }} />
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: T.black, lineHeight: 1 }}>
                <CountUp to={item.v} suffix={item.s} />
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: T.gray400, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8 }}>{item.l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.offwhite, padding: 48, border: `1px solid ${T.gray200}` }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel>Infraestrutura de Dados</SectionLabel>
              <h2 style={{ fontFamily: T.display, fontSize: 32, fontWeight: 800, color: T.black, letterSpacing: "-0.02em", marginBottom: 16 }}>
                Construída para escala e segurança.
              </h2>
              <p style={{ fontFamily: T.sans, fontSize: 14, color: T.gray600, lineHeight: 1.75, marginBottom: 24 }}>
                Redundância geográfica e encriptação de ponta a ponta garantem que a informação crítica esteja sempre disponível e protegida.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[{icon:Lock,l:"AES-256"},{icon:Globe,l:"Cloud CDN"},{icon:Shield,l:"Backups Diários"},{icon:TrendingUp,l:"Real-time Sync"}].map((b,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <b.icon style={{ width: 13, height: 13, color: T.red }} />
                    <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.black, letterSpacing: "0.1em" }}>{b.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.black, padding: 24, fontFamily: T.mono, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
              <span style={{ color: T.red }}>{'>'}</span> STATUS: <span style={{ color: "#22c55e" }}>OPERATIONAL</span><br />
              <span style={{ color: T.red }}>{'>'}</span> NODES: <span style={{ color: "#60a5fa" }}>ACTIVE</span><br />
              <span style={{ color: T.red }}>{'>'}</span> LATENCY: <span style={{ color: "#f59e0b" }}>14ms</span><br />
              <span style={{ color: T.red }}>{'>'}</span> ENCRYPTION: <span style={{ color: "rgba(255,255,255,0.7)" }}>AES-256</span><br />
              <span style={{ color: T.red }}>{'>'}</span> SYNC: <span style={{ color: "#22c55e" }}>REALTIME</span><span className="blink">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── SOBRE ───────────────────────────────────────── */
  const SobrePage = () => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
          <div>
            <SectionLabel>Sobre a Elastra</SectionLabel>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(30px,3.8vw,50px)", fontWeight: 800, color: T.black, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
              Uma empresa angolana a construir o futuro da inteligência energética.
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.75, marginBottom: 16 }}>
              Fundada em Luanda em 2026, a Elastra nasceu da convicção de que o sector energético africano precisa de ferramentas de análise à altura da sua complexidade e importância estratégica.
            </p>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.gray400, lineHeight: 1.75, marginBottom: 32 }}>
              A nossa equipa combina experiência em engenharia de petróleo, ciência de dados e regulação para construir uma plataforma de referência para o mercado angolano e africano.
            </p>
            {/* Apenas factos verificáveis */}
            <div className="flex items-center gap-10">
              {[
                { v: "2026", l: "Fundação"    },
                { v: "Luanda", l: "Sede"      },
                { v: "Angola", l: "Mercado"   },
              ].map((item, i) => (
                <div key={i} style={{ borderLeft: i > 0 ? `1px solid ${T.gray200}` : "none", paddingLeft: i > 0 ? 28 : 0 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.black }}>{item.v}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: T.gray400, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div style={{ aspectRatio: "1", background: T.offwhite, border: `1px solid ${T.gray200}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: 80, height: 80, color: T.gray200 }} />
            </div>
            <div className="absolute -bottom-6 -left-6 px-8 py-6" style={{ background: T.red, boxShadow: "0 20px 50px rgba(200,16,46,0.3)" }}>
              <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: T.white }}>100%</div>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: "rgba(255,255,255,0.6)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>Foco em África</div>
            </div>
          </div>
        </div>

        {/* Missão + Visão */}
        <div className="grid md:grid-cols-2 gap-px" style={{ background: T.gray200, border: `1px solid ${T.gray200}` }}>
          {[
            {
              label: "Missão",
              text: "Democratizar o acesso a dados e análises de qualidade institucional para todos os participantes do mercado energético angolano e africano.",
            },
            {
              label: "Visão",
              text: "Tornar-nos a plataforma de referência de Market Intelligence para o sector petrolífero de África, reconhecida pela rigor, independência e utilidade das nossas análises.",
            },
          ].map((item, i) => (
            <div key={i} style={{ background: T.white, padding: "48px 40px" }}>
              <SectionLabel>{item.label}</SectionLabel>
              <p style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.8 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── CONTACTO ────────────────────────────────────── */
  const ContactoPage = () => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <SectionLabel>Entre em Contacto</SectionLabel>
          <h1 style={{ fontFamily: T.display, fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: T.black, letterSpacing: "-0.025em" }}>
            A nossa equipa está pronta para si.
          </h1>
        </div>
        <div className="grid md:grid-cols-3 gap-px" style={{ background: T.gray200, border: `1px solid ${T.gray200}` }}>
          {[
            { icon: Mail,   title: "E-mail",    desc: "Para consultas e demonstrações:",  val: "info@alphadata.ao"  },
            { icon: Phone,  title: "Telefone",  desc: "Escritório central em Luanda:",    val: "+244 900 000 000"  },
            { icon: MapPin, title: "Morada",    desc: "Luanda, República de Angola",      val: "Luanda, Angola"    },
          ].map((item, i) => (
            <div key={i} style={{ background: T.white, padding: "48px 36px" }}>
              <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ background: "rgba(200,16,46,0.06)", border: `1px solid rgba(200,16,46,0.15)` }}>
                <item.icon style={{ width: 16, height: 16, color: T.red }} />
              </div>
              <h3 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: T.black, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontFamily: T.sans, fontSize: 13, color: T.gray400, marginBottom: 12 }}>{item.desc}</p>
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.red }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── SIMPLE CONTENT PAGE ─────────────────────────── */
  const SimpleContentPage = ({ title, content }: any) => (
    <div style={{ paddingTop: 100, paddingBottom: 96, background: T.white }}>
      <div className="max-w-3xl mx-auto px-6">
        <SectionLabel>Documentação Legal</SectionLabel>
        <h1 style={{ fontFamily: T.display, fontSize: 42, fontWeight: 800, color: T.black, letterSpacing: "-0.025em", marginBottom: 40 }}>{title}</h1>
        <div style={{ borderTop: `2px solid ${T.red}`, paddingTop: 32 }}>
          {content.map((p: string, i: number) => (
            <p key={i} style={{ fontFamily: T.sans, fontSize: 15, color: T.gray600, lineHeight: 1.8, marginBottom: 20 }}>{p}</p>
          ))}
        </div>
        <div className="mt-12">
          <OutlineBtn onClick={() => setCurrentPage("home")}>← Voltar ao Início</OutlineBtn>
        </div>
      </div>
    </div>
  );

  /* ── Router ──────────────────────────────────────── */
  const renderContent = () => {
    switch (currentPage) {
      case "home":       return <HomePage />;
      case "solucoes":   return <SolucoesPage />;
      case "regulacao":  return <RegulacaoPage />;
      case "dados":      return <DadosPage />;
      case "sobre":      return <SobrePage />;
      case "contacto":   return <ContactoPage />;
      case "carreiras":  return <SimpleContentPage title="Carreiras" content={["A Elastra é uma empresa recém-fundada em Luanda e está a recrutar os primeiros membros da sua equipa.","Procuramos perfis com experiência ou forte interesse em dados, sector energético e tecnologia.","Envie a sua candidatura para careers@alphadata.ao"]} />;
      case "termos":     return <SimpleContentPage title="Termos e Condições" content={["Estes termos regulam o acesso e utilização da plataforma Elastra Intelligence.","O acesso é restrito a utilizadores autorizados ao abrigo de contrato de licença corporativa.","É proibida a redistribuição de dados sem autorização prévia e por escrito."]} />;
      case "privacidade":return <SimpleContentPage title="Política de Privacidade" content={["A Elastra está comprometida com a protecção dos dados corporativos e pessoais dos seus utilizadores.","Utilizamos encriptação de ponta a ponta e não partilhamos dados de clientes com terceiros sem consentimento explícito.","Esta política está em conformidade com a legislação angolana de protecção de dados."]} />;
      case "compliance": return <SimpleContentPage title="Conformidade Anti-Corrupção" content={["A Elastra opera segundo rigorosos padrões éticos e de conformidade.","Mantemos políticas contra suborno e corrupção alinhadas com as melhores práticas internacionais.","Todos os colaboradores e parceiros estão sujeitos a processos de due diligence."]} />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        .blink { animation: blink 1s step-start infinite; }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.white, color: T.black }}>
        <Navbar />

        <main>
          <AnimatePresence mode="wait">
            <motion.div key={currentPage}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* CTA Section */}
        {currentPage !== "contacto" && (
          <section style={{ background: T.black, padding: "80px 24px", borderTop: `3px solid ${T.red}` }}>
            <div className="max-w-4xl mx-auto text-center">
              <SectionLabel>Próximo Passo</SectionLabel>
              <h2 style={{ fontFamily: T.display, fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 800, color: T.white, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 20 }}>
                Pronto para elevar o nível da sua análise?
              </h2>
              <p style={{ fontFamily: T.sans, fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
                Agende uma demonstração com a nossa equipa e conheça as capacidades da plataforma em detalhe.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <PrimaryBtn>Agendar Demonstração <ArrowRight style={{ width: 13, height: 13 }} /></PrimaryBtn>
                </Link>
                <OutlineBtn dark onClick={() => setCurrentPage("solucoes")}>Ver Planos Corporativos</OutlineBtn>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
}