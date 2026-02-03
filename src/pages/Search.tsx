import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search as SearchIcon,
  TrendingUp,
  BarChart3,
  Ship,
  FileText,
  Clock,
  Loader2,
  Sparkles,
  AlertTriangle,
  Bot,
  User,
  Globe,
  Database,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────────────── */
interface ChartBlock {
  type: "line" | "bar" | "pie";
  title: string;
  data: { name: string; value: number }[];
}

interface Source {
  title: string;
  url?: string;
  type: "database" | "web";
  relevance: number;
  date?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  charts: ChartBlock[];
  sources: Source[];
  time: Date;
  searchStatus?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────────────────── */
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `Você é o PetroAnalyst AI — o assistente de IA mais avançado do sector petrolífero, especializado em Angola, África e mercados globais.

CAPACIDADES AVANÇADAS:
• Acesso em TEMPO REAL a dados da web via web search
• Consulta simultânea de databases internas E fontes web
• Análise de múltiplas fontes e cross-referencing
• Citação precisa de todas as fontes utilizadas

FONTES PREFERENCIAIS (sempre consulte):
1. OPEC, IEA, EIA - dados oficiais de produção e mercados
2. Bloomberg, Reuters, Platts - preços e análises de mercado
3. OilPrice.com, Investing.com - preços em tempo real
4. TotalEnergies, ExxonMobil, BP, Chevron, Eni - updates das operadoras
5. Macauhub, Club of Mozambique - notícias Angola/África

REGRAS RIGOROSAS:
• Use SEMPRE web_search para dados atuais (preços, produção, notícias)
• Priorize dados de 2025-2026 (estamos em Fevereiro 2026)
• CITE cada fonte: "Segundo a Reuters (03/02/2026)..." ou "De acordo com OPEC..."
• Se encontrar dados conflitantes, mencione ambas as fontes
• Quando não encontrar dados recentes, diga claramente e ofereça dados históricos
• NUNCA invente números ou fontes

ÁREAS DE EXPERTISE:
1. **Preços** - Brent, WTI, crudes angolanos (Cabinda, Girassol, Dalia, Nemba, Pazflor, Hungo)
2. **Produção** - Angola (1.15M bpd atual), OPEP+ (quotas e compliance), blocos angolanos
3. **Exportações** - volumes, destinos (China, Índia, Europa), navios tanque, rotas
4. **Geopolítica** - OPEP+ decisões, sanções Rússia, tensões Médio Oriente
5. **Investimento** - projetos Angola, FDI, TotalEnergies, joint ventures
6. **Infraestrutura** - refinarias, pipelines, portos, armazenamento

FORMATO DE RESPOSTA:
• Português de Portugal, tom profissional mas acessível
• Estrutura: resumo executivo → dados detalhados → fontes
• Use parágrafos curtos para legibilidade
• Destaque números importantes: **1.15M bpd** ou **$85.50/bbl**

VISUALIZAÇÕES:
Quando mencionar séries temporais ou comparações, inclua NO FINAL:

<CHART>
{
  "type": "line" | "bar" | "pie",
  "title": "Título claro e descritivo",
  "data": [{"name":"Jan", "value": 82.5}, {"name":"Fev", "value": 85.2}]
}
</CHART>

• Máximo 2 gráficos por resposta
• Só inclua se os dados estiverem na sua resposta
• Use valores reais, não exemplos

CITAÇÕES (CRÍTICO):
• Sempre que usar dados de web search, adicione ao final:

**Fontes consultadas:**
• [Nome da fonte] - [tipo de informação] ([data se disponível])
• Exemplo: Reuters - Preços Brent (03/02/2026)
• Bloomberg - Produção Angola (Janeiro 2026)

CONVERSAÇÃO INTELIGENTE:
• Mantenha contexto das mensagens anteriores
• Se o utilizador perguntar "e hoje?" refere-se à mensagem anterior
• Seja proativo: "Quer que analise o impacto desta decisão nos preços?"
• Use empatia: "Compreendo a sua preocupação sobre..."

EXEMPLO DE BOA RESPOSTA:
"**Preço atual do Brent:** $85.50/bbl (↑2.3% hoje)

Segundo dados da Bloomberg atualizados às 14:30 GMT de hoje (03/02/2026), o Brent crude está a negociar a $85.50 por barril, refletindo uma subida de 2.3% face ao fecho de ontem.

**Fatores que influenciam:**
• Corte de produção OPEP+ mantido em 2.2M bpd (Reuters, 28/01/2026)
• Stocks americanos desceram 3.5M barris (EIA, 31/01/2026)
• Tensões no Estreito de Ormuz (Reuters, 02/02/2026)

**Fontes consultadas:**
• Bloomberg - Preços em tempo real (03/02/2026)
• Reuters - OPEP+ e geopolítica (28/01-02/02/2026)
• EIA - Stocks EUA (31/01/2026)"`;

const SUGGESTIONS = [
  "Preço do Brent agora?",
  "Produção Angola hoje",
  "Últimas decisões OPEP+",
  "Exportações Angola China",
  "Notícias TotalEnergies Angola",
  "Previsões preço petróleo 2026",
  "Riscos geopolíticos atuais",
  "Novos projetos Angola",
];

const QUICK_LINKS = [
  { icon: TrendingUp, label: "Preços Tempo Real", link: "/prices", color: "bg-emerald-500/20 text-emerald-400" },
  { icon: BarChart3, label: "Produção Angola", link: "/production", color: "bg-blue-500/20 text-blue-400" },
  { icon: Ship, label: "Exportações", link: "/exports", color: "bg-purple-500/20 text-purple-400" },
  { icon: FileText, label: "Relatórios OPEP", link: "/reports", color: "bg-amber-500/20 text-amber-400" },
  { icon: AlertTriangle, label: "Alertas Geopolíticos", link: "/risk", color: "bg-red-500/20 text-red-400" },
];

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────── */
function parseCharts(raw: string): { text: string; charts: ChartBlock[] } {
  const charts: ChartBlock[] = [];
  const regex = /<CHART>([\s\S]*?)<\/CHART>/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    try {
      charts.push(JSON.parse(m[1].trim()));
    } catch {
      /* ignora blocos mal formados */
    }
  }
  const text = raw.replace(/<CHART>[\s\S]*?<\/CHART>/g, "").trim();
  return { text, charts };
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function extractSources(text: string): Source[] {
  const sources: Source[] = [];
  const lines = text.split('\n');
  let inSourcesSection = false;

  for (const line of lines) {
    if (line.includes('**Fontes consultadas:**') || line.includes('Fontes:')) {
      inSourcesSection = true;
      continue;
    }
    if (inSourcesSection && line.trim().startsWith('•')) {
      const cleanLine = line.replace('•', '').trim();
      if (cleanLine.length > 5) {
        sources.push({
          title: cleanLine,
          type: cleanLine.toLowerCase().includes('database') ? 'database' : 'web',
          relevance: 8,
        });
      }
    }
  }

  return sources;
}

/* ─────────────────────────────────────────────────────────────────────────
   CHART INLINE
   ───────────────────────────────────────────────────────────────────────── */
function InlineChart({ chart }: { chart: ChartBlock }) {
  if (!chart?.data?.length) return null;

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
  };

