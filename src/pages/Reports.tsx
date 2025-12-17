import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { 
  FileText, 
  Download,
  Calendar,
  Clock,
  Eye,
  Sparkles,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Ship,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";

const recentReports = [
  {
    id: 1,
    title: "Relatório Mensal de Produção",
    type: "Produção",
    date: "Novembro 2024",
    generated: "15 Nov 2024",
    pages: 24,
    status: "ready",
    aiGenerated: true,
  },
  {
    id: 2,
    title: "Análise de Mercado & Preços",
    type: "Mercado",
    date: "Novembro 2024",
    generated: "14 Nov 2024",
    pages: 18,
    status: "ready",
    aiGenerated: true,
  },
  {
    id: 3,
    title: "Exportações e Logística",
    type: "Exportações",
    date: "Outubro 2024",
    generated: "5 Nov 2024",
    pages: 32,
    status: "ready",
    aiGenerated: false,
  },
  {
    id: 4,
    title: "Avaliação de Riscos Q4",
    type: "Risco",
    date: "Q4 2024",
    generated: "1 Nov 2024",
    pages: 45,
    status: "ready",
    aiGenerated: true,
  },
  {
    id: 5,
    title: "Previsões IA - Dezembro",
    type: "Previsões",
    date: "Dezembro 2024",
    generated: "Em processamento",
    pages: null,
    status: "processing",
    aiGenerated: true,
  },
];

const reportCategories = [
  { name: "Produção", icon: BarChart3, count: 12, color: "bg-primary" },
  { name: "Mercado", icon: TrendingUp, count: 8, color: "bg-accent" },
  { name: "Exportações", icon: Ship, count: 10, color: "bg-success" },
  { name: "Risco", icon: AlertTriangle, count: 6, color: "bg-destructive" },
];

const scheduledReports = [
  {
    name: "Relatório Semanal de Preços",
    frequency: "Semanal",
    nextRun: "18 Nov 2024",
    recipients: 5,
  },
  {
    name: "Análise Mensal Completa",
    frequency: "Mensal",
    nextRun: "1 Dez 2024",
    recipients: 12,
  },
  {
    name: "Alerta de Riscos",
    frequency: "Diário",
    nextRun: "16 Nov 2024",
    recipients: 8,
  },
];

const reportHighlights = [
  {
    title: "Produção em declínio",
    description: "Queda de 2.1% na produção total vs. mês anterior",
    trend: "down",
    source: "Relatório Mensal Nov",
  },
  {
    title: "Preços em recuperação",
    description: "Brent subiu 1.8% com tensões no Médio Oriente",
    trend: "up",
    source: "Análise de Mercado Nov",
  },
  {
    title: "Exportações para China",
    description: "China representa 62% das exportações angolanas",
    trend: "stable",
    source: "Exportações Out",
  },
];

const Reports = () => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Produção": return <BarChart3 className="w-4 h-4" />;
      case "Mercado": return <TrendingUp className="w-4 h-4" />;
      case "Exportações": return <Ship className="w-4 h-4" />;
      case "Risco": return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Relatórios | AlphaData</title>
        <meta
          name="description"
          content="Relatórios inteligentes e automatizados sobre o setor petrolífero angolano. PDFs mensais com insights e análises."
        />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/reports" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/reports" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between"
              >
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Relatórios Inteligentes</h1>
                  <p className="text-muted-foreground">Análises automatizadas e insights gerados por IA</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar Novo Relatório
                </motion.button>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Relatórios Gerados"
                  value="36"
                  change={8}
                  changeLabel="este mês"
                  icon={<FileText className="w-5 h-5" />}
                  delay={0}
                />
                <KPICard
                  title="Downloads"
                  value="124"
                  change={15}
                  changeLabel="vs. mês anterior"
                  icon={<Download className="w-5 h-5" />}
                  variant="primary"
                  delay={0.05}
                />
                <KPICard
                  title="Agendados"
                  value="3"
                  change={0}
                  changeLabel="relatórios activos"
                  icon={<Calendar className="w-5 h-5" />}
                  variant="accent"
                  delay={0.1}
                />
                <KPICard
                  title="Gerados por IA"
                  value="85%"
                  change={12}
                  changeLabel="dos relatórios"
                  icon={<Sparkles className="w-5 h-5" />}
                  delay={0.15}
                />
              </div>

              {/* Categories & Search */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4">Categorias</h3>
                  <div className="space-y-3">
                    {reportCategories.map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category.color}/20`}>
                            <category.icon className={`w-4 h-4 ${category.color.replace('bg-', 'text-')}`} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{category.count}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="lg:col-span-3 rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Relatórios Recentes</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Pesquisar..." 
                          className="pl-9 h-9 w-48 bg-secondary/50 border-border/50"
                        />
                      </div>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-sm">
                        <Filter className="w-4 h-4" />
                        Filtrar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {recentReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                            {getTypeIcon(report.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{report.title}</h4>
                              {report.aiGenerated && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-primary/20 text-primary">
                                  <Sparkles className="w-3 h-3" />
                                  IA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{report.type}</span>
                              <span>•</span>
                              <span>{report.date}</span>
                              {report.pages && (
                                <>
                                  <span>•</span>
                                  <span>{report.pages} páginas</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {report.status === 'ready' ? (
                            <>
                              <span className="text-xs text-muted-foreground">{report.generated}</span>
                              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="flex items-center gap-2 text-xs text-accent">
                              <Clock className="w-3 h-3 animate-spin" />
                              A processar...
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Scheduled Reports & Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scheduled Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Relatórios Agendados</h3>
                      <p className="text-sm text-muted-foreground">Geração automática configurada</p>
                    </div>
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-4">
                    {scheduledReports.map((report, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground">{report.name}</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                            {report.frequency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Próximo: {report.nextRun}
                          </span>
                          <span>{report.recipients} destinatários</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Report Highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-xl border border-border/50 p-6 card-gradient"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Destaques Recentes</h3>
                      <p className="text-sm text-muted-foreground">Principais insights dos relatórios</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-4">
                    {reportHighlights.map((highlight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-full ${
                            highlight.trend === 'up' ? 'bg-success/20 text-success' :
                            highlight.trend === 'down' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {highlight.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                             highlight.trend === 'down' ? <BarChart3 className="w-3 h-3" /> :
                             <BarChart3 className="w-3 h-3" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground mb-1">{highlight.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{highlight.description}</p>
                            <span className="text-xs text-primary">{highlight.source}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Reports;
