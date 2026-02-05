import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {
  Search as SearchIcon,
  TrendingUp,
  BarChart3,
  Ship,
  Clock,
  Loader2,
  Bot,
  User,
  Globe,
  Database,
  Send,
  Cpu,
  CheckCircle,
  Plus,
  Trash2,
  History,
  MessageSquare,
  ChevronRight,
  X,
  Menu,
  Zap,
  DollarSign,
  Activity,
  Package,
  Truck,
  Calendar,
  LineChart,
  AlertCircle,
  ChevronLeft,
  FileText,
  TrendingDown,
  Shield,
  Target
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

// CONFIGURE ESTA URL COM SEU SUPABASE EDGE FUNCTION
const BACKEND_URL = "YOUR_SUPABASE_URL/functions/v1/petroleum-search-enhanced";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChartBlock {
  type: "area" | "bar";
  title: string;
  data: { name: string; value: number }[];
}

interface Source {
  title: string;
  type: "database" | "web";
}

interface BackendResult {
  title: string;
  description: string;
  type: string;
  source: "database" | "web";
  relevance: number;
  date?: string;
  data?: Record<string, unknown>;
  url?: string;
  siteName?: string;
}

interface BackendResponse {
  success: boolean;
  results: BackendResult[];
  query: string;
  count: number;
  sources: {
    database: number;
    web: number;
  };
  timestamp?: string;
  error?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  charts: ChartBlock[];
  sources: Source[];
  time: string;
  searchStatus?: string;
  rawResults?: BackendResult[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  gradient: string;
  category: string;
  searchType?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Análise de Preços do Brent Crude Oil",
    icon: TrendingUp,
    gradient: "from-blue-900 to-blue-700",
    category: "Mercado Financeiro",
    searchType: "prices"
  },
  {
    label: "Relatório de Produção Mensal Consolidado",
    icon: BarChart3,
    gradient: "from-red-900 to-red-700",
    category: "Produção",
    searchType: "production"
  },
  {
    label: "Otimização da Cadeia Logística Naval",
    icon: Ship,
    gradient: "from-blue-800 to-blue-600",
    category: "Logística",
    searchType: "exports"
  },
  {
    label: "Projeções Estratégicas para o Exercício 2026",
    icon: Target,
    gradient: "from-red-800 to-red-600",
    category: "Planejamento",
    searchType: "all"
  },
  {
    label: "Monitoramento de Riscos Operacionais Críticos",
    icon: AlertCircle,
    gradient: "from-red-800 to-red-600",
    category: "Gestão de Riscos",
    searchType: "risk"
  },
  {
    label: "Análise Geopolítica e Impactos de Mercado",
    icon: Shield,
    gradient: "from-blue-900 to-blue-700",
    category: "Geopolítica",
    searchType: "geopolitical"
  },
];

const STORAGE_KEY = "petro_analyst_sessions";

/* ═══════════════════════════════════════════════════════════════════════════
   API INTEGRATION
   ═══════════════════════════════════════════════════════════════════════════ */

const searchPetroleumData = async (
  query: string,
  searchType?: string
): Promise<BackendResponse> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        query,
        searchType: searchType || "all",
        includeWeb: false, // Ativar quando configurar ANTHROPIC_API_KEY
        maxResults: 20,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: BackendResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Erro desconhecido na pesquisa");
    }

    return data;
  } catch (error) {
    console.error("[API Error]", error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATA FORMATTERS
   ═══════════════════════════════════════════════════════════════════════════ */

const formatBackendResponse = (
  backendData: BackendResponse,
  query: string
): { content: string; charts: ChartBlock[]; sources: Source[] } => {
  const { results, sources: sourceCounts } = backendData;

  // Agrupar por tipo
  const byType: Record<string, BackendResult[]> = {};
  results.forEach((r) => {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  });

  // Gerar conteúdo markdown
  let content = `### Resultados da Consulta: ${query}\n\n`;
  content += `Foram encontrados **${results.length} registos** relevantes `;
  content += `(${sourceCounts.database} da base de dados corporativa`;
  if (sourceCounts.web > 0) {
    content += `, ${sourceCounts.web} de fontes web`;
  }
  content += `).\n\n`;

  // Preços
  if (byType.prices?.length > 0) {
    content += `**Análise de Preços:**\n`;
    byType.prices.slice(0, 3).forEach((r) => {
      content += `* ${r.title}: ${r.description}\n`;
    });
    content += `\n`;
  }

  // Produção
  if (byType.production?.length > 0) {
    content += `**Dados de Produção:**\n`;
    byType.production.slice(0, 3).forEach((r) => {
      content += `* ${r.title}: ${r.description}\n`;
    });
    content += `\n`;
  }

  // Exportações
  if (byType.exports?.length > 0) {
    content += `**Informações de Exportação:**\n`;
    byType.exports.slice(0, 3).forEach((r) => {
      content += `* ${r.title}: ${r.description}\n`;
    });
    content += `\n`;
  }

  // Riscos
  if (byType.risk?.length > 0 || byType.geopolitical?.length > 0) {
    content += `**Análise de Riscos:**\n`;
    [...(byType.risk || []), ...(byType.geopolitical || [])]
      .slice(0, 3)
      .forEach((r) => {
        content += `* ${r.title}: ${r.description}\n`;
      });
    content += `\n`;
  }

  // Gerar charts se houver dados de preços ou produção
  const charts: ChartBlock[] = [];

  if (byType.prices?.length >= 3) {
    const priceData = byType.prices.slice(0, 5).map((r, i) => {
      const match = r.title.match(/\$([0-9.]+)/);
      return {
        name: r.data?.crude_type as string || `Item ${i + 1}`,
        value: match ? parseFloat(match[1]) : 80 + Math.random() * 10,
      };
    });

    charts.push({
      type: "area",
      title: "Cotações Recentes (USD/bbl)",
      data: priceData,
    });
  }

  if (byType.production?.length >= 3) {
    const prodData = byType.production.slice(0, 5).map((r) => {
      const match = r.description.match(/([0-9,]+)\s*bpd/);
      return {
        name: r.data?.block as string || r.title.split("–")[1]?.trim() || "N/A",
        value: match ? parseInt(match[1].replace(/,/g, "")) : 100000,
      };
    });

    charts.push({
      type: "area",
      title: "Produção Diária por Bloco (bpd)",
      data: prodData,
    });
  }

  // Preparar sources
  const sources: Source[] = [];
  const uniqueSources = new Set<string>();

  results.forEach((r) => {
    const sourceTitle =
      r.source === "database"
        ? "Base de Dados Corporativa"
        : r.siteName || "Pesquisa Web";

    if (!uniqueSources.has(sourceTitle)) {
      uniqueSources.add(sourceTitle);
      sources.push({
        title: sourceTitle,
        type: r.source,
      });
    }
  });

  return { content, charts, sources };
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const processBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white bg-red-900/20 px-1.5 py-0.5 rounded">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const FormattedText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xl font-bold text-red-500 mt-6 mb-3">
              {line.replace('### ', '')}
            </h3>
          );
        }
        if (line.startsWith('* ')) {
          return (
            <li key={i} className="ml-6 list-disc text-gray-200 leading-relaxed">
              {processBold(line.replace('* ', ''))}
            </li>
          );
        }
        if (line.trim() === '') return null;
        return (
          <p key={i} className="text-gray-200 leading-relaxed">
            {processBold(line)}
          </p>
        );
      })}
    </div>
  );
};