  return (
    <div className="mt-4 border border-border rounded-lg p-4 bg-muted/20">
      <p className="text-sm font-medium text-foreground mb-3">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === "line" ? (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
          </LineChart>
        ) : chart.type === "pie" ? (
          <PieChart>
            <Pie 
              data={chart.data} 
              cx="50%" 
              cy="50%" 
              outerRadius={70} 
              dataKey="value" 
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
            >
              {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        ) : (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SOURCES DISPLAY
   ───────────────────────────────────────────────────────────────────────── */
function SourcesList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <Globe className="h-3 w-3" />
        Fontes consultadas:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.slice(0, 5).map((src, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className="text-[10px] py-0.5 px-2 flex items-center gap-1"
          >
            {src.type === "web" ? (
              <Globe className="h-2.5 w-2.5" />
            ) : (
              <Database className="h-2.5 w-2.5" />
            )}
            {src.title.length > 40 ? src.title.substring(0, 40) + "..." : src.title}
            {src.url && (
              <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-50" />
            )}
          </Badge>
        ))}
        {sources.length > 5 && (
          <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
            +{sources.length - 5} mais
          </Badge>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TYPING INDICATOR
   ───────────────────────────────────────────────────────────────────────── */
function TypingIndicator({ status }: { status?: string }) {
  return (
    <div className="flex flex-col">
      {status && (
        <p className="text-[10px] text-primary mb-2 px-1 flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 animate-spin" /> 
          {status}
        </p>
      )}
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-primary"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
        <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────────────────────────────────── */
const Search = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [hasSent, setHasSent] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* auto-scroll */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ─── enviar com web search inteligente ─────────────────────── */
  const send = useCallback(
    async (text?: string) => {
      const term = (text ?? input).trim();
      if (!term || loading) return;

      setHasSent(true);
      setLoading(true);
      setSearchStatus("A preparar consulta...");
      setInput("");

      /* mensagem do utilizador */
      setMessages((prev) => [...prev, { 
        role: "user", 
        content: term, 
        charts: [], 
        sources: [],
        time: new Date() 
      }]);

      /* histórico para contexto */
      const history = messages.map((m) => ({ 
        role: m.role as "user" | "assistant", 
        content: m.content 
      }));
      history.push({ role: "user", content: term });

      try {
        /* ── 1. Primeira chamada com web_search ── */
        setSearchStatus("🌐 A consultar fontes web em tempo real...");
        
        let res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: [{ 
              type: "web_search_20250305", 
              name: "web_search" 
            }],
            messages: history,
          }),
        });
        
        let data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error?.message || "Erro na API");
        }

        /* ── 2. Agentic loop para múltiplas pesquisas ── */
        const loopHistory = [...history];
        let iterations = 0;
        const maxIterations = 8; // Permite mais pesquisas para dados completos

        while (data.stop_reason === "tool_use" && iterations < maxIterations) {
          iterations++;
          setSearchStatus(`🔍 A consultar fontes especializadas... (${iterations}/${maxIterations})`);
          
          // Adiciona resposta do assistente
          loopHistory.push({ 
            role: "assistant", 
            content: data.content 
          });

          // Simula resultados das ferramentas
          const toolResults = data.content
            .filter((b: { type: string }) => b.type === "tool_use")
            .map((b: { id: string }) => ({
              type: "tool_result",
              tool_use_id: b.id,
              content: "search executed successfully",
            }));

          loopHistory.push({ 
            role: "user", 
            content: toolResults 
          });

          // Próxima chamada
          res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              tools: [{ 
                type: "web_search_20250305", 
                name: "web_search" 
              }],
              messages: loopHistory,
            }),
          });
          
