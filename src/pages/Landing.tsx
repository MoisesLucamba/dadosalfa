import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Globe, 
  Shield, 
  Zap, 
  TrendingUp, 
  Database,
  ArrowRight,
  CheckCircle2,
  Play,
  ChevronRight,
  MapPin,
  Building2,
  Users,
  FileText,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import alphadataLogo from "@/assets/alphadata-logo.png";

const features = [
  {
    icon: Globe,
    title: "Cobertura Pan-Africana",
    titleEn: "Pan-African Coverage",
    titleFr: "Couverture Panafricaine",
    description: "Dados de 25+ países produtores de petróleo em África",
    descriptionEn: "Data from 25+ oil-producing countries in Africa",
    descriptionFr: "Données de plus de 25 pays producteurs de pétrole en Afrique",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Análise com IA",
    titleEn: "AI-Powered Analysis",
    titleFr: "Analyse par IA",
    description: "Machine learning para previsões de riscos e preços",
    descriptionEn: "Machine learning for risk and price predictions",
    descriptionFr: "Machine learning pour les prévisions de risques et de prix",
    color: "accent"
  },
  {
    icon: BarChart3,
    title: "Dados em Tempo Real",
    titleEn: "Real-Time Data",
    titleFr: "Données en Temps Réel",
    description: "Produção, exportações e preços atualizados diariamente",
    descriptionEn: "Production, exports and prices updated daily",
    descriptionFr: "Production, exportations et prix mis à jour quotidiennement",
    color: "success"
  },
  {
    icon: Shield,
    title: "Segurança Enterprise",
    titleEn: "Enterprise Security",
    titleFr: "Sécurité Entreprise",
    description: "Encriptação de nível bancário e conformidade total",
    descriptionEn: "Bank-level encryption and full compliance",
    descriptionFr: "Cryptage de niveau bancaire et conformité totale",
    color: "primary"
  },
  {
    icon: TrendingUp,
    title: "Previsões Precisas",
    titleEn: "Accurate Predictions",
    titleFr: "Prévisions Précises",
    description: "Modelos preditivos com 94% de precisão histórica",
    descriptionEn: "Predictive models with 94% historical accuracy",
    descriptionFr: "Modèles prédictifs avec 94% de précision historique",
    color: "accent"
  },
  {
    icon: Database,
    title: "Relatórios Automáticos",
    titleEn: "Automated Reports",
    titleFr: "Rapports Automatisés",
    description: "Geração automática de relatórios personalizados",
    descriptionEn: "Automatic generation of customized reports",
    descriptionFr: "Génération automatique de rapports personnalisés",
    color: "success"
  }
];

const stats = [
  { value: "25+", label: "Países Cobertos", labelEn: "Countries Covered", labelFr: "Pays Couverts" },
  { value: "7.5M", label: "Barris/Dia", labelEn: "Barrels/Day", labelFr: "Barils/Jour" },
  { value: "$200B+", label: "Volume Anual", labelEn: "Annual Volume", labelFr: "Volume Annuel" },
  { value: "500+", label: "Empresas Clientes", labelEn: "Client Companies", labelFr: "Entreprises Clientes" }
];

const clients = [
  "Sonangol", "Total Energies", "ExxonMobil", "Chevron", "BP Angola", "ENI"
];

const testimonials = [
  {
    quote: "A AlphaData transformou a forma como tomamos decisões estratégicas. Os dados em tempo real são indispensáveis.",
    quoteEn: "AlphaData has transformed how we make strategic decisions. Real-time data is indispensable.",
    quoteFr: "AlphaData a transformé notre façon de prendre des décisions stratégiques. Les données en temps réel sont indispensables.",
    author: "Carlos Mendes",
    role: "Director Executivo",
    roleEn: "Executive Director",
    roleFr: "Directeur Exécutif",
    company: "Sonangol E&P"
  },
  {
    quote: "A análise de riscos geopolíticos ajudou-nos a evitar perdas significativas em 2024.",
    quoteEn: "The geopolitical risk analysis helped us avoid significant losses in 2024.",
    quoteFr: "L'analyse des risques géopolitiques nous a aidés à éviter des pertes importantes en 2024.",
    author: "Marie Dubois",
    role: "Analista Senior",
    roleEn: "Senior Analyst",
    roleFr: "Analyste Senior",
    company: "Total Energies Africa"
  }
];