const WelcomeScreen = ({ onQuickAction }: { onQuickAction: (label: string, searchType?: string) => void }) => (
  <motion.div 
    key="welcome"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4 }}
    className="flex-1 flex flex-col justify-center items-center text-center space-y-12 py-12"
  >
    <div className="space-y-6">
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-red-900/20 to-blue-900/20 border border-red-800/30 text-white text-sm font-medium backdrop-blur-sm"
      >
        <Cpu className="w-5 h-5 text-red-400" />
        <span>Sistema de Inteligência Analítica Empresarial</span>
      </motion.div>
      
      <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
        <span className="text-white">Plataforma de </span>
        <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          Business Intelligence
        </span>
      </h1>
      
      <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed font-light">
        Análise de dados em tempo real, processamento de linguagem natural e insights estratégicos baseados em inteligência artificial avançada.
      </p>
    </div>

    <div className="w-full max-w-6xl px-4">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Consultas Estratégicas Sugeridas</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.03 }}
            onClick={() => onQuickAction(action.label, action.searchType)}
            className="group relative p-5 rounded-xl bg-gradient-to-br from-gray-900/80 to-black/90 border border-gray-800 hover:border-red-800/40 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${action.gradient} group-hover:scale-105 transition-transform duration-300`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">{action.category}</span>
              </div>
              <span className="font-medium text-white text-sm text-left leading-snug">{action.label}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

const ChatBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
        isUser 
          ? 'bg-gradient-to-br from-blue-800 to-blue-600' 
          : 'bg-gradient-to-br from-red-800 to-red-600'
      }`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>

      <div className={`flex flex-col space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
          isUser 
            ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/20 rounded-tr-md' 
            : 'bg-gradient-to-br from-gray-900/90 to-black/90 border-gray-800/50 rounded-tl-md'
        }`}>
          <FormattedText text={message.content} />
          
          {message.charts.map((chart, ci) => (
            <div key={ci} className="mt-6 p-4 rounded-xl bg-black/40 border border-red-900/20">
              <p className="text-xs font-semibold mb-4 uppercase tracking-wider flex items-center gap-2 text-red-400">
                <BarChart3 className="w-4 h-4" /> {chart.title}
              </p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.data}>
                    <defs>
                      <linearGradient id={`colorV-${ci}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#000',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                    <Area type="monotone" dataKey="value" stroke="#dc2626" fill={`url(#colorV-${ci})`} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
          
          {!isUser && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800/50 flex flex-wrap gap-2">
              {message.sources.map((s, si) => (
                <Badge 
                  key={si} 
                  className="rounded-full text-[10px] py-1 px-3 bg-blue-900/20 border-blue-800/30 text-blue-300 flex items-center gap-1.5 font-medium"
                >
                  {s.type === 'web' ? <Globe className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                  {s.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 px-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <span>{message.time}</span>
          {message.searchStatus && (
            <span className="text-red-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {message.searchStatus}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingIndicator = ({ status }: { status: string }) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center animate-pulse">
      <Bot className="w-5 h-5 text-white" />
    </div>
    <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-gray-800/50 p-5 rounded-2xl rounded-tl-md backdrop-blur-sm min-w-[200px] flex items-center gap-4">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
      <span className="text-sm font-medium text-gray-300">{status}</span>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const Search = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historySidebarExpanded, setHistorySidebarExpanded] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  /* ─── Effects ─────────────────────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  /* ─── Handlers ────────────────────────────────────────────────── */
  const startNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "Nova Consulta Analítica",
      messages: [],
      date: new Date().toLocaleDateString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInput("");
    setSidebarOpen(false);
    toast.success("Nova sessão iniciada com sucesso");
  }, []);

  const deleteHistory = useCallback(() => {
    if (window.confirm("Confirma a eliminação permanente de todo o histórico de consultas?")) {
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
      toast.error("Histórico eliminado permanentemente");
    }
  }, []);

  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Confirma a eliminação desta sessão de consulta?")) {
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        if (filtered.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
        }
        return filtered;
      });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions[0]?.id || null);
      }
      toast.success("Sessão eliminada com sucesso");
    }
  }, [currentSessionId, sessions]);

  const send = useCallback(async (text?: string, searchType?: string) => {
    const term = (text ?? input).trim();
    if (!term || loading) return;

    let sessionId = currentSessionId;
    
    if (!sessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: term.substring(0, 50),
        messages: [],
        date: new Date().toLocaleDateString()
      };
      setSessions([newSession]);
      setCurrentSessionId(newId);
      sessionId = newId;
    }

    setLoading(true);
    setSearchStatus("Processando consulta através de múltiplas fontes...");
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: term,
      charts: [],
      sources: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMsg],
            title: s.messages.length === 0 ? term.substring(0, 50) : s.title 
          } 
        : s
    ));

    try {
      setSearchStatus("Consultando base de dados corporativa...");
      
      const backendResponse = await searchPetroleumData(term, searchType);
      
      setSearchStatus("Sintetizando análise estratégica...");
      
      const formattedResponse = formatBackendResponse(backendResponse, term);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formattedResponse.content,
        charts: formattedResponse.charts,
        sources: formattedResponse.sources,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        searchStatus: "Verificado",
        rawResults: backendResponse.results,
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, aiMsg] } 
          : s
      ));
      
      toast.success(`${backendResponse.count} resultados encontrados`);
      
    } catch (error) {
      console.error("[Search Error]", error);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `### Erro na Consulta\n\nOcorreu um erro ao processar a sua consulta. Por favor, verifique:\n\n* A configuração do backend está correta\n* As credenciais do Supabase estão válidas\n* A edge function está implementada\n\n**Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        charts: [],
        sources: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, errorMsg] } 
          : s
      ));
      
      toast.error("Erro ao processar consulta");
    } finally {
      setLoading(false);
      setSearchStatus("");
    }
  }, [input, loading, currentSessionId]);

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      <Sidebar activeItem="/search" />

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 lg:hidden w-14 h-14 rounded-full bg-gradient-to-br from-red-800 to-red-600 text-white shadow-2xl shadow-red-900/50 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0, width: historySidebarExpanded ? 320 : 80 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col border-r border-gray-800 bg-gradient-to-b from-gray-900 to-black shadow-2xl lg:shadow-none"
          >
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10"
              />
            )}

            <motion.button
              onClick={() => setHistorySidebarExpanded(!historySidebarExpanded)}
              className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-gradient-to-br from-red-800 to-red-600 text-white shadow-lg items-center justify-center hover:scale-110 transition-transform"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div animate={{ rotate: historySidebarExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <div className="p-6 space-y-4 pt-24 lg:pt-6">
              <AnimatePresence mode="wait">
                {historySidebarExpanded ? (
                  <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <Button onClick={startNewChat} className="w-full rounded-xl gap-2 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-900/50 transition-all duration-300">
                      <Plus className="w-4 h-4" /> Nova Consulta
                    </Button>
                    <div className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                      <span className="flex items-center gap-2"><History className="w-3 h-3" /> Histórico de Sessões</span>
                      <button onClick={deleteHistory} className="hover:text-red-500 transition-colors" title="Eliminar todo histórico">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                    <Button onClick={startNewChat} size="icon" className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white shadow-lg shadow-red-900/50" title="Nova Consulta">
                      <Plus className="w-5 h-5" />
                    </Button>
                    <div className="w-8 h-px bg-gray-800" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ScrollArea.Root className="flex-1 overflow-hidden">
              <ScrollArea.Viewport className="w-full h-full px-4">
                <div className="space-y-2 pb-6">
                  {sessions.length === 0 ? (
                    <AnimatePresence mode="wait">
                      {historySidebarExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 text-gray-600 text-sm">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma sessão registada</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        className={`group relative rounded-xl transition-all ${
                          currentSessionId === session.id 
                            ? 'bg-gradient-to-r from-red-900/20 to-blue-900/20 border border-red-800/30' 
                            : 'hover:bg-gray-800/50 border border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setCurrentSessionId(session.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full p-3 text-left text-sm flex items-center gap-3 ${!historySidebarExpanded && 'justify-center'}`}
                          title={!historySidebarExpanded ? session.title : undefined}
                        >
                          <MessageSquare className={`flex-shrink-0 ${historySidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} ${currentSessionId === session.id ? 'text-white' : 'text-gray-400'}`} />
                          
                          <AnimatePresence mode="wait">
                            {historySidebarExpanded && (
                              <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-3 flex-1 min-w-0"
                              >
                                <span className={`truncate flex-1 font-medium ${currentSessionId === session.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                  {session.title}
                                </span>
                                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${currentSessionId === session.id ? 'text-white' : 'text-gray-400'}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                        
                        <AnimatePresence>
                          {historySidebarExpanded && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={(e) => deleteSession(session.id, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-gray-400 hover:text-red-500 hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                              title="Eliminar sessão"
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" className="w-2 bg-gray-900">
                <ScrollArea.Thumb className="bg-gray-700 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/search" />

        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full px-4 py-8 lg:px-8 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              {(!currentSession || currentSession.messages.length === 0) ? (
                <WelcomeScreen onQuickAction={send} />
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-8 pb-40">
                  {currentSession.messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {loading && <LoadingIndicator status={searchStatus} />}
                  <div ref={chatBottomRef} className="h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center bg-gradient-to-r from-gray-900 to-black border border-gray-800 hover:border-red-800/40 rounded-2xl shadow-2xl overflow-hidden p-2 transition-all duration-300">
                <div className="pl-4">
                  <SearchIcon className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base px-4 py-4 placeholder:text-gray-600 text-white focus:outline-none font-light"
                  placeholder="Descreva a sua consulta analítica ou solicite informações estratégicas..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  disabled={loading}
                />
                <Button 
                  size="icon" 
                  className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 shadow-lg shadow-red-900/50 transition-all duration-300 disabled:opacity-50" 
                  onClick={() => send()} 
                  disabled={loading || !input.trim()}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>
    </div>
  );
};

export default Search;