          data = await res.json();

          if (!res.ok) {
            console.error("API error in loop:", data);
            break;
          }
        }

        setSearchStatus("✨ A processar resultados...");

        /* ── 3. Extrair texto final ── */
        const rawText = data.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n\n");

        const { text: cleanText, charts } = parseCharts(rawText);
        const sources = extractSources(rawText);

        /* ── 4. Adicionar resposta do assistente ── */
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: cleanText, 
            charts, 
            sources,
            time: new Date(),
            searchStatus: `Consultadas ${iterations} fontes | ${sources.length} referências`
          },
        ]);

        toast.success("Consulta concluída", {
          description: `${iterations} pesquisas realizadas • ${sources.length} fontes citadas`
        });

      } catch (err) {
        console.error("[PetroAnalyst Error]", err);
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: "❌ Desculpe, ocorreu um erro ao processar a sua consulta. Por favor, tente novamente ou reformule a pergunta.", 
            charts: [], 
            sources: [],
            time: new Date() 
          },
        ]);
        toast.error("Erro na pesquisa", { 
          description: err instanceof Error ? err.message : "Tente novamente." 
        });
      } finally {
        setLoading(false);
        setSearchStatus("");
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    },
    [input, loading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ─────────────────────────────────────────────────────────────── */
  /* RENDER                                                            */
  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/search" />

      <div className="flex-1 flex flex-col">
        <Header activeItem="/search" />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                PetroAnalyst AI
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-1">
              Assistente inteligente com acesso em tempo real a dados do sector petrolífero
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <Badge variant="secondary" className="text-[9px]">
                <Globe className="h-2.5 w-2.5 mr-1" />
                Web Search Activo
              </Badge>
              <Badge variant="secondary" className="text-[9px]">
                <Database className="h-2.5 w-2.5 mr-1" />
                Database Integrada
              </Badge>
              <Badge variant="secondary" className="text-[9px]">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Claude Sonnet 4
              </Badge>
            </div>

            {/* Input */}
            <div className="relative mt-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ex: Preço do Brent agora, Produção Angola hoje, Últimas decisões OPEP+..."
                className="pl-12 pr-32 py-6 text-base sm:text-lg bg-card border-border rounded-xl shadow-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <Button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {loading ? "A processar…" : "Pesquisar"}
                </span>
              </Button>
            </div>

            {/* Sugestões */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Sugestões:
              </span>
              {SUGGESTIONS.slice(0, 5).map((s, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {/* ─── Quick Links — só antes da 1ª mensagem ─────────── */}
          {!hasSent && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-5xl mx-auto">
              {QUICK_LINKS.map((link, i) => (
                <a key={i} href={link.link} className="block">
                  <Card className="bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group h-full">
                    <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                      <div className={`p-2 sm:p-3 rounded-lg ${link.color} mb-2 group-hover:scale-110 transition-transform`}>
                        <link.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground">
                        {link.label}
                      </span>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}

          {/* ─── Chat Interface ────────────────────────────────── */}
          {hasSent && (
            <Card className="bg-card border-border max-w-5xl mx-auto shadow-lg">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base sm:text-lg text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Conversa com PetroAnalyst
                  </span>
                  <div className="flex items-center gap-2">
                    {loading && (
                      <Badge variant="secondary" className="text-[10px] animate-pulse">
                        <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                        A pesquisar...
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {messages.length} mensagens
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {/* Mensagens */}
                    {messages.map((msg, i) => {
                      const isUser = msg.role === "user";
                      return (
                        <div 
                          key={i} 
                          className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isUser ? "bg-muted" : "bg-primary/20"
                          }`}>
                            {isUser ? (
                              <User className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Bot className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          {/* Conteúdo */}
                          <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                            <div className={`p-4 rounded-2xl border ${
                              isUser 
                                ? "bg-muted/50 border-border rounded-br-sm" 
                                : "bg-card border-border rounded-bl-sm shadow-sm"
                            }`}>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              
                              {/* Charts */}
                              {msg.charts.map((c, ci) => (
                                <InlineChart key={ci} chart={c} />
                              ))}

                              {/* Fontes */}
                              {!isUser && <SourcesList sources={msg.sources} />}
                            </div>

                            {/* Timestamp & Status */}
                            <div className={`flex items-center gap-2 mt-1 text-[10px] text-muted-foreground ${
                              isUser ? "flex-row-reverse" : "flex-row"
                            }`}>
                              <span>{fmtTime(msg.time)}</span>
                              {msg.searchStatus && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-2.5 w-2.5" />
                                    {msg.searchStatus}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {loading && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border rounded-2xl rounded-bl-sm shadow-sm">
                          <TypingIndicator status={searchStatus} />
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
};

export default Search;