import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as ScrollArea from "@radix-ui/react-scroll-area";
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
  Target,
  Flame,
  Droplets,
  Zap,
  Activity,
  TrendingDown,
  Brain,
  Edit2,
  Download,
  Maximize2,
  RefreshCw,
  Table2,
  Settings2,
  FileText,
  ExternalLink,
  Beaker,
  Bell,
  BarChart2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChartData {
  type: "area" | "bar" | "line" | "pie" | "radar" | "composed";
  title: string;
  unit?: string;
  data: Record<string, string | number>[];
  dataKeys: { key: string; color: string; type?: "bar" | "line" | "area" }[];
  xKey: string;
  referenceLines?: { y: number; label: string; color?: string }[];
  referenceAreas?: { y1: number; y2: number; fill?: string }[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: string[];
  charts?: ChartData[];
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
  category: string;
  accent: string;
}

interface ConversationContext {
  lastMentionedBlock: string | null;
  lastMentionedOperator: string | null;
  lastMentionedWell: string | null;
  lastMentionedMetric: string | null;
  lastMentionedPeriod: string | null;
  lastChartType: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORIZED_SUGGESTIONS: { category: string; emoji: string; questions: string[] }[] = [
  {
    category: "Produção",
    emoji: "🛢",
    questions: [
      "Qual é a produção actual de Angola?",
      "Compare Bloco 17 vs Bloco 32",
      "Evolução da produção nos últimos 2 anos",
    ],
  },
  {
    category: "Mercado",
    emoji: "📈",
    questions: [
      "Previsão do Brent para os próximos 90 dias",
      "Principais destinos de exportação Angola",
      "Impacto da saída da OPEP na receita",
    ],
  },
  {
    category: "Risco",
    emoji: "⚠️",
    questions: [
      "Qual o risco actual do Bloco 17?",
      "Eventos geopolíticos que afectam Angola",
      "Análise regulatória ANPG 2025",
    ],
  },
  {
    category: "Poços",
    emoji: "🔬",
    questions: [
      "Estado actual do Girassol-4",
      "Comparar performance Dalia-7 vs CLOV-E1",
      "Previsão de produção Kaombo Norte-2",
    ],
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Qual o preço atual do Brent Crude Oil?", icon: TrendingUp, category: "Mercado", accent: "#dc2626" },
  { label: "Relatório de produção mensal da TotalEnergies", icon: BarChart3, category: "Produção", accent: "#1e3a5f" },
  { label: "Principais destinos de exportação de Angola", icon: Ship, category: "Exportações", accent: "#dc2626" },
  { label: "Previsões estratégicas para 2026", icon: Target, category: "Previsões", accent: "#1e3a5f" },
  { label: "Alertas de riscos operacionais ativos", icon: AlertCircle, category: "Riscos", accent: "#dc2626" },
  { label: "Análise geopolítica e impactos no mercado", icon: Shield, category: "Geopolítica", accent: "#1e3a5f" },
];

const STORAGE_KEY = "alphadata_chat_sessions";
const CONTEXT_KEY = "alphadata_ai_context";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-chat`;

const CHART_COLORS = ["#00A3FF", "#00D4AA", "#F5A623", "#FF6B35", "#A78BFA", "#E8EDF5"];
const BLOCK_COLORS: Record<string, string> = {
  "Bloco 17": "#00A3FF", "Bloco 32": "#00D4AA", "Bloco 15": "#F5A623",
  "Bloco 0": "#FF6B35", "Bloco 18": "#A78BFA", "Bloco 31": "#E8EDF5",
};

const UNCERTAINTY_PHRASES = [
  "não tenho dados", "informação limitada", "não disponível", "fora do escopo",
  "não consigo confirmar", "estimativa", "aproximadamente", "dados incompletos",
  "não possuo informação", "não foi possível", "dados insuficientes",
  "i don't have", "no data available", "limited information",
];

const BLOCKS = ["Bloco 0", "Bloco 15", "Bloco 17", "Bloco 18", "Bloco 31", "Bloco 32"];
const OPERATORS = ["TotalEnergies", "BP", "ExxonMobil", "Chevron", "ENI Angola", "Sonangol", "Eni", "Azule Energy", "Galp", "Equinor"];
const WELLS = ["Girassol", "Dalia", "Pazflor", "CLOV", "Kaombo", "Kissanje", "Girassol-4", "Dalia-7", "Kaombo Norte-2", "CLOV-E1"];
const METRICS = ["produção", "pressão", "risco", "exportação", "preço", "production", "pressure", "risk", "export", "price"];

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXT PARSER
   ═══════════════════════════════════════════════════════════════════════════ */

function parseContextFromText(text: string): Partial<ConversationContext> {
  const ctx: Partial<ConversationContext> = {};
  const lower = text.toLowerCase();

  for (const b of BLOCKS) {
    if (lower.includes(b.toLowerCase())) { ctx.lastMentionedBlock = b; break; }
  }
  for (const op of OPERATORS) {
    if (lower.includes(op.toLowerCase())) { ctx.lastMentionedOperator = op; break; }
  }
  for (const w of WELLS) {
    if (lower.includes(w.toLowerCase())) { ctx.lastMentionedWell = w; break; }
  }
  for (const m of METRICS) {
    if (lower.includes(m)) { ctx.lastMentionedMetric = m; break; }
  }

  // Periods
  const periodPatterns = [
    /último\s+(trimestre|mês|ano|semestre)/i,
    /Q[1-4]\s*\d{4}/i,
    /\d{4}/,
    /últimos?\s+\d+\s+(dias|meses|anos)/i,
  ];
  for (const p of periodPatterns) {
    const match = text.match(p);
    if (match) { ctx.lastMentionedPeriod = match[0]; break; }
  }

  return ctx;
}

function buildContextPrefix(ctx: ConversationContext): string {
  const parts: string[] = [];
  if (ctx.lastMentionedBlock) parts.push(`Último bloco mencionado: ${ctx.lastMentionedBlock}`);
  if (ctx.lastMentionedOperator) parts.push(`Última operadora: ${ctx.lastMentionedOperator}`);
  if (ctx.lastMentionedWell) parts.push(`Último poço: ${ctx.lastMentionedWell}`);
  if (ctx.lastMentionedMetric) parts.push(`Última métrica: ${ctx.lastMentionedMetric}`);
  if (ctx.lastMentionedPeriod) parts.push(`Período de referência: ${ctx.lastMentionedPeriod}`);
  if (parts.length === 0) return "";
  return `\n\nContexto da conversa anterior:\n${parts.join("\n")}\n\nSe a pergunta do utilizador usar pronomes ou referências implícitas (ex: 'E para esse?', 'E no mesmo período?', 'Compara com o outro'), interpreta com base no contexto acima.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOLLOW-UP SUGGESTION GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

function generateFollowUpSuggestions(response: string, ctx: ConversationContext): string[] {
  const suggestions: string[] = [];
  const lower = response.toLowerCase();

  if (ctx.lastMentionedBlock) {
    const otherBlocks = BLOCKS.filter(b => b !== ctx.lastMentionedBlock);
    const random = otherBlocks[Math.floor(Math.random() * otherBlocks.length)];
    suggestions.push(`E para o ${random}?`);
  }

  if (lower.includes("produção") || lower.includes("production")) {
    suggestions.push(ctx.lastMentionedBlock
      ? `Qual a taxa de declínio do ${ctx.lastMentionedBlock}?`
      : "Qual a tendência de produção para 2026?");
  }

  if (lower.includes("preço") || lower.includes("brent") || lower.includes("price")) {
    suggestions.push("Quais as previsões para o próximo trimestre?");
  }

  if (lower.includes("risco") || lower.includes("risk")) {
    suggestions.push("Quais os principais factores de mitigação?");
  }

  if (lower.includes("exporta") || lower.includes("export")) {
    suggestions.push("Qual o volume total exportado este ano?");
  }

  if (suggestions.length < 3) {
    const fallbacks = [
      "Gera um relatório executivo sobre este tema",
      "Mostra a evolução nos últimos 12 meses",
      "Compara com a média do sector",
    ];
    while (suggestions.length < 3 && fallbacks.length > 0) {
      suggestions.push(fallbacks.shift()!);
    }
  }

  return suggestions.slice(0, 3);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTION SUGGESTION GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

function generateActionSuggestions(response: string, ctx: ConversationContext): { label: string; icon: React.ElementType; path: string }[] {
  const actions: { label: string; icon: React.ElementType; path: string }[] = [];
  const lower = response.toLowerCase();

  if (lower.includes("risco") || lower.includes("geopolít") || lower.includes("risk")) {
    actions.push({ label: "Abrir Índice de Risco", icon: Shield, path: "/risk" });
  }
  if (lower.includes("produção") || lower.includes("production") || lower.includes("bbl/d") || lower.includes("barr")) {
    actions.push({ label: "Ver Dashboard de Produção", icon: BarChart3, path: "/production" });
  }
  if (ctx.lastMentionedWell) {
    actions.push({ label: `Simular Poço ${ctx.lastMentionedWell}`, icon: Beaker, path: "/well-simulation" });
  }
  if (lower.includes("preço") || lower.includes("volatil") || lower.includes("brent") || lower.includes("price")) {
    actions.push({ label: "Criar Alerta de Preço", icon: Bell, path: "/alerts" });
  }
  if (lower.includes("previsão") || lower.includes("forecast") || lower.includes("predict")) {
    actions.push({ label: "Exportar Previsão como PDF", icon: FileText, path: "/reports" });
  }
  if (lower.includes("exporta") || lower.includes("destino")) {
    actions.push({ label: "Ver Mapa de Exportações", icon: Globe, path: "/exports" });
  }

  return actions.slice(0, 4);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIMITATION DETECTOR
   ═══════════════════════════════════════════════════════════════════════════ */

function detectLimitations(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of UNCERTAINTY_PHRASES) {
    if (lower.includes(phrase)) {
      return "Os dados apresentados podem estar incompletos ou baseados em estimativas. Consulte fontes oficiais para informação actualizada.";
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTO CHART GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

function generateChartsForQuery(query: string): ChartData[] {
  const q = query.toLowerCase();

  if (q.includes("brent") || q.includes("preço") && (q.includes("petróleo") || q.includes("crude") || q.includes("oil") || q.includes("wti"))) {
    return [
      {
        type: "composed" as const,
        title: "Brent Crude — Evolução do Preço (USD/bbl)",
        unit: "USD/bbl",
        xKey: "mes",
        dataKeys: [
          { key: "brent", color: "#F5A623", type: "area" as const },
          { key: "wti", color: "#00A3FF", type: "line" as const },
        ],
        referenceLines: [{ y: 80, label: "Equilíbrio fiscal Angola", color: "rgba(255,255,255,0.20)" }],
        data: [
          { mes: "Ago", brent: 84.2, wti: 81.1 },
          { mes: "Set", brent: 88.6, wti: 85.4 },
          { mes: "Out", brent: 91.3, wti: 88.0 },
          { mes: "Nov", brent: 86.7, wti: 83.5 },
          { mes: "Dez", brent: 79.4, wti: 76.2 },
          { mes: "Jan", brent: 82.1, wti: 78.9 },
          { mes: "Fev", brent: 85.5, wti: 82.3 },
        ],
      },
    ];
  }

  if (
    q.includes("produção") || q.includes("totalenergies") || q.includes("sonangol") ||
    q.includes("chevron") || q.includes("bp ") || q.includes("barris") || q.includes("produção por")
  ) {
    return [
      {
        type: "area",
        title: "Produção de Petróleo — Angola (bbl/dia)",
        unit: "bbl/d",
        xKey: "mes",
        dataKeys: [
          { key: "producao", color: "#00A3FF" },
          { key: "meta", color: "#00D4AA" },
        ],
        data: [
          { mes: "Jan", producao: 1142000, meta: 1180000 },
          { mes: "Fev", producao: 1155000, meta: 1180000 },
          { mes: "Mar", producao: 1163000, meta: 1190000 },
          { mes: "Abr", producao: 1178000, meta: 1200000 },
          { mes: "Mai", producao: 1195000, meta: 1200000 },
          { mes: "Jun", producao: 1210000, meta: 1220000 },
          { mes: "Jul", producao: 1198000, meta: 1220000 },
        ],
      },
      {
        type: "bar",
        title: "Produção por Operador (bbl/dia — 2024)",
        unit: "bbl/d",
        xKey: "operador",
        dataKeys: [{ key: "producao", color: "#00A3FF" }],
        data: [
          { operador: "TotalEnergies", producao: 312450 },
          { operador: "Chevron", producao: 285200 },
          { operador: "BP", producao: 214100 },
          { operador: "ExxonMobil", producao: 196800 },
          { operador: "Eni", producao: 143500 },
          { operador: "Outros", producao: 68300 },
        ],
      },
    ];
  }

  if (q.includes("exporta") || q.includes("destinos") || q.includes("china") || q.includes("índia") || q.includes("mercado") || q.includes("quota") || q.includes("distribuição")) {
    return [
      {
        type: "pie",
        title: "Destinos de Exportação de Petróleo — Angola (2024)",
        unit: "%",
        xKey: "pais",
        dataKeys: [{ key: "percentagem", color: "#dc2626" }],
        data: [
          { pais: "China", percentagem: 68 },
          { pais: "Índia", percentagem: 11 },
          { pais: "Europa", percentagem: 9 },
          { pais: "EUA", percentagem: 6 },
          { pais: "Outros", percentagem: 6 },
        ],
      },
      {
        type: "bar",
        title: "Volume de Exportação por Trimestre (Mbbl)",
        unit: "Mbbl",
        xKey: "trimestre",
        dataKeys: [
          { key: "volume", color: "#1e3a5f" },
          { key: "receita_bi", color: "#dc2626" },
        ],
        data: [
          { trimestre: "Q1 2024", volume: 98, receita_bi: 8.2 },
          { trimestre: "Q2 2024", volume: 105, receita_bi: 9.1 },
          { trimestre: "Q3 2024", volume: 112, receita_bi: 9.8 },
          { trimestre: "Q4 2024", volume: 108, receita_bi: 8.9 },
        ],
      },
    ];
  }

  if (q.includes("previsão") || q.includes("previsoes") || q.includes("2025") || q.includes("2026") || q.includes("estratég") || q.includes("forecast")) {
    return [
      {
        type: "line",
        title: "Previsão de Preço do Brent — 2025/2026 (USD/bbl)",
        unit: "USD",
        xKey: "periodo",
        dataKeys: [
          { key: "otimista", color: "#22c55e" },
          { key: "base", color: "#dc2626" },
          { key: "pessimista", color: "#ef4444" },
        ],
        data: [
          { periodo: "Q1'25", otimista: 90, base: 82, pessimista: 72 },
          { periodo: "Q2'25", otimista: 93, base: 85, pessimista: 70 },
          { periodo: "Q3'25", otimista: 95, base: 86, pessimista: 68 },
          { periodo: "Q4'25", otimista: 97, base: 88, pessimista: 71 },
          { periodo: "Q1'26", otimista: 100, base: 90, pessimista: 74 },
          { periodo: "Q2'26", otimista: 102, base: 91, pessimista: 76 },
        ],
      },
      {
        type: "bar",
        title: "Investimento Previsto em E&P — Angola (MUSD)",
        unit: "MUSD",
        xKey: "ano",
        dataKeys: [
          { key: "upstream", color: "#dc2626" },
          { key: "infraestrutura", color: "#1e3a5f" },
        ],
        data: [
          { ano: "2023", upstream: 4200, infraestrutura: 1100 },
          { ano: "2024", upstream: 4800, infraestrutura: 1350 },
          { ano: "2025P", upstream: 5400, infraestrutura: 1600 },
          { ano: "2026P", upstream: 6100, infraestrutura: 1900 },
        ],
      },
    ];
  }

  if (q.includes("risco") || q.includes("alerta") || q.includes("operacional") || q.includes("segurança")) {
    return [
      {
        type: "radar" as const,
        title: "Perfil de Risco Multidimensional — Angola",
        unit: "score",
        xKey: "dimension",
        dataKeys: [{ key: "score", color: "#FF6B35" }],
        data: [
          { dimension: "Político", score: 62 },
          { dimension: "Regulatório", score: 45 },
          { dimension: "Operacional", score: 58 },
          { dimension: "Mercado", score: 71 },
          { dimension: "Geopolítico", score: 67 },
          { dimension: "Ambiental", score: 39 },
        ],
      },
      {
        type: "bar" as const,
        title: "Alertas de Risco por Categoria (Últimos 30 dias)",
        unit: "ocorrências",
        xKey: "categoria",
        dataKeys: [{ key: "alertas", color: "#FF6B35" }],
        data: [
          { categoria: "Geopolítico", alertas: 8 },
          { categoria: "Equipamento", alertas: 14 },
          { categoria: "Clima", alertas: 5 },
          { categoria: "Regulatório", alertas: 6 },
          { categoria: "Logística", alertas: 9 },
          { categoria: "Cibersegurança", alertas: 3 },
        ],
      },
    ];
  }

  if (q.includes("geopolítica") || q.includes("geopolitica") || q.includes("impacto") || q.includes("opep") || q.includes("opec")) {
    return [
      {
        type: "area",
        title: "Impacto Geopolítico no Preço do Brent — 2024 (USD/bbl)",
        unit: "USD",
        xKey: "evento",
        dataKeys: [{ key: "preco", color: "#dc2626" }],
        data: [
          { evento: "Jan", preco: 78 },
          { evento: "Fev", preco: 82 },
          { evento: "Mar", preco: 86 },
          { evento: "Abr", preco: 91 },
          { evento: "Mai", preco: 84 },
          { evento: "Jun", preco: 85 },
          { evento: "Jul", preco: 87 },
          { evento: "Ago", preco: 79 },
        ],
      },
      {
        type: "pie",
        title: "Produção OPEP+ por Região (2024)",
        unit: "%",
        xKey: "regiao",
        dataKeys: [{ key: "quota", color: "#dc2626" }],
        data: [
          { regiao: "Golfo Pérsico", quota: 48 },
          { regiao: "África", quota: 18 },
          { regiao: "Rússia/CEI", quota: 22 },
          { regiao: "América Latina", quota: 8 },
          { regiao: "Outros", quota: 4 },
        ],
      },
    ];
  }

  // Comparisons
  if (q.includes("comparar") || q.includes("compare") || q.includes(" vs ")) {
    return [{
      type: "bar",
      title: "Comparação de Produção por Bloco (Mbbl/dia)",
      unit: "Mbbl/d",
      xKey: "bloco",
      dataKeys: [{ key: "producao", color: "#dc2626" }, { key: "capacidade", color: "#3b82f6" }],
      data: [
        { bloco: "Bloco 17", producao: 312, capacidade: 350 },
        { bloco: "Bloco 15", producao: 178, capacidade: 220 },
        { bloco: "Bloco 32", producao: 167, capacidade: 200 },
        { bloco: "Bloco 0", producao: 91, capacidade: 120 },
        { bloco: "Bloco 18", producao: 68, capacidade: 85 },
      ],
    }];
  }

  // Historical / evolution
  if (q.includes("evolução") || q.includes("histórico") || q.includes("tendência")) {
    return [{
      type: "area",
      title: "Evolução Histórica (Últimos 12 Meses)",
      unit: "Mbbl/d",
      xKey: "mes",
      dataKeys: [{ key: "valor", color: "#dc2626" }],
      data: [
        { mes: "Mar'25", valor: 1142 }, { mes: "Abr'25", valor: 1155 },
        { mes: "Mai'25", valor: 1163 }, { mes: "Jun'25", valor: 1178 },
        { mes: "Jul'25", valor: 1195 }, { mes: "Ago'25", valor: 1210 },
        { mes: "Set'25", valor: 1198 }, { mes: "Out'25", valor: 1185 },
        { mes: "Nov'25", valor: 1202 }, { mes: "Dez'25", valor: 1215 },
        { mes: "Jan'26", valor: 1220 }, { mes: "Fev'26", valor: 1228 },
      ],
    }];
  }

  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   STREAMING
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
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, includeDatabase: true }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    if (resp.status === 429) throw new Error(errorData.error || "Limite de requisições excedido.");
    if (resp.status === 402) throw new Error(errorData.error || "Créditos insuficientes.");
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
      if (jsonStr === "[DONE]") { streamDone = true; break; }
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
  onDone();
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHART RENDERER (with toolbar)
   ═══════════════════════════════════════════════════════════════════════════ */

const ChartRenderer = ({ chart, onDrillDown }: { chart: ChartData; onDrillDown?: (entity: string) => void }) => {
  const [showData, setShowData] = useState(false);
  const [chartType, setChartType] = useState(chart.type);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "#0D1117",
        border: "1px solid rgba(0,163,255,0.20)",
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <p style={{ color: "#6B7A99", marginBottom: 6, fontSize: 10, fontWeight: 500 }}>{label}</p>
        {payload.map((p: any, i: number) => {
          const prevValue = i > 0 ? payload[i-1]?.value : null;
          const change = prevValue && typeof p.value === "number" && typeof prevValue === "number" 
            ? ((p.value - prevValue) / prevValue * 100) : null;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 2 }}>
              <span style={{ color: p.color, fontSize: 11, fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: "#E8EDF5", fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
                {chart.unit ? ` ${chart.unit}` : ""}
              </span>
            </div>
          );
        })}
        {onDrillDown && (
          <button
            onClick={() => onDrillDown(String(label))}
            className="mt-2 text-[10px] px-2 py-1 rounded bg-[#00A3FF]/10 text-[#00A3FF] hover:bg-[#00A3FF]/20 transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Ver detalhe →
          </button>
        )}
      </div>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload?.length || payload.length < 2) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingBottom: 8 }}>
        {payload.map((entry: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B7A99" }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const type = chartType;
    if (type === "area") {
      return (
        <AreaChart data={chart.data}>
          <defs>
            {chart.dataKeys.map((dk, i) => (
              <linearGradient key={dk.key} id={`grad-${chart.title}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dk.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey={chart.xKey} tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} width={52}
            tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {chart.dataKeys.map((dk, i) => (
            <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} fill={`url(#grad-${chart.title}-${i})`} dot={{ fill: dk.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: dk.color, stroke: dk.color, strokeWidth: 2 }} />
          ))}
        </AreaChart>
      );
    }
    if (type === "bar") {
      return (
        <BarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey={chart.xKey} tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} width={52}
            tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {chart.dataKeys.map((dk) => (
            <Bar key={dk.key} dataKey={dk.key} name={dk.key} fill={dk.color} radius={[4, 4, 0, 0]} maxBarSize={32} />
          ))}
        </BarChart>
      );
    }
    if (type === "pie") {
      return (
        <PieChart>
          <Pie data={chart.data} dataKey={chart.dataKeys[0].key} nameKey={chart.xKey} cx="50%" cy="50%" outerRadius={82} innerRadius={55} strokeWidth={0} paddingAngle={3}>
            {chart.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B7A99" }}>{value}</span>} />
        </PieChart>
      );
    }
    if (type === "radar") {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius={75} data={chart.data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey={chart.xKey} tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
          <PolarRadiusAxis tick={{ fill: "#6B7A99", fontSize: 8 }} axisLine={false} />
          {chart.dataKeys.map((dk) => (
            <Radar key={dk.key} name={dk.key} dataKey={dk.key} stroke={dk.color} fill={dk.color} fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: dk.color }} />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </RadarChart>
      );
    }
    if (type === "composed") {
      return (
        <ComposedChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey={chart.xKey} tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {chart.referenceLines?.map((rl, i) => (
            <ReferenceLine key={i} y={rl.y} stroke={rl.color || "rgba(255,255,255,0.20)"} strokeDasharray="4 4"
              label={{ value: rl.label, fill: "#6B7A99", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", position: "insideTopRight" }} />
          ))}
          {chart.dataKeys.map((dk) => {
            if (dk.type === "bar") return <Bar key={dk.key} dataKey={dk.key} name={dk.key} fill={dk.color} fillOpacity={0.7} radius={[4, 4, 0, 0]} maxBarSize={32} />;
            if (dk.type === "area") return <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} fill={dk.color} fillOpacity={0.08} dot={{ fill: dk.color, r: 3 }} />;
            return <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} dot={{ fill: dk.color, r: 3 }} strokeDasharray={dk.type === "line" ? undefined : undefined} />;
          })}
        </ComposedChart>
      );
    }
    return (
      <LineChart data={chart.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={chart.xKey} tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {chart.dataKeys.map((dk) => (
          <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} dot={{ fill: dk.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: dk.color }} />
        ))}
      </LineChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #070d1a 0%, #0a0d14 100%)",
        border: "1px solid rgba(30,58,95,0.45)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Toolbar */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 flex-wrap">
        {[
          { icon: Table2, label: "Ver dados", onClick: () => setShowData(!showData) },
          { icon: Settings2, label: "Alterar tipo", onClick: () => setShowTypeMenu(!showTypeMenu) },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider text-[#3d5a7a] hover:text-[#60a5fa] hover:bg-[#1e3a5f]/20 transition-all"
          >
            <btn.icon className="w-3 h-3" />
            {btn.label}
          </button>
        ))}
        {showTypeMenu && (
          <div className="flex gap-1 ml-1">
            {(["bar", "line", "area", "pie"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setChartType(t); setShowTypeMenu(false); }}
                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all ${chartType === t ? "bg-[#dc2626] text-white" : "text-[#3d5a7a] hover:text-[#e2e8f0] bg-[#1e3a5f]/20"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-4 pt-1 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #dc2626, #991b1b)" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#5a8ab5", textTransform: "uppercase" }}>
            {chart.title}
          </span>
          {chart.unit && (
            <span style={{ fontSize: 9, color: "#2d4a6a", background: "rgba(30,58,95,0.25)", padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(30,58,95,0.3)" }}>
              {chart.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#dc2626", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220, padding: "0 8px 16px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Data table toggle */}
      {showData && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-4 pb-4">
          <div className="overflow-x-auto rounded-lg" style={{ background: "#0A0E1A", border: "1px solid #1E2A3A" }}>
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  {Object.keys(chart.data[0] || {}).map((k) => (
                    <th key={k} className="px-3 py-2 text-left font-bold uppercase tracking-wider" style={{ background: "#141B2D", color: "#6B7A99", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.data.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0A0E1A" : "#0D1117" }}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-1.5" style={{ color: "#E8EDF5", borderBottom: "1px solid rgba(30,58,95,0.15)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                        {typeof v === "number" ? v.toLocaleString() : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {chart.data.length > 10 && (
              <div className="px-3 py-2 text-center" style={{ color: "#6B7A99", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                ... e mais {chart.data.length - 10} registos
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B7A99" }}>Fonte: ANPG · AlphaData Analytics</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B7A99" }}>Actualizado: {new Date().toLocaleDateString("pt-PT")}</span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WELCOME SCREEN (with categorized suggestions)
   ═══════════════════════════════════════════════════════════════════════════ */

const WelcomeScreen = ({ onQuickAction }: { onQuickAction: (label: string) => void }) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-center items-center text-center py-12"
      style={{ gap: "3rem" }}
    >
      {/* Hero */}
      <div className="space-y-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
          <Flame className="w-4 h-4" style={{ color: "#ef4444" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", color: "#9bb5d6", textTransform: "uppercase" }}>Oil & Gas Intelligence Platform</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, lineHeight: 1.1 }}>
            <span style={{ display: "block", fontSize: "clamp(28px, 5vw, 48px)", color: "#e2e8f0", letterSpacing: "-0.02em" }}>OIL & GAS</span>
            <span style={{ display: "block", fontSize: "clamp(28px, 5vw, 52px)", background: "linear-gradient(135deg, #dc2626 0%, #ef4444 40%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>AI ANALYST</span>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: "#3d5a7a", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
          Análise de mercado em tempo real, inteligência preditiva e insights estratégicos para o setor energético.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-8">
          {[
            { icon: Droplets, label: "Petróleo", value: "Live" },
            { icon: Activity, label: "Mercados", value: "24/7" },
            { icon: Zap, label: "Resposta", value: "<2s" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
              </div>
              <div className="text-left">
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", fontWeight: 700, color: "#e2e8f0" }}>{stat.value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9px", color: "#2d4a6a", textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Categorized Suggestions */}
      <div className="w-full max-w-4xl px-4">
        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIZED_SUGGESTIONS.map((cat, i) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(i)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200"
              style={{
                background: activeCategory === i ? "rgba(220,38,38,0.12)" : "transparent",
                border: activeCategory === i ? "1px solid rgba(220,38,38,0.3)" : "1px solid transparent",
                color: activeCategory === i ? "#ef4444" : "#3d5a7a",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.category}</span>
            </button>
          ))}
        </div>

        {/* Questions for active category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          >
            {CATEGORIZED_SUGGESTIONS[activeCategory].questions.map((q, i) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onQuickAction(q)}
                className="group p-4 rounded-xl text-left transition-all duration-200"
                style={{ background: "#080e1a", border: "1px solid rgba(30,58,95,0.35)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.35)";
                  (e.currentTarget as HTMLElement).style.background = "#0d0f1a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.35)";
                  (e.currentTarget as HTMLElement).style.background = "#080e1a";
                }}
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", fontWeight: 500, color: "#7aa3cc", lineHeight: 1.4 }}>{q}</span>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Divider and classic quick actions */}
        <div className="flex items-center gap-3 mt-8 mb-5">
          <div className="h-[1px] flex-1" style={{ background: "rgba(30,58,95,0.35)" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", color: "#2d4a6a", textTransform: "uppercase" }}>Consultas Frequentes</span>
          <div className="h-[1px] flex-1" style={{ background: "rgba(30,58,95,0.35)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => onQuickAction(action.label)}
              className="group relative p-4 rounded-xl text-left transition-all duration-200 overflow-hidden"
              style={{ background: "#080e1a", border: "1px solid rgba(30,58,95,0.35)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.35)";
                (e.currentTarget as HTMLElement).style.background = "#0d0f1a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.35)";
                (e.currentTarget as HTMLElement).style.background = "#080e1a";
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at top right, ${action.accent}15 0%, transparent 70%)` }} />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all group-hover:scale-110"
                  style={{ background: `${action.accent}18`, border: `1px solid ${action.accent}30` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.accent === "#dc2626" ? "#ef4444" : "#60a5fa" }} />
                </div>
                <div className="min-w-0">
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em", color: action.accent === "#dc2626" ? "#ef4444" : "#3b82f6", textTransform: "uppercase", marginBottom: "4px", opacity: 0.7 }}>{action.category}</div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", fontWeight: 500, color: "#7aa3cc", lineHeight: 1.4, display: "block" }}>{action.label}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHART SKELETON
   ═══════════════════════════════════════════════════════════════════════════ */

const ChartSkeleton = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl overflow-hidden"
    style={{ background: "#070d1a", border: "1px solid rgba(30,58,95,0.3)", height: 260 }}>
    <div className="px-4 pt-4 pb-2 flex items-center gap-2">
      <div className="w-1 h-4 rounded-full bg-red-800 animate-pulse" />
      <div className="h-3 w-40 rounded bg-[#1e3a5f]/30 animate-pulse" />
    </div>
    <div className="px-4 pb-4" style={{ height: 200 }}>
      <div className="w-full h-full rounded-lg bg-[#0d1520]/50 animate-pulse flex items-end gap-2 p-4">
        {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm animate-pulse"
            style={{ height: `${h}%`, background: i % 2 === 0 ? "rgba(220,38,38,0.15)" : "rgba(30,58,95,0.2)", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-STAGE LOADING ANIMATION
   ═══════════════════════════════════════════════════════════════════════════ */

const ThinkingAnimation = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { icon: SearchIcon, text: "A consultar base de dados Angola...", color: "#3b82f6" },
    { icon: Brain, text: "A processar com modelo preditivo...", color: "#ef4444" },
    { icon: BarChart2, text: "A preparar visualização...", color: "#22c55e" },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const current = stages[stage];

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: "linear-gradient(135deg, #0f1d35, #1e3a5f)", border: "1px solid rgba(30,58,95,0.6)" }}>
        <Flame className="w-4 h-4" style={{ color: "#ef4444", animation: "pulse 2s ease-in-out infinite" }} />
      </div>
      <div className="px-5 py-4 rounded-2xl max-w-2xl"
        style={{ background: "#0D1117", border: "1px solid #1E2A3A", borderTopLeftRadius: 4 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <current.icon className="w-4 h-4 flex-shrink-0" style={{ color: current.color, animation: stage === 0 ? "spin 2s linear infinite" : stage === 1 ? "pulse 1s ease-in-out infinite" : "none" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#5a8ab5", letterSpacing: "0.03em" }}>
              {current.text}
            </span>
          </motion.div>
        </AnimatePresence>
        {/* Stage dots */}
        <div className="flex gap-1.5 mt-3">
          {stages.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i <= stage ? "#dc2626" : "rgba(30,58,95,0.4)" }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT BUBBLE (with edit, limitations, actions, follow-ups)
   ═══════════════════════════════════════════════════════════════════════════ */

const ChatBubble = ({
  message,
  isStreaming = false,
  context,
  onEdit,
  onFollowUp,
  onAction,
  onDrillDown,
}: {
  message: Message;
  isStreaming?: boolean;
  context: ConversationContext;
  onEdit?: (msgId: string, newText: string) => void;
  onFollowUp?: (question: string) => void;
  onAction?: (path: string) => void;
  onDrillDown?: (entity: string) => void;
}) => {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const showChartSkeleton = !isUser && isStreaming && message.charts && message.charts.length > 0 && message.content.length < 80;

  // Limitation detection
  const limitation = !isUser && !isStreaming ? detectLimitations(message.content) : null;

  // Action suggestions
  const actionSuggestions = !isUser && !isStreaming ? generateActionSuggestions(message.content, context) : [];

  // Follow-up suggestions
  const followUps = !isUser && !isStreaming && message.content.length > 100 ? generateFollowUpSuggestions(message.content, context) : [];

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editing]);

  const handleEditSubmit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
      setEditing(false);
      toast.info("Pergunta editada — a regenerar resposta...", { duration: 3000, position: "top-center" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
        style={isUser
          ? { background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 0 12px rgba(220,38,38,0.3)" }
          : { background: "linear-gradient(135deg, #0f1d35, #1e3a5f)", border: "1px solid rgba(30,58,95,0.6)" }
        }>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Flame className="w-4 h-4" style={{ color: "#ef4444" }} />}
      </div>

      {/* Content */}
      <div className={`flex flex-col space-y-1.5 max-w-[88%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Role label */}
        <div className="flex items-center gap-2 px-1" style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", color: isUser ? "#dc2626" : "#3b82f6", textTransform: "uppercase" }}>
            {isUser ? "Utilizador" : "AlphaData AI"}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#2d4a6a" }}>{message.time}</span>
        </div>

        {/* Bubble */}
        <div className="relative group"
          style={{ width: isUser ? undefined : "100%" }}>
          {/* Edit button for user messages */}
          {isUser && !editing && onEdit && (
            <button
              onClick={() => { setEditText(message.content); setEditing(true); }}
              className="absolute -top-1 -right-1 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              style={{ background: "#141B2D", border: "1px solid rgba(30,58,95,0.4)" }}
              title="Editar pergunta"
            >
              <Edit2 className="w-3 h-3" style={{ color: "#5a8ab5" }} />
            </button>
          )}

          <div className="px-5 py-4 rounded-2xl"
            style={isUser
              ? { background: "linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(153,27,27,0.08) 100%)", border: "1px solid rgba(220,38,38,0.2)", borderTopRightRadius: 4 }
              : { background: "#080e1a", border: "1px solid rgba(30,58,95,0.4)", borderTopLeftRadius: 4, width: "100%" }
            }>
            {isUser ? (
              editing ? (
                <div className="space-y-3">
                  <textarea
                    ref={editRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-transparent border border-[#1e3a5f] rounded-lg p-3 text-[14px] text-[#e2e8f0] focus:outline-none focus:border-[#dc2626] resize-none"
                    style={{ fontFamily: "'DM Sans', sans-serif", minHeight: 60 }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); } }}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#5a8ab5] hover:text-[#e2e8f0] transition-colors">Cancelar</button>
                    <button onClick={handleEditSubmit} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-colors" style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}>Reenviar</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#e2e8f0", lineHeight: 1.6 }}>{message.content}</p>
              )
            ) : (
              <div className="ai-response">
                <style>{`
                  .ai-response h1 { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.05em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(30,58,95,0.4); }
                  .ai-response h2 { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; color: #9bb5d6; letter-spacing: 0.08em; margin: 16px 0 8px; text-transform: uppercase; }
                  .ai-response h3 { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: #7aa3cc; margin: 12px 0 6px; }
                  .ai-response p { font-family: 'Outfit', sans-serif; font-size: 13.5px; color: #7aa3cc; line-height: 1.75; margin-bottom: 10px; }
                  .ai-response ul { list-style: none; padding: 0; margin-bottom: 12px; }
                  .ai-response ul li { font-family: 'Outfit', sans-serif; font-size: 13px; color: #5a8ab5; line-height: 1.65; padding: 4px 0 4px 18px; position: relative; }
                  .ai-response ul li::before { content: ''; position: absolute; left: 0; top: 13px; width: 6px; height: 1px; background: #dc2626; }
                  .ai-response ol { padding-left: 20px; margin-bottom: 12px; }
                  .ai-response ol li { font-family: 'Outfit', sans-serif; font-size: 13px; color: #5a8ab5; line-height: 1.65; padding: 3px 0; }
                  .ai-response strong { font-weight: 700; color: #ef4444; }
                  .ai-response em { color: #60a5fa; font-style: normal; font-weight: 600; }
                  .ai-response code { background: rgba(30,58,95,0.3); color: #93c5fd; font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(30,58,95,0.4); }
                  .ai-response blockquote { border-left: 2px solid #dc2626; padding-left: 14px; margin: 12px 0; background: rgba(220,38,38,0.04); border-radius: 0 6px 6px 0; padding: 10px 14px; }
                  .ai-response blockquote p { color: #9bb5d6; margin: 0; font-style: italic; }
                  .ai-response table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
                  .ai-response th { background: rgba(30,58,95,0.4); color: #9bb5d6; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 12px; text-align: left; border: 1px solid rgba(30,58,95,0.3); }
                  .ai-response td { color: #5a8ab5; font-family: 'Outfit', sans-serif; padding: 8px 12px; border: 1px solid rgba(30,58,95,0.2); }
                  .ai-response tr:nth-child(even) td { background: rgba(30,58,95,0.08); }
                `}</style>
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul>{children}</ul>,
                    ol: ({ children }) => <ol>{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong>{children}</strong>,
                    em: ({ children }) => <em>{children}</em>,
                    code: ({ children }) => <code>{children}</code>,
                    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                    table: ({ children }) => <table>{children}</table>,
                    thead: ({ children }) => <thead>{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr>{children}</tr>,
                    th: ({ children }) => <th>{children}</th>,
                    td: ({ children }) => <td>{children}</td>,
                  }}
                >{message.content}</ReactMarkdown>
              </div>
            )}

            {/* Charts */}
            {!isUser && message.charts && message.charts.length > 0 && (
              <div className="space-y-3 mt-3">
                {showChartSkeleton
                  ? message.charts.map((_, i) => <ChartSkeleton key={i} />)
                  : message.charts.map((chart, i) => <ChartRenderer key={i} chart={chart} onDrillDown={onDrillDown} />)
                }
              </div>
            )}

            {/* Sources */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(30,58,95,0.3)" }}>
                {message.sources.map((s, si) => (
                  <span key={si} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(30,58,95,0.25)", border: "1px solid rgba(30,58,95,0.4)", fontFamily: "'DM Sans', sans-serif", fontSize: "10px", fontWeight: 600, color: "#3d5a7a" }}>
                    <Database className="w-3 h-3" style={{ color: "#1e3a5f" }} />{s}
                  </span>
                ))}
                <span className="flex items-center gap-1 ml-auto" style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#dc2626", opacity: 0.7 }}>
                  <CheckCircle className="w-3 h-3" /> Verificado
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action suggestions */}
        {actionSuggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-1.5 mt-1">
            {actionSuggestions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction?.(action.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-all duration-200"
                style={{ background: "#0A1628", border: "1px solid #1E2A3A", color: "#6B7A99" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,255,0.4)"; (e.currentTarget as HTMLElement).style.color = "#00A3FF"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1E2A3A"; (e.currentTarget as HTMLElement).style.color = "#6B7A99"; }}
              >
                <action.icon className="w-3 h-3" />
                <span>{action.label}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Limitation banner */}
        {limitation && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-xl mt-1"
            style={{ background: "#1A1400", border: "1px solid rgba(245,166,35,0.2)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F5A623" }} />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#F5A623" }}>Limitação de dados</div>
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#6B7A99" }}>{limitation}</p>
              <div className="text-[10px] mb-1.5" style={{ color: "#5a8ab5" }}>Fontes alternativas sugeridas:</div>
              <div className="flex flex-wrap gap-1.5">
                {["ANPG.gov.ao", "OPEC Monthly Report", "EIA Angola"].map((src) => (
                  <span key={src} className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                    style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)", color: "#F5A623" }}>
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Follow-up suggestions */}
        {followUps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-1 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: "#3d5a7a" }}>Perguntas relacionadas:</span>
            <div className="flex flex-wrap gap-1.5">
              {followUps.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp?.(q)}
                  className="px-3 py-1.5 rounded-full text-[11px] transition-all duration-200"
                  style={{ background: "#0A1628", border: "1px solid #1E2A3A", color: "#5a8ab5" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1E2A3A"; (e.currentTarget as HTMLElement).style.color = "#5a8ab5"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const Search = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historySidebarExpanded, setHistorySidebarExpanded] = useState(true);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  // Conversation context
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    lastMentionedBlock: null,
    lastMentionedOperator: null,
    lastMentionedWell: null,
    lastMentionedMetric: null,
    lastMentionedPeriod: null,
    lastChartType: null,
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Context chip display
  const contextChips = useMemo(() => {
    const parts: string[] = [];
    if (conversationContext.lastMentionedBlock) parts.push(conversationContext.lastMentionedBlock);
    if (conversationContext.lastMentionedOperator) parts.push(conversationContext.lastMentionedOperator);
    if (conversationContext.lastMentionedWell) parts.push(conversationContext.lastMentionedWell);
    return parts;
  }, [conversationContext]);

  // Filter sessions by search
  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const lower = historySearch.toLowerCase();
    return sessions.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.messages.some(m => m.content.toLowerCase().includes(lower))
    );
  }, [sessions, historySearch]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) { console.error(e); }
    }
    const savedCtx = localStorage.getItem(CONTEXT_KEY);
    if (savedCtx) {
      try { setConversationContext(JSON.parse(savedCtx)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(conversationContext));
  }, [conversationContext]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  const clearContext = useCallback(() => {
    setConversationContext({
      lastMentionedBlock: null, lastMentionedOperator: null, lastMentionedWell: null,
      lastMentionedMetric: null, lastMentionedPeriod: null, lastChartType: null,
    });
  }, []);

  const startNewChat = useCallback(() => {
    const newId = Date.now().toString();
    setSessions((prev) => [{ id: newId, title: "Nova Consulta", messages: [], date: new Date().toLocaleDateString() }, ...prev]);
    setCurrentSessionId(newId);
    setInput("");
    clearContext();
    setSidebarOpen(false);
    toast.success("Nova sessão iniciada");
  }, [clearContext]);

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
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (filtered.length === 0) localStorage.removeItem(STORAGE_KEY);
        return filtered;
      });
      if (currentSessionId === sessionId) setCurrentSessionId(sessions[0]?.id || null);
      toast.success("Sessão eliminada");
    }
  }, [currentSessionId, sessions]);

  const send = useCallback(async (text?: string) => {
    const term = (text ?? input).trim();
    if (!term || loading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: term.substring(0, 50), messages: [], date: new Date().toLocaleDateString() };
      setSessions([newSession]);
      setCurrentSessionId(newId);
      sessionId = newId;
    }

    setLoading(true);
    setInput("");

    // Parse context from user query
    const userCtx = parseContextFromText(term);
    setConversationContext(prev => ({ ...prev, ...userCtx }));

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: term,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const autoCharts = generateChartsForQuery(term);
    if (autoCharts.length > 0) {
      setConversationContext(prev => ({ ...prev, lastChartType: autoCharts[0].type }));
    }
    const assistantMsgId = (Date.now() + 1).toString();
    setStreamingMsgId(assistantMsgId);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? term.substring(0, 50) : s.title }
          : s
      )
    );

    try {
      const currentMessages = sessions.find((s) => s.id === sessionId)?.messages || [];
      const contextPrefix = buildContextPrefix(conversationContext);

      const aiMessages = [
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: contextPrefix ? term + contextPrefix : term },
      ];

      let assistantContent = "";

      await streamChat({
        messages: aiMessages,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s;
              const msgs = [...s.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg?.role === "assistant" && lastMsg.id === assistantMsgId) {
                msgs[msgs.length - 1] = { ...lastMsg, content: assistantContent };
              } else {
                msgs.push({
                  id: assistantMsgId,
                  role: "assistant",
                  content: assistantContent,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  sources: ["Base de Dados Corporativa", "AlphaData Market Feed"],
                  charts: autoCharts.length > 0 ? autoCharts : undefined,
                });
              }
              return { ...s, messages: msgs };
            })
          );
        },
        onDone: () => {
          setLoading(false);
          setStreamingMsgId(null);
          // Update context from response
          const responseCtx = parseContextFromText(assistantContent);
          setConversationContext(prev => ({ ...prev, ...responseCtx }));
        },
      });
    } catch (error) {
      const errorMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: `### Erro na Consulta\n\n${error instanceof Error ? error.message : "Ocorreu um erro desconhecido."}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
      toast.error("Erro ao processar consulta");
      setLoading(false);
      setStreamingMsgId(null);
    }
  }, [input, loading, currentSessionId, sessions, conversationContext]);

  // Edit a user message and regenerate
  const handleEditMessage = useCallback((msgId: string, newText: string) => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const msgIndex = s.messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return s;
        // Remove this message and all after it
        const trimmed = s.messages.slice(0, msgIndex);
        return { ...s, messages: trimmed };
      })
    );
    // Re-send with new text
    setTimeout(() => send(newText), 100);
  }, [currentSessionId, send]);

  const handleDrillDown = useCallback((entity: string) => {
    const period = conversationContext.lastMentionedPeriod || "actual";
    send(`Mostra-me os dados detalhados de ${entity} para ${period}`);
  }, [send, conversationContext]);

  // Session title breadcrumb
  const sessionTitle = currentSession && currentSession.messages.length >= 3
    ? currentSession.title
    : null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#050b14", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .history-scrollbar::-webkit-scrollbar { width: 3px; }
        .history-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .history-scrollbar::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }
        .chat-scrollbar::-webkit-scrollbar { width: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(30,58,95,0.4); border-radius: 10px; }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: #dc2626; }
      `}</style>

      <Sidebar activeItem="/search" />

      {/* Mobile Button */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 lg:hidden w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl"
        style={{ background: "#dc2626" }}>
        <AnimatePresence mode="wait">
          {sidebarOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5 text-white" /></motion.div>
            : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="w-5 h-5 text-white" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* History Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== "undefined" && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }} animate={{ x: 0, width: historySidebarExpanded ? 280 : 72 }} exit={{ x: -300 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col"
            style={{ background: "#070d1a", borderRight: "1px solid rgba(30,58,95,0.4)" }}>

            {/* Toggle */}
            <motion.button
              onClick={() => setHistorySidebarExpanded(!historySidebarExpanded)}
              className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full items-center justify-center shadow-lg"
              style={{ background: "#dc2626" }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <motion.div animate={{ rotate: historySidebarExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </motion.button>

            {/* Top */}
            <div className="p-4 pt-24 lg:pt-5 space-y-3">
              <AnimatePresence mode="wait">
                {historySidebarExpanded ? (
                  <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <button onClick={startNewChat}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", fontFamily: "'Space Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "white", border: "none" }}>
                      <Plus className="w-4 h-4" /> NOVA CONSULTA
                    </button>

                    {/* History search */}
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#2d4a6a" }} />
                      <input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Pesquisar conversas..."
                        className="w-full bg-transparent border rounded-lg pl-8 pr-3 py-2 text-[11px] focus:outline-none focus:border-[#dc2626]"
                        style={{ borderColor: "rgba(30,58,95,0.3)", color: "#5a8ab5", fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", color: "#1e3a5f", textTransform: "uppercase" }}>Histórico</span>
                      <button onClick={deleteHistory} className="p-1 rounded transition-colors hover:text-red-500" style={{ color: "#1e3a5f" }} title="Eliminar histórico">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                    <button onClick={startNewChat} title="Nova Consulta" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90" style={{ background: "#dc2626" }}>
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                    <div className="w-6 h-[1px]" style={{ background: "rgba(30,58,95,0.4)" }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sessions */}
            <ScrollArea.Root className="flex-1 overflow-hidden">
              <ScrollArea.Viewport className="w-full h-full px-3 history-scrollbar">
                <div className="space-y-1 pb-6">
                  {filteredSessions.length === 0 ? (
                    historySidebarExpanded && (
                      <div className="text-center py-12" style={{ color: "#1e3a5f" }}>
                        <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>Sem sessões</p>
                      </div>
                    )
                  ) : (
                    filteredSessions.map((session) => (
                      <div key={session.id} className="group relative rounded-xl transition-all duration-200"
                        style={{
                          background: currentSessionId === session.id ? "rgba(220,38,38,0.08)" : "transparent",
                          border: currentSessionId === session.id ? "1px solid rgba(220,38,38,0.2)" : "1px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (currentSessionId !== session.id) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(30,58,95,0.1)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentSessionId !== session.id) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                          }
                        }}>
                        <button
                          onClick={() => { setCurrentSessionId(session.id); setSidebarOpen(false); }}
                          className={`w-full p-3 text-left text-sm flex items-center gap-2.5 ${!historySidebarExpanded && "justify-center"}`}
                          title={!historySidebarExpanded ? session.title : undefined}>
                          <MessageSquare className="flex-shrink-0 w-4 h-4" style={{ color: currentSessionId === session.id ? "#ef4444" : "#2d4a6a" }} />
                          {historySidebarExpanded && (
                            <div className="flex-1 min-w-0">
                              <span className="truncate block" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500, color: currentSessionId === session.id ? "#e2e8f0" : "#3d5a7a" }}>
                                {session.title}
                              </span>
                              <span className="text-[9px] block" style={{ color: "#2d4a6a" }}>
                                {session.date} · {session.messages.length} msgs
                              </span>
                            </div>
                          )}
                        </button>
                        {historySidebarExpanded && (
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: "#2d4a6a" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#2d4a6a"}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" className="w-1.5">
                <ScrollArea.Thumb style={{ background: "rgba(30,58,95,0.4)", borderRadius: "10px" }} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/search" />

        {/* Session title breadcrumb */}
        {sessionTitle && (
          <div className="px-8 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(30,58,95,0.2)" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#2d4a6a", letterSpacing: "0.1em" }}>AI Analyst</span>
            <ChevronRight className="w-3 h-3" style={{ color: "#2d4a6a" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#5a8ab5", fontWeight: 500 }}>{sessionTitle}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto chat-scrollbar">
          <div className="max-w-4xl mx-auto w-full px-4 py-8 lg:px-8 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              {!currentSession || currentSession.messages.length === 0 ? (
                <WelcomeScreen onQuickAction={send} />
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-6 pb-44">
                  {currentSession.messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isStreaming={msg.id === streamingMsgId}
                      context={conversationContext}
                      onEdit={handleEditMessage}
                      onFollowUp={send}
                      onAction={(path) => navigate(path)}
                      onDrillDown={handleDrillDown}
                    />
                  ))}
                  {loading && currentSession.messages[currentSession.messages.length - 1]?.role !== "assistant" && (
                    <ThinkingAnimation />
                  )}
                  <div ref={chatBottomRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8" style={{ background: "linear-gradient(to top, #050b14 60%, transparent)" }}>
          <div className="max-w-4xl mx-auto">
            {/* Context chip */}
            {contextChips.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "#0A1628", border: "1px solid #1E2A3A" }}>
                  <span style={{ fontSize: "11px" }}>📍</span>
                  <span className="text-[11px]" style={{ color: "#6B7A99" }}>Contexto: {contextChips.join(" · ")}</span>
                  <button onClick={clearContext} className="ml-1 p-0.5 rounded-full hover:bg-[#1e3a5f]/30 transition-colors">
                    <X className="w-3 h-3" style={{ color: "#5a8ab5" }} />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(30,58,95,0.2))", filter: "blur(8px)" }} />
              <div className="relative flex items-center rounded-2xl overflow-hidden" style={{ background: "#080e1a", border: "1px solid rgba(30,58,95,0.5)" }}>
                <div className="pl-4 pr-2 flex-shrink-0">
                  <Flame className="w-4 h-4" style={{ color: "#dc2626", opacity: 0.6 }} />
                </div>
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none focus:outline-none py-4 px-2"
                  placeholder="Pergunte sobre petróleo, produção, exportações, preços..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  disabled={loading}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#e2e8f0", caretColor: "#dc2626" }}
                />
                <div className="pr-2 flex-shrink-0">
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                    style={{ background: input.trim() && !loading ? "linear-gradient(135deg, #dc2626, #991b1b)" : "rgba(30,58,95,0.3)" }}>
                    {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-3">
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#1e3a5f", letterSpacing: "0.12em", textTransform: "uppercase" }}>AlphaData © {new Date().getFullYear()}</span>
              <div className="w-1 h-1 rounded-full" style={{ background: "#dc2626", opacity: 0.4 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#1e3a5f", letterSpacing: "0.12em", textTransform: "uppercase" }}>Oil & Gas AI Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