export default function Landing() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || 'pt';

  const getLocalizedText = (pt: string, en: string, fr: string) => {
    if (lang === 'en') return en;
    if (lang === 'fr') return fr;
    return pt;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto" />
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {getLocalizedText("Funcionalidades", "Features", "Fonctionnalités")}
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {getLocalizedText("Sobre", "About", "À Propos")}
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {getLocalizedText("Testemunhos", "Testimonials", "Témoignages")}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSelector variant="compact" />
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  {getLocalizedText("Entrar", "Sign In", "Connexion")}
                </Button>
              </Link>
              <Link to="/auth">
                <Button>
                  {getLocalizedText("Começar Agora", "Get Started", "Commencer")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Powered by AI
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  {getLocalizedText("Cobertura Pan-Africana", "Pan-African Coverage", "Couverture Panafricaine")}
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Africa's Premier
                <br />
                <span className="text-gradient-primary">Oil & Gas Intelligence</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                {getLocalizedText(
                  "A plataforma líder de market intelligence para o setor petrolífero africano. Dados em tempo real, análise com IA e previsões precisas.",
                  "The leading market intelligence platform for the African oil sector. Real-time data, AI analysis and accurate predictions.",
                  "La plateforme leader d'intelligence de marché pour le secteur pétrolier africain. Données en temps réel, analyse par IA et prévisions précises."
                )}
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link to="/auth">
                  <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                    {getLocalizedText("Solicitar Demo", "Request Demo", "Demander une Démo")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold">
                  <Play className="mr-2 h-5 w-5" />
                  {getLocalizedText("Ver Vídeo", "Watch Video", "Voir la Vidéo")}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {getLocalizedText(stat.label, stat.labelEn, stat.labelFr)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Image/Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="p-6 space-y-4">
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Dashboard</div>
                        <div className="text-xs text-muted-foreground">
                          {getLocalizedText("Visão Geral", "Overview", "Aperçu")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive/50" />
                      <div className="h-3 w-3 rounded-full bg-warning/50" />
                      <div className="h-3 w-3 rounded-full bg-success/50" />
                    </div>
                  </div>

                  {/* Mock KPIs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                      <div className="text-xs text-muted-foreground mb-1">
                        {getLocalizedText("Produção Total", "Total Production", "Production Totale")}
                      </div>
                      <div className="text-2xl font-bold text-foreground">1.24M</div>
                      <div className="text-xs text-success">+2.4%</div>
                    </div>
                    <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                      <div className="text-xs text-muted-foreground mb-1">Brent</div>
                      <div className="text-2xl font-bold text-foreground">$78.45</div>
                      <div className="text-xs text-destructive">-0.8%</div>
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="h-32 rounded-xl bg-background/50 border border-border/30 p-4">
                    <div className="flex items-end justify-between h-full gap-2">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mock Table */}
                  <div className="rounded-xl bg-background/50 border border-border/30 overflow-hidden">
                    <div className="p-3 border-b border-border/30 bg-muted/30">
                      <div className="text-sm font-medium text-foreground">
                        {getLocalizedText("Top Operadoras", "Top Operators", "Top Opérateurs")}
                      </div>
                    </div>
                    <div className="divide-y divide-border/30">
                      {["Sonangol", "Total", "Chevron"].map((name, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between">
                          <span className="text-sm text-foreground">{name}</span>
                          <span className="text-xs text-muted-foreground">{(250 - i * 30)}k bbl/d</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 p-4 rounded-xl bg-card border border-border/50 shadow-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {getLocalizedText("Índice de Risco", "Risk Index", "Indice de Risque")}
                    </div>
                    <div className="font-semibold text-foreground">42/100</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-card border border-border/50 shadow-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">AI Insights</div>
                    <div className="font-semibold text-foreground">
                      {getLocalizedText("3 novos alertas", "3 new alerts", "3 nouvelles alertes")}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-8">
            {getLocalizedText(
              "Empresas líderes do setor confiam na AlphaData",
              "Leading industry companies trust AlphaData",
              "Les entreprises leaders du secteur font confiance à AlphaData"
            )}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {clients.map((client, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="text-xl font-bold text-muted-foreground"
              >
                {client}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {getLocalizedText("Funcionalidades", "Features", "Fonctionnalités")}
            </span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {getLocalizedText(
                "Tudo o que precisa numa única plataforma",
                "Everything you need in one platform",
                "Tout ce dont vous avez besoin sur une seule plateforme"
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {getLocalizedText(
                "Ferramentas poderosas para análise de mercado, gestão de riscos e tomada de decisões estratégicas",
                "Powerful tools for market analysis, risk management and strategic decision-making",
                "Des outils puissants pour l'analyse de marché, la gestion des risques et la prise de décisions stratégiques"
              )}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClass = feature.color === 'primary' ? 'text-primary bg-primary/10' :
                               feature.color === 'accent' ? 'text-accent bg-accent/10' :
                               'text-[hsl(var(--success))] bg-success/10';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-14 w-14 rounded-xl ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {getLocalizedText(feature.title, feature.titleEn, feature.titleFr)}
                  </h3>
                  <p className="text-muted-foreground">
                    {getLocalizedText(feature.description, feature.descriptionEn, feature.descriptionFr)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
                {getLocalizedText("Sobre Nós", "About Us", "À Propos")}
              </span>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                {getLocalizedText(
                  "Liderando a transformação digital do setor petrolífero africano",
                  "Leading the digital transformation of Africa's oil sector",
                  "Leader de la transformation numérique du secteur pétrolier africain"
                )}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {getLocalizedText(
                  "A AlphaData nasceu da necessidade de dados precisos e análises inteligentes para o mercado petrolífero africano. Com uma equipa de especialistas e tecnologia de ponta, ajudamos empresas a tomar decisões mais informadas.",
                  "AlphaData was born from the need for accurate data and intelligent analysis for the African oil market. With a team of experts and cutting-edge technology, we help companies make more informed decisions.",
                  "AlphaData est née du besoin de données précises et d'analyses intelligentes pour le marché pétrolier africain. Avec une équipe d'experts et une technologie de pointe, nous aidons les entreprises à prendre des décisions plus éclairées."
                )}
              </p>

              <div className="space-y-4">
                {[
                  { pt: "Cobertura de 25+ países africanos", en: "Coverage of 25+ African countries", fr: "Couverture de plus de 25 pays africains" },
                  { pt: "Dados atualizados diariamente", en: "Daily updated data", fr: "Données mises à jour quotidiennement" },
                  { pt: "Suporte 24/7 em português, inglês e francês", en: "24/7 support in Portuguese, English and French", fr: "Support 24/7 en portugais, anglais et français" },
                  { pt: "Conformidade com regulamentações locais", en: "Compliance with local regulations", fr: "Conformité avec les réglementations locales" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{getLocalizedText(item.pt, item.en, item.fr)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: MapPin, value: "Luanda", label: { pt: "Sede Principal", en: "Headquarters", fr: "Siège Principal" } },
                { icon: Users, value: "150+", label: { pt: "Especialistas", en: "Specialists", fr: "Spécialistes" } },
                { icon: Building2, value: "500+", label: { pt: "Empresas Clientes", en: "Client Companies", fr: "Entreprises Clientes" } },
                { icon: FileText, value: "10K+", label: { pt: "Relatórios/Ano", en: "Reports/Year", fr: "Rapports/An" } }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="p-6 rounded-2xl bg-card border border-border/50 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{item.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {getLocalizedText(item.label.pt, item.label.en, item.label.fr)}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {getLocalizedText("Testemunhos", "Testimonials", "Témoignages")}
            </span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {getLocalizedText(
                "O que dizem os nossos clientes",
                "What our clients say",
                "Ce que disent nos clients"
              )}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg text-foreground mb-6 italic">
                  "{getLocalizedText(testimonial.quote, testimonial.quoteEn, testimonial.quoteFr)}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {getLocalizedText(testimonial.role, testimonial.roleEn, testimonial.roleFr)}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              {getLocalizedText("Plano Enterprise", "Enterprise Plan", "Plan Entreprise")}
            </span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {getLocalizedText(
                "Acesso completo à plataforma",
                "Complete platform access",
                "Accès complet à la plateforme"
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {getLocalizedText(
                "Um único plano com acesso ilimitado a todas as funcionalidades",
                "One plan with unlimited access to all features",
                "Un seul plan avec accès illimité à toutes les fonctionnalités"
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-card border-2 border-primary/30 shadow-2xl"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg">
                <Star className="h-4 w-4 fill-current" />
                {getLocalizedText("Plano Único", "Single Plan", "Plan Unique")}
              </span>
            </div>

            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold text-foreground">$50,000</span>
                <span className="text-xl text-muted-foreground">
                  /{getLocalizedText("ano", "year", "an")}
                </span>
              </div>
              <p className="text-muted-foreground">
                {getLocalizedText(
                  "Faturação anual • Acesso para toda a empresa",
                  "Annual billing • Company-wide access",
                  "Facturation annuelle • Accès pour toute l'entreprise"
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                { pt: "Acesso ilimitado a todos os dados", en: "Unlimited access to all data", fr: "Accès illimité à toutes les données" },
                { pt: "Análise de riscos com IA", en: "AI-powered risk analysis", fr: "Analyse des risques par IA" },
                { pt: "Previsões geopolíticas em tempo real", en: "Real-time geopolitical forecasts", fr: "Prévisions géopolitiques en temps réel" },
                { pt: "Simulador de impacto regulatório", en: "Regulatory impact simulator", fr: "Simulateur d'impact réglementaire" },
                { pt: "Relatórios PDF profissionais", en: "Professional PDF reports", fr: "Rapports PDF professionnels" },
                { pt: "Alertas personalizados", en: "Custom alerts", fr: "Alertes personnalisées" },
                { pt: "API de integração", en: "Integration API", fr: "API d'intégration" },
                { pt: "Suporte prioritário 24/7", en: "24/7 priority support", fr: "Support prioritaire 24/7" },
                { pt: "Gestão de múltiplos utilizadores", en: "Multi-user management", fr: "Gestion multi-utilisateurs" },
                { pt: "Formação personalizada", en: "Personalized training", fr: "Formation personnalisée" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{getLocalizedText(item.pt, item.en, item.fr)}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                  {getLocalizedText("Começar Agora", "Get Started", "Commencer Maintenant")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                {getLocalizedText(
                  "Inclui demonstração gratuita e período de teste de 30 dias",
                  "Includes free demo and 30-day trial period",
                  "Comprend une démo gratuite et une période d'essai de 30 jours"
                )}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-6">
              {getLocalizedText(
                "Pronto para transformar a sua análise de mercado?",
                "Ready to transform your market analysis?",
                "Prêt à transformer votre analyse de marché?"
              )}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {getLocalizedText(
                "Junte-se a mais de 500 empresas que já utilizam a AlphaData para tomar decisões mais inteligentes.",
                "Join over 500 companies already using AlphaData to make smarter decisions.",
                "Rejoignez plus de 500 entreprises qui utilisent déjà AlphaData pour prendre des décisions plus intelligentes."
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                  {getLocalizedText("Solicitar Demo Gratuita", "Request Free Demo", "Demander une Démo Gratuite")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold">
                  {getLocalizedText("Falar com Vendas", "Talk to Sales", "Parler aux Ventes")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {getLocalizedText(
                  "A plataforma líder de market intelligence para o setor petrolífero africano.",
                  "The leading market intelligence platform for the African oil sector.",
                  "La plateforme leader d'intelligence de marché pour le secteur pétrolier africain."
                )}
              </p>
              <p className="text-lg font-medium text-foreground italic">
                "{getLocalizedText(
                  "O tempo é o nosso ativo mais valioso",
                  "Time is our most valuable asset",
                  "Le temps est notre atout le plus précieux"
                )}"
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                {getLocalizedText("Produto", "Product", "Produit")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{getLocalizedText("Funcionalidades", "Features", "Fonctionnalités")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Preços", "Pricing", "Tarifs")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Integrações", "Integrations", "Intégrations")}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                {getLocalizedText("Empresa", "Company", "Entreprise")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">{getLocalizedText("Sobre", "About", "À Propos")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Carreiras", "Careers", "Carrières")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Contacto", "Contact", "Contact")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                {getLocalizedText("Legal", "Legal", "Légal")}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Termos de Uso", "Terms of Service", "Conditions d'Utilisation")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Privacidade", "Privacy", "Confidentialité")}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{getLocalizedText("Cookies", "Cookies", "Cookies")}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-wrap justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 AlphaData. {getLocalizedText("Todos os direitos reservados.", "All rights reserved.", "Tous droits réservés.")}
            </p>
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </footer>
    </div>
  );
}
