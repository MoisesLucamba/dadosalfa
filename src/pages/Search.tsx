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
  AlertCircle,
  ChevronLeft,
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
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════════════════ */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: string[];
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Qual o preço atual do Brent Crude Oil?",
    icon: TrendingUp,
    gradient: "from-primary/20 to-primary/10",
    category: "Mercado",
  },
  {
    label: "Relatório de produção mensal da TotalEnergies",
    icon: BarChart3,
    gradient: "from-accent/20 to-accent/10",
    category: "Produção",
  },
  {
    label: "Principais destinos de exportação de Angola",
    icon: Ship,
    gradient: "from-primary/20 to-primary/10",
    category: "Exportações",
  },
  {
    label: "Previsões estratégicas para 2026",
    icon: Target,
    gradient: "from-accent/20 to-accent/10",
    category: "Previsões",
  },
  {
    label: "Alertas de riscos operacionais ativos",
    icon: AlertCircle,
    gradient: "from-destructive/20 to-destructive/10",
    category: "Riscos",
  },
  {
    label: "Análise geopolítica e impactos no mercado",
    icon: Shield,
    gradient: "from-primary/20 to-primary/10",
    category: "Geopolítica",
  },
];

const STORAGE_KEY = "alphadata_chat_sessions";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-chat`;

/* ═══════════════════════════════════════════════════════════════════════════
   STREAMING CHAT FUNCTION
   ═══════════════════════════════════════════════════════════════════════════ */

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, includeDatabase: true }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    if (resp.status === 429) {
      throw new Error(errorData.error || "Limite de requisições excedido. Aguarde alguns segundos.");
    }
    if (resp.status === 402) {
      throw new Error(errorData.error || "Créditos insuficientes.");
    }
    throw new Error(errorData.error || "Erro ao conectar com o assistente IA");
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const WelcomeScreen = ({ onQuickAction }: { onQuickAction: (label: string) => void }) => (
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
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-foreground text-sm font-medium backdrop-blur-sm"
      >
        <Cpu className="w-5 h-5 text-primary" />
        <span>Sistema de Inteligência Analítica Empresarial</span>
      </motion.div>
      
      <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
        <span className="text-foreground">Plataforma de </span>
        <span className="text-gradient-primary">
          Business Intelligence
        </span>
      </h1>
      
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-light">
        Análise de dados em tempo real, processamento de linguagem natural e insights estratégicos baseados em inteligência artificial avançada.
      </p>
    </div>

    <div className="w-full max-w-6xl px-4">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Consultas Sugeridas</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.03 }}
            onClick={() => onQuickAction(action.label)}
            className="group relative p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 overflow-hidden text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{action.category}</span>
              </div>
              <span className="font-medium text-foreground text-sm leading-snug">{action.label}</span>
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
          ? 'bg-primary' 
          : 'bg-accent'
      }`}>
        {isUser ? <User className="w-5 h-5 text-primary-foreground" /> : <Bot className="w-5 h-5 text-accent-foreground" />}
      </div>

      <div className={`flex flex-col space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
          isUser 
            ? 'bg-primary/10 border-primary/20 rounded-tr-md' 
            : 'bg-card border-border rounded-tl-md'
        }`}>
          {isUser ? (
            <p className="text-foreground">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-foreground mb-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
              {message.sources.map((s, si) => (
                <Badge 
                  key={si} 
                  variant="secondary"
                  className="rounded-full text-[10px] py-1 px-3 flex items-center gap-1.5 font-medium"
                >
                  <Database className="w-3 h-3" />
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>{message.time}</span>
          {!isUser && (
            <span className="text-primary flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verificado
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center animate-pulse">
      <Bot className="w-5 h-5 text-accent-foreground" />
    </div>
    <div className="bg-card border border-border p-5 rounded-2xl rounded-tl-md backdrop-blur-sm min-w-[200px] flex items-center gap-4">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">A processar consulta...</span>
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
      title: "Nova Consulta",
      messages: [],
      date: new Date().toLocaleDateString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInput("");
    setSidebarOpen(false);
    toast.success("Nova sessão iniciada");
  }, []);

  const deleteHistory = useCallback(() => {
    if (window.confirm("Confirma a eliminação de todo o histórico?")) {
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
      toast.error("Histórico eliminado");
    }
  }, []);

  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Eliminar esta sessão?")) {
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
      toast.success("Sessão eliminada");
    }
  }, [currentSessionId, sessions]);

  const send = useCallback(async (text?: string) => {
    const term = (text ?? input).trim();
    if (!term || loading) return;

    let sessionId = currentSessionId;
    
    // Create new session if needed
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
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: term,
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
      // Prepare messages for AI
      const currentMessages = sessions.find(s => s.id === sessionId)?.messages || [];
      const aiMessages = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: term }
      ];

      let assistantContent = "";
      
      // Stream the response
      await streamChat({
        messages: aiMessages,
        onDelta: (chunk) => {
          assistantContent += chunk;
          
          // Update the assistant message in real-time
          setSessions(prev => {
            return prev.map(s => {
              if (s.id !== sessionId) return s;
              
              const msgs = [...s.messages];
              const lastMsg = msgs[msgs.length - 1];
              
              if (lastMsg?.role === "assistant") {
                msgs[msgs.length - 1] = { ...lastMsg, content: assistantContent };
              } else {
                msgs.push({
                  id: (Date.now() + 1).toString(),
                  role: "assistant",
                  content: assistantContent,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sources: ["Base de Dados Corporativa"]
                });
              }
              
              return { ...s, messages: msgs };
            });
          });
        },
        onDone: () => {
          setLoading(false);
        },
      });
      
    } catch (error) {
      console.error("[Search Error]", error);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `### ❌ Erro na Consulta\n\n${error instanceof Error ? error.message : "Ocorreu um erro desconhecido. Por favor, tente novamente."}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, errorMsg] } 
          : s
      ));
      
      toast.error("Erro ao processar consulta");
      setLoading(false);
    }
  }, [input, loading, currentSessionId, sessions]);

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar activeItem="/search" />

      {/* Mobile Menu Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 lg:hidden w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center"
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

      {/* History Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0, width: historySidebarExpanded ? 320 : 80 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card shadow-2xl lg:shadow-none"
          >
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm lg:hidden -z-10"
              />
            )}

            <motion.button
              onClick={() => setHistorySidebarExpanded(!historySidebarExpanded)}
              className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg items-center justify-center hover:scale-110 transition-transform"
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
                    <Button onClick={startNewChat} className="w-full rounded-xl gap-2 font-semibold shadow-lg transition-all duration-300">
                      <Plus className="w-4 h-4" /> Nova Consulta
                    </Button>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                      <span className="flex items-center gap-2"><History className="w-3 h-3" /> Histórico</span>
                      <button onClick={deleteHistory} className="hover:text-destructive transition-colors" title="Eliminar histórico">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                    <Button onClick={startNewChat} size="icon" className="w-12 h-12 rounded-xl shadow-lg" title="Nova Consulta">
                      <Plus className="w-5 h-5" />
                    </Button>
                    <div className="w-8 h-px bg-border" />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 text-muted-foreground text-sm">
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
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted border border-transparent'
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
                          <MessageSquare className={`flex-shrink-0 ${historySidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} ${currentSessionId === session.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          
                          <AnimatePresence mode="wait">
                            {historySidebarExpanded && (
                              <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-3 flex-1 min-w-0"
                              >
                                <span className={`truncate flex-1 font-medium ${currentSessionId === session.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                  {session.title}
                                </span>
                                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${currentSessionId === session.id ? 'text-primary' : 'text-muted-foreground'}`} />
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
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
              <ScrollArea.Scrollbar orientation="vertical" className="w-2 bg-muted/50">
                <ScrollArea.Thumb className="bg-muted-foreground/30 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/search" />

        <main className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
          <div className="max-w-5xl mx-auto w-full px-4 py-8 lg:px-8 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              {(!currentSession || currentSession.messages.length === 0) ? (
                <WelcomeScreen onQuickAction={send} />
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-8 pb-40">
                  {currentSession.messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  {loading && <LoadingIndicator />}
                  <div ref={chatBottomRef} className="h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center bg-card border border-border hover:border-primary/40 rounded-2xl shadow-2xl overflow-hidden p-2 transition-all duration-300">
                <div className="pl-4">
                  <SearchIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <input 
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base px-4 py-4 placeholder:text-muted-foreground text-foreground focus:outline-none font-light"
                  placeholder="Pergunte sobre produção, preços, exportações, riscos..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  disabled={loading}
                />
                <Button 
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="w-12 h-12 rounded-xl mr-1 transition-all duration-300"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Conectado à <span className="text-primary font-medium">Base de Dados AlphaData</span> • 
              Powered by <span className="text-primary font-medium">Lovable AI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
