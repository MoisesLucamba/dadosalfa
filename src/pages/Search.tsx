import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
  Search as SearchIcon,
  TrendingUp,
  BarChart3,
  Ship,
  Loader2,
  User,
  Globe,
  Database,
  Send,
  CheckCircle,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  X,
  Menu,
  AlertCircle,
  ChevronLeft,
  Shield,
  Target,
  Droplets,
  Zap,
  Activity,
  Brain,
  Edit2,
  FileText,
  ExternalLink,
  Beaker,
  Bell,
  BarChart2,
  Terminal,
  Radio,
  Table2,
  Settings2,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  sig: string;
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
const CATEGORIZED_SUGGESTIONS = [
  {
    category: "PRODUÇÃO", sig: "PRD",
    questions: [
      "Qual é a produção actual de Angola?",
      "Compare Bloco 17 vs Bloco 32",
      "Evolução da produção nos últimos 2 anos",
    ],
  },
  {
    category: "MERCADO", sig: "MKT",
    questions: [
      "Previsão do Brent para os próximos 90 dias",
      "Principais destinos de exportação Angola",
      "Impacto da saída da OPEP na receita",
    ],
  },
  {
    category: "RISCO", sig: "RSK",
    questions: [
      "Qual o risco actual do Bloco 17?",
      "Eventos geopolíticos que afectam Angola",
      "Análise regulatória ANPG 2025",
    ],
  },
  {
    category: "POÇOS", sig: "WLL",
    questions: [
      "Estado actual do Girassol-4",
      "Comparar performance Dalia-7 vs CLOV-E1",
      "Previsão de produção Kaombo Norte-2",
    ],
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Preço actual do Brent Crude Oil", icon: TrendingUp,   category: "MERCADO",     sig: "MKT" },
  { label: "Relatório de produção TotalEnergies", icon: BarChart3, category: "PRODUÇÃO",    sig: "PRD" },
  { label: "Destinos de exportação de Angola",    icon: Ship,       category: "EXPORTAÇÕES", sig: "EXP" },
  { label: "Previsões estratégicas para 2026",    icon: Target,     category: "PREVISÕES",   sig: "FCT" },
  { label: "Alertas de riscos operacionais",      icon: AlertCircle,category: "RISCOS",      sig: "RSK" },
  { label: "Análise geopolítica e impactos",      icon: Shield,     category: "GEOPOLÍTICA", sig: "GEO" },
];

const CHART_COLORS = ["#38bdf8", "#4ade80", "#fb923c", "#a78bfa", "#f472b6", "#34d399"];
const STORAGE_KEY  = "alphadata_chat_sessions";
const CONTEXT_KEY  = "alphadata_ai_context";
const CHAT_URL     = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-chat`;

const UNCERTAINTY_PHRASES = [
  "não tenho dados", "informação limitada", "não disponível", "fora do escopo",
  "não consigo confirmar", "estimativa", "dados incompletos", "não possuo informação",
  "i don't have", "no data available", "limited information",
];

const BLOCKS    = ["Bloco 0","Bloco 15","Bloco 17","Bloco 18","Bloco 31","Bloco 32"];
const OPERATORS = ["TotalEnergies","BP","ExxonMobil","Chevron","ENI Angola","Sonangol","Eni","Azule Energy","Galp","Equinor"];
const WELLS     = ["Girassol","Dalia","Pazflor","CLOV","Kaombo","Kissanje","Girassol-4","Dalia-7","Kaombo Norte-2","CLOV-E1"];
const METRICS   = ["produção","pressão","risco","exportação","preço","production","pressure","risk","export","price"];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.03) 2px,rgba(255,255,255,0.03) 4px)" }} />
);

const RadarPulse = ({ active }: { active: boolean }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500 animate-ping opacity-75" : "bg-slate-600"}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-red-500" : "bg-slate-600"}`} />
  </span>
);

function parseContextFromText(text: string): Partial<ConversationContext> {
  const ctx: Partial<ConversationContext> = {};
  const lower = text.toLowerCase();
  for (const b of BLOCKS)    { if (lower.includes(b.toLowerCase()))  { ctx.lastMentionedBlock    = b; break; } }
  for (const op of OPERATORS){ if (lower.includes(op.toLowerCase()))  { ctx.lastMentionedOperator = op; break; } }
  for (const w of WELLS)     { if (lower.includes(w.toLowerCase()))   { ctx.lastMentionedWell     = w; break; } }
  for (const m of METRICS)   { if (lower.includes(m))                 { ctx.lastMentionedMetric   = m; break; } }
  const periodMatch = text.match(/último\s+(trimestre|mês|ano)|Q[1-4]\s*\d{4}|\d{4}|últimos?\s+\d+\s+(dias|meses)/i);
  if (periodMatch) ctx.lastMentionedPeriod = periodMatch[0];
  return ctx;
}

function buildContextPrefix(ctx: ConversationContext): string {
  const parts: string[] = [];
  if (ctx.lastMentionedBlock)    parts.push(`Último bloco: ${ctx.lastMentionedBlock}`);
  if (ctx.lastMentionedOperator) parts.push(`Última operadora: ${ctx.lastMentionedOperator}`);
  if (ctx.lastMentionedWell)     parts.push(`Último poço: ${ctx.lastMentionedWell}`);
  if (ctx.lastMentionedMetric)   parts.push(`Última métrica: ${ctx.lastMentionedMetric}`);
  if (ctx.lastMentionedPeriod)   parts.push(`Período: ${ctx.lastMentionedPeriod}`);
  if (!parts.length) return "";
  return `\n\nContexto anterior:\n${parts.join("\n")}\n\nSe a pergunta usar referências implícitas, interpreta com base no contexto acima.`;
}

function generateFollowUpSuggestions(response: string, ctx: ConversationContext): string[] {
  const suggestions: string[] = [];
  const lower = response.toLowerCase();
  if (ctx.lastMentionedBlock) {
    const other = BLOCKS.filter(b => b !== ctx.lastMentionedBlock);
    suggestions.push(`E para o ${other[Math.floor(Math.random() * other.length)]}?`);
  }
  if (lower.includes("produção")) suggestions.push(ctx.lastMentionedBlock ? `Qual a taxa de declínio do ${ctx.lastMentionedBlock}?` : "Tendência de produção para 2026?");
  if (lower.includes("preço") || lower.includes("brent")) suggestions.push("Previsões para o próximo trimestre?");
  if (lower.includes("risco")) suggestions.push("Principais factores de mitigação?");
  if (lower.includes("exporta")) suggestions.push("Volume total exportado este ano?");
  while (suggestions.length < 3) {
    const fb = ["Gera um relatório executivo", "Mostra evolução nos últimos 12 meses", "Compara com a média do sector"];
    suggestions.push(fb[suggestions.length % fb.length]);
  }
  return suggestions.slice(0, 3);
}

function generateActionSuggestions(response: string, ctx: ConversationContext): { label: string; icon: React.ElementType; path: string }[] {
  const actions: { label: string; icon: React.ElementType; path: string }[] = [];
  const lower = response.toLowerCase();
  if (lower.includes("risco") || lower.includes("geopolít")) actions.push({ label: "Abrir Índice de Risco", icon: Shield, path: "/risk" });
  if (lower.includes("produção") || lower.includes("bbl/d")) actions.push({ label: "Dashboard de Produção", icon: BarChart3, path: "/production" });
  if (ctx.lastMentionedWell) actions.push({ label: `Simular Poço ${ctx.lastMentionedWell}`, icon: Beaker, path: "/well-simulation" });
  if (lower.includes("preço") || lower.includes("brent")) actions.push({ label: "Criar Alerta de Preço", icon: Bell, path: "/alerts" });
  if (lower.includes("previsão") || lower.includes("forecast")) actions.push({ label: "Exportar Previsão PDF", icon: FileText, path: "/reports" });
  if (lower.includes("exporta")) actions.push({ label: "Ver Mapa de Exportações", icon: Globe, path: "/exports" });
  return actions.slice(0, 4);
}

function detectLimitations(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of UNCERTAINTY_PHRASES) {
    if (lower.includes(phrase)) return "Os dados apresentados podem estar incompletos ou baseados em estimativas. Consulte fontes oficiais para informação actualizada.";
  }
  return null;
}

function generateChartsForQuery(query: string): ChartData[] {
  const q = query.toLowerCase();
  if (q.includes("brent") || (q.includes("preço") && (q.includes("petróleo") || q.includes("crude")))) {
    return [{
      type: "composed", title: "BRENT CRUDE — EVOLUÇÃO (USD/BBL)", unit: "USD/bbl", xKey: "mes",
      dataKeys: [{ key: "brent", color: "#fb923c", type: "area" }, { key: "wti", color: "#38bdf8", type: "line" }],
      referenceLines: [{ y: 80, label: "Equilíbrio fiscal Angola", color: "rgba(220,38,38,0.3)" }],
      data: [
        { mes: "AGO", brent: 84.2, wti: 81.1 }, { mes: "SET", brent: 88.6, wti: 85.4 },
        { mes: "OUT", brent: 91.3, wti: 88.0 }, { mes: "NOV", brent: 86.7, wti: 83.5 },
        { mes: "DEZ", brent: 79.4, wti: 76.2 }, { mes: "JAN", brent: 82.1, wti: 78.9 },
        { mes: "FEV", brent: 85.5, wti: 82.3 },
      ],
    }];
  }
  if (q.includes("produção") || q.includes("totalenergies") || q.includes("sonangol") || q.includes("barris")) {
    return [
      {
        type: "area", title: "PRODUÇÃO ANGOLA — TOTAL (BBL/DIA)", unit: "bbl/d", xKey: "mes",
        dataKeys: [{ key: "producao", color: "#38bdf8" }, { key: "meta", color: "#4ade80" }],
        data: [
          { mes: "JAN", producao: 1142000, meta: 1180000 }, { mes: "FEV", producao: 1155000, meta: 1180000 },
          { mes: "MAR", producao: 1163000, meta: 1190000 }, { mes: "ABR", producao: 1178000, meta: 1200000 },
          { mes: "MAI", producao: 1195000, meta: 1200000 }, { mes: "JUN", producao: 1210000, meta: 1220000 },
          { mes: "JUL", producao: 1198000, meta: 1220000 },
        ],
      },
      {
        type: "bar", title: "PRODUÇÃO POR OPERADOR (BBL/DIA 2024)", unit: "bbl/d", xKey: "operador",
        dataKeys: [{ key: "producao", color: "#38bdf8" }],
        data: [
          { operador: "Total", producao: 312450 }, { operador: "Chevron", producao: 285200 },
          { operador: "BP", producao: 214100 },    { operador: "Exxon", producao: 196800 },
          { operador: "Eni", producao: 143500 },   { operador: "Outros", producao: 68300 },
        ],
      },
    ];
  }
  if (q.includes("exporta") || q.includes("destinos") || q.includes("china")) {
    return [
      {
        type: "pie", title: "DESTINOS DE EXPORTAÇÃO 2024 (%)", unit: "%", xKey: "pais",
        dataKeys: [{ key: "percentagem", color: "#dc2626" }],
        data: [
          { pais: "China", percentagem: 68 }, { pais: "Índia", percentagem: 11 },
          { pais: "Europa", percentagem: 9 }, { pais: "EUA", percentagem: 6 }, { pais: "Outros", percentagem: 6 },
        ],
      },
    ];
  }
  if (q.includes("previsão") || q.includes("2025") || q.includes("2026") || q.includes("forecast")) {
    return [{
      type: "line", title: "PREVISÃO BRENT 2025/2026 (USD/BBL)", unit: "USD", xKey: "periodo",
      dataKeys: [
        { key: "otimista", color: "#4ade80" }, { key: "base", color: "#fb923c" }, { key: "pessimista", color: "#f87171" },
      ],
      data: [
        { periodo: "Q1'25", otimista: 90, base: 82, pessimista: 72 }, { periodo: "Q2'25", otimista: 93, base: 85, pessimista: 70 },
        { periodo: "Q3'25", otimista: 95, base: 86, pessimista: 68 }, { periodo: "Q4'25", otimista: 97, base: 88, pessimista: 71 },
        { periodo: "Q1'26", otimista: 100, base: 90, pessimista: 74 }, { periodo: "Q2'26", otimista: 102, base: 91, pessimista: 76 },
      ],
    }];
  }
  if (q.includes("risco") || q.includes("alerta")) {
    return [{
      type: "radar", title: "PERFIL DE RISCO MULTIDIMENSIONAL", unit: "score", xKey: "dimension",
      dataKeys: [{ key: "score", color: "#f87171" }],
      data: [
        { dimension: "POLÍTICO", score: 62 }, { dimension: "REGULATÓRIO", score: 45 },
        { dimension: "OPERACIONAL", score: 58 }, { dimension: "MERCADO", score: 71 },
        { dimension: "GEOPOLÍTICO", score: 67 }, { dimension: "AMBIENTAL", score: 39 },
      ],
    }];
  }
  if (q.includes("comparar") || q.includes(" vs ")) {
    return [{
      type: "bar", title: "COMPARAÇÃO DE PRODUÇÃO POR BLOCO", unit: "Mbbl/d", xKey: "bloco",
      dataKeys: [{ key: "producao", color: "#dc2626" }, { key: "capacidade", color: "#38bdf8" }],
      data: [
        { bloco: "BLK-17", producao: 312, capacidade: 350 }, { bloco: "BLK-15", producao: 178, capacidade: 220 },
        { bloco: "BLK-32", producao: 167, capacidade: 200 }, { bloco: "BLK-0",  producao: 91,  capacidade: 120 },
        { bloco: "BLK-18", producao: 68,  capacidade: 85  },
      ],
    }];
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   STREAMING
   ═══════════════════════════════════════════════════════════════════════════ */
async function streamChat({ messages, onDelta, onDone }: {
  messages: { role: "user" | "assistant"; content: string }[];
  onDelta: (delta: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages, includeDatabase: true }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao conectar com o assistente IA");
  }
  if (!resp.body) throw new Error("No response body");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
  onDone();
}

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL TOOLTIP
   ═══════════════════════════════════════════════════════════════════════════ */
const TerminalTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.2)",
      borderRadius: "4px", padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(220,38,38,0.8)", marginBottom: 6 }}>
        {label} // DATA
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: "11px", color: p.color, fontWeight: 700 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}{unit ? ` ${unit}` : ""}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL DATA TABLE + CHART RENDERER
   ═══════════════════════════════════════════════════════════════════════════ */
const TerminalDataTable = ({ chart }: { chart: ChartData }) => {
  const [page, setPage]           = useState(0);
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [copied, setCopied]       = useState(false);
  const PAGE_SIZE = 6;

  const columns = Object.keys(chart.data[0] || {});
  const numericCols = columns.filter(k => typeof chart.data[0]?.[k] === "number");

  // Column colour map — first numeric col gets its dataKey colour if available
  const colColors: Record<string, string> = {};
  chart.dataKeys.forEach(dk => { colColors[dk.key] = dk.color; });

  // Stats per numeric column
  const colStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number; sum: number; avg: number }> = {};
    for (const col of numericCols) {
      const vals = chart.data.map(r => Number(r[col]));
      const min = Math.min(...vals), max = Math.max(...vals), sum = vals.reduce((a, b) => a + b, 0);
      stats[col] = { min, max, sum, avg: sum / vals.length };
    }
    return stats;
  }, [chart.data, numericCols]);

  // Mini sparkline path for a column
  const sparkPath = (col: string, w = 48, h = 16) => {
    const vals = chart.data.map(r => Number(r[col]));
    const mn = Math.min(...vals), mx = Math.max(...vals), range = mx - mn || 1;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - mn) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${pts.join(" L")}`;
  };

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return [...chart.data];
    return [...chart.data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [chart.data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("desc"); }
  };

  const handleCopy = () => {
    const rows = [columns.join("\t"), ...sorted.map(r => columns.map(c => r[c]).join("\t"))].join("\n");
    navigator.clipboard.writeText(rows).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // Bar width % for numeric cells
  const barWidth = (col: string, val: number) => {
    const s = colStats[col];
    return s ? ((val - s.min) / (s.max - s.min || 1)) * 100 : 0;
  };

  // Delta vs previous row
  const delta = (rows: typeof chart.data, rowIdx: number, col: string): number | null => {
    if (rowIdx === 0) return null;
    const cur = Number(rows[rowIdx][col]), prev = Number(rows[rowIdx - 1][col]);
    if (!isNaN(cur) && !isNaN(prev) && prev !== 0) return ((cur - prev) / Math.abs(prev)) * 100;
    return null;
  };

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono',monospace" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-3 rounded overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Table header bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(220,38,38,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Table2 className="w-3 h-3 text-red-500" />
          <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "rgba(220,38,38,0.8)", ...mono }}>
            RAW DATA // {sorted.length} REGISTOS
          </span>
          {chart.unit && (
            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", ...mono }}>
              {chart.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Sparklines per numeric col */}
          {numericCols.slice(0, 2).map(col => (
            <div key={col} className="flex items-center gap-1 px-2 py-1 rounded"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[8px] font-bold tracking-wider" style={{ color: colColors[col] || "hsl(var(--muted-foreground))", ...mono }}>
                {col.toUpperCase()}
              </span>
              <svg width="48" height="16" style={{ overflow: "visible" }}>
                <path d={sparkPath(col)} fill="none" stroke={colColors[col] || "#38bdf8"} strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
          {/* Copy CSV */}
          <button onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-bold tracking-widest transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.07)", color: copied ? "#4ade80" : "hsl(var(--muted-foreground))", ...mono }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}>
            {copied ? "✓ COPIADO" : "⊞ CSV"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {numericCols.length > 0 && (
        <div className="grid px-3 py-2 gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(numericCols.length, 4)}, 1fr)`,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)",
          }}>
          {numericCols.slice(0, 4).map(col => {
            const s = colStats[col];
            const color = colColors[col] || "#38bdf8";
            return (
              <div key={col} className="space-y-1">
                <div className="text-[8px] font-bold tracking-[0.2em] truncate" style={{ color: "hsl(var(--muted-foreground))", ...mono }}>
                  {col.toUpperCase()}
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[11px] font-bold tabular-nums" style={{ color, ...mono }}>
                    {s.avg >= 1000000 ? `${(s.avg/1000000).toFixed(2)}M` : s.avg >= 1000 ? `${(s.avg/1000).toFixed(1)}K` : s.avg.toFixed(1)}
                  </span>
                  <span className="text-[8px]" style={{ color: "hsl(var(--muted-foreground))", ...mono }}>AVG</span>
                </div>
                {/* Min/max micro-bar */}
                <div className="flex items-center gap-1">
                  <span className="text-[7px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))", ...mono, minWidth: 28 }}>
                    {s.min >= 1000000 ? `${(s.min/1000000).toFixed(1)}M` : s.min >= 1000 ? `${(s.min/1000).toFixed(0)}K` : s.min}
                  </span>
                  <div className="flex-1 h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${color}60, ${color})` }} />
                  </div>
                  <span className="text-[7px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))", ...mono, minWidth: 28, textAlign: "right" }}>
                    {s.max >= 1000000 ? `${(s.max/1000000).toFixed(1)}M` : s.max >= 1000 ? `${(s.max/1000).toFixed(0)}K` : s.max}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", ...mono }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.025)" }}>
              <th className="px-3 py-2 text-left" style={{ width: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[8px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>#</span>
              </th>
              {columns.map(col => {
                const isNum = typeof chart.data[0]?.[col] === "number";
                const isSorted = sortKey === col;
                const color = colColors[col];
                return (
                  <th key={col} onClick={() => handleSort(col)}
                    className="px-3 py-2 text-left cursor-pointer select-none transition-all"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", userSelect: "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.05)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <div className="flex items-center gap-1.5">
                      {color && isNum && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      )}
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
                        style={{ color: isSorted ? "#f87171" : "hsl(var(--muted-foreground))" }}>
                        {col}
                      </span>
                      {isSorted && (
                        <span className="text-[9px]" style={{ color: "#f87171" }}>
                          {sortDir === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => {
              const globalIdx = page * PAGE_SIZE + i;
              return (
                <tr key={i}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.04)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  {/* Row number */}
                  <td className="px-3 py-2">
                    <span className="text-[8px] tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {String(globalIdx + 1).padStart(2, "0")}
                    </span>
                  </td>
                  {columns.map((col, j) => {
                    const val = row[col];
                    const isNum = typeof val === "number";
                    const color = colColors[col];
                    const d = isNum ? delta(sorted, globalIdx, col) : null;
                    const bw = isNum ? barWidth(col, Number(val)) : 0;
                    const isXKey = col === chart.xKey;
                    return (
                      <td key={j} className="px-3 py-2.5 relative">
                        {/* Background bar for numeric cells */}
                        {isNum && !isXKey && (
                          <div className="absolute inset-y-0 left-0 rounded-r"
                            style={{ width: `${bw}%`, background: `${color || "#38bdf8"}12`, maxWidth: "100%", pointerEvents: "none" }} />
                        )}
                        <div className="relative flex items-center gap-2">
                          {isXKey ? (
                            <span className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                              {String(val)}
                            </span>
                          ) : isNum ? (
                            <>
                              <span className="text-[11px] font-bold tabular-nums"
                                style={{ color: color || "hsl(var(--foreground))" }}>
                                {Number(val) >= 1000000
                                  ? `${(Number(val)/1000000).toFixed(2)}M`
                                  : Number(val) >= 1000
                                  ? `${(Number(val)/1000).toFixed(1)}K`
                                  : Number(val).toLocaleString()}
                              </span>
                              {d !== null && Math.abs(d) > 0.1 && (
                                <span className="text-[8px] font-bold tabular-nums"
                                  style={{ color: d > 0 ? "#4ade80" : "#f87171" }}>
                                  {d > 0 ? "▲" : "▼"}{Math.abs(d).toFixed(1)}%
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {String(val)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination + summary footer */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))", ...mono }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} DE {sorted.length}
          </span>
          {sortKey && (
            <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "rgba(220,38,38,0.1)", color: "rgba(220,38,38,0.8)", border: "1px solid rgba(220,38,38,0.15)", ...mono }}>
              SORT: {sortKey.toUpperCase()} {sortDir === "desc" ? "↓" : "↑"}
            </span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all disabled:opacity-25"
              style={{ border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--muted-foreground))", ...mono }}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all"
                style={{
                  background: page === i ? "linear-gradient(135deg,#dc2626,#991b1b)" : "transparent",
                  border: `1px solid ${page === i ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.07)"}`,
                  color: page === i ? "white" : "hsl(var(--muted-foreground))",
                  ...mono,
                }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all disabled:opacity-25"
              style={{ border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--muted-foreground))", ...mono }}>
              ›
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ChartRenderer = ({ chart, onDrillDown }: { chart: ChartData; onDrillDown?: (e: string) => void }) => {
  const [showData, setShowData]     = useState(false);
  const [chartType, setChartType]   = useState(chart.type);
  const [showTypes, setShowTypes]   = useState(false);

  const axisProps = {
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" },
    axisLine: false, tickLine: false,
  };
  const gridProps = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.04)", vertical: false };
  const fmt = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v);

  const renderChart = () => {
    if (chartType === "area" || chartType === "line") {
      const Comp = chartType === "area" ? AreaChart : LineChart;
      return (
        <Comp data={chart.data}>
          <defs>
            {chart.dataKeys.map((dk, i) => (
              <linearGradient key={dk.key} id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={dk.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0}    />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={chart.xKey} {...axisProps} />
          <YAxis {...axisProps} width={50} tickFormatter={fmt} />
          <Tooltip content={<TerminalTooltip unit={chart.unit} />} />
          {chart.dataKeys.map((dk, i) =>
            chartType === "area"
              ? <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} fill={`url(#ag-${i})`} dot={{ fill: dk.color, r: 2, strokeWidth: 0 }} />
              : <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} dot={{ fill: dk.color, r: 2 }} />
          )}
        </Comp>
      );
    }
    if (chartType === "bar") return (
      <BarChart data={chart.data}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={chart.xKey} {...axisProps} />
        <YAxis {...axisProps} width={50} tickFormatter={fmt} />
        <Tooltip content={<TerminalTooltip unit={chart.unit} />} />
        {chart.dataKeys.map(dk => <Bar key={dk.key} dataKey={dk.key} name={dk.key} fill={dk.color} radius={[3,3,0,0]} maxBarSize={28} />)}
      </BarChart>
    );
    if (chartType === "pie") return (
      <PieChart>
        <Pie data={chart.data} dataKey={chart.dataKeys[0].key} nameKey={chart.xKey} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3} strokeWidth={0}>
          {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip content={<TerminalTooltip unit={chart.unit} />} />
        <Legend formatter={(v) => <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "hsl(var(--muted-foreground))" }}>{v}</span>} />
      </PieChart>
    );
    if (chartType === "radar") return (
      <RadarChart cx="50%" cy="50%" outerRadius={75} data={chart.data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey={chart.xKey} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }} />
        <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} axisLine={false} />
        {chart.dataKeys.map(dk => <Radar key={dk.key} name={dk.key} dataKey={dk.key} stroke={dk.color} fill={dk.color} fillOpacity={0.15} strokeWidth={2} />)}
        <Tooltip content={<TerminalTooltip unit={chart.unit} />} />
      </RadarChart>
    );
    // composed
    return (
      <ComposedChart data={chart.data}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={chart.xKey} {...axisProps} />
        <YAxis {...axisProps} width={50} />
        <Tooltip content={<TerminalTooltip unit={chart.unit} />} />
        {chart.referenceLines?.map((rl, i) => (
          <ReferenceLine key={i} y={rl.y} stroke={rl.color || "rgba(220,38,38,0.3)"} strokeDasharray="4 4"
            label={{ value: rl.label, fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", position: "insideTopRight" }} />
        ))}
        {chart.dataKeys.map(dk => {
          if (dk.type === "bar")  return <Bar  key={dk.key} dataKey={dk.key} name={dk.key} fill={dk.color} fillOpacity={0.7} radius={[3,3,0,0]} maxBarSize={28} />;
          if (dk.type === "area") return <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} fill={dk.color} fillOpacity={0.08} />;
          return <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} dot={{ fill: dk.color, r: 2 }} />;
        })}
      </ComposedChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-4 rounded overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.15)" }}
    >
      {/* Top accent */}
      <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #dc2626, transparent)" }} />

      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "rgba(220,38,38,0.8)", fontFamily: "'IBM Plex Mono',monospace" }}>
            {chart.title}
          </span>
          {chart.unit && (
            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(220,38,38,0.1)", color: "rgba(220,38,38,0.7)", fontFamily: "'IBM Plex Mono',monospace" }}>
              {chart.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowData(!showData)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold tracking-widest transition-all"
            style={{ color: showData ? "#f87171" : "hsl(var(--muted-foreground))", border: `1px solid ${showData ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.07)"}`, fontFamily: "'IBM Plex Mono',monospace" }}>
            <Table2 className="w-2.5 h-2.5" /> TAB
          </button>
          <button onClick={() => setShowTypes(!showTypes)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold tracking-widest transition-all"
            style={{ color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "'IBM Plex Mono',monospace" }}>
            <Settings2 className="w-2.5 h-2.5" /> TYPE
          </button>
          {showTypes && (["bar","line","area","pie"] as const).map(t => (
            <button key={t} onClick={() => { setChartType(t); setShowTypes(false); }}
              className="px-2 py-1 rounded text-[8px] font-bold tracking-widest transition-all"
              style={{
                background: chartType === t ? "linear-gradient(135deg,#dc2626,#991b1b)" : "transparent",
                color: chartType === t ? "white" : "hsl(var(--muted-foreground))",
                border: `1px solid ${chartType === t ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.07)"}`,
                fontFamily: "'IBM Plex Mono',monospace",
              }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220, padding: "12px 8px 8px" }}>
        <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
      </div>

      {/* Data Table */}
      {showData && (
        <div className="px-4 pb-4">
          <TerminalDataTable chart={chart} />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[8px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
          FONTE: ANPG · ALPHADAT ANALYTICS
        </span>
        <span className="text-[8px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
          {new Date().toLocaleDateString("pt-BR")}
        </span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   THINKING ANIMATION
   ═══════════════════════════════════════════════════════════════════════════ */
const ThinkingAnimation = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { icon: SearchIcon, text: "A CONSULTAR BASE DE DADOS ANGOLA...", color: "#38bdf8" },
    { icon: Brain,      text: "A PROCESSAR COM MODELO PREDITIVO...",  color: "#dc2626" },
    { icon: BarChart2,  text: "A PREPARAR VISUALIZAÇÃO...",           color: "#4ade80" },
  ];
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const cur = stages[stage];
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.3)" }}>
        <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
      </div>
      <div className="px-5 py-4 rounded overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.15)", borderTopLeftRadius: 4, minWidth: 260 }}>
        <div className="h-[2px] mb-3" style={{ background: "linear-gradient(90deg,#dc2626,transparent)" }} />
        <AnimatePresence mode="wait">
          <motion.div key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }} className="flex items-center gap-2">
            <cur.icon className="w-3 h-3 flex-shrink-0" style={{ color: cur.color }} />
            <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
              {cur.text}
            </span>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1.5 mt-3">
          {stages.map((_, i) => (
            <div key={i} className="h-[2px] flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= stage ? "#dc2626" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WELCOME SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */
const WelcomeScreen = ({ onQuickAction }: { onQuickAction: (q: string) => void }) => {
  const [activeCat, setActiveCat] = useState(0);
  return (
    <motion.div key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col justify-center items-center py-10" style={{ gap: "2.5rem" }}>

      {/* Hero */}
      <div className="text-center max-w-2xl space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <RadarPulse active={true} />
          <span className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)", fontFamily: "'IBM Plex Mono',monospace" }}>
            ALPHADAT-OS // AI ANALYST ONLINE
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="text-[10px] font-bold tracking-[0.25em] mb-2" style={{ color: "rgba(220,38,38,0.7)", fontFamily: "'IBM Plex Mono',monospace" }}>
            MÓDULO-01 // INTELIGÊNCIA CONVERSACIONAL
          </div>
          <h1 className="font-bold leading-none" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
            AI ANALYST
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-[1px] w-10 bg-red-600" />
            <p className="text-[11px] tracking-[0.05em]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
              CONSULTAS EM TEMPO REAL · BASE DE DADOS PETROLÍFERA
            </p>
            <div className="h-[1px] w-10 bg-red-600" />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-8">
          {[
            { icon: Droplets, label: "PETRÓLEO",  value: "LIVE"  },
            { icon: Activity, label: "MERCADOS",  value: "24/7"  },
            { icon: Zap,      label: "RESPOSTA",  value: "<2S"   },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <s.icon className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>{s.value}</div>
                <div className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Categorized suggestions */}
      <div className="w-full max-w-3xl px-4">
        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {CATEGORIZED_SUGGESTIONS.map((cat, i) => (
            <button key={cat.category} onClick={() => setActiveCat(i)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest transition-all whitespace-nowrap"
              style={{
                color: activeCat === i ? "#f87171" : "hsl(var(--muted-foreground))",
                borderBottom: `2px solid ${activeCat === i ? "#dc2626" : "transparent"}`,
                background: "transparent",
                fontFamily: "'IBM Plex Mono',monospace",
              }}>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: activeCat === i ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)", color: activeCat === i ? "#f87171" : "hsl(var(--muted-foreground))" }}>
                {cat.sig}
              </span>
              {cat.category}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeCat} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CATEGORIZED_SUGGESTIONS[activeCat].questions.map((q, i) => (
              <motion.button key={q} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => onQuickAction(q)}
                className="p-4 rounded text-left transition-all duration-150 group"
                style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.25)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}>
                <div className="text-[10px] font-bold mb-2" style={{ color: "rgba(220,38,38,0.7)", fontFamily: "'IBM Plex Mono',monospace" }}>
                  {CATEGORIZED_SUGGESTIONS[activeCat].sig}
                </div>
                <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.5 }}>{q}</span>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span className="text-[8px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
            CONSULTAS FREQUENTES
          </span>
          <div className="h-[1px] flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => onQuickAction(action.label)}
              className="flex items-start gap-3 p-4 rounded transition-all duration-150 group text-left"
              style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.25)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}>
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)" }}>
                <action.icon className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div>
                <div className="text-[8px] font-bold tracking-[0.2em] mb-1" style={{ color: "rgba(220,38,38,0.7)", fontFamily: "'IBM Plex Mono',monospace" }}>
                  {action.sig} // {action.category}
                </div>
                <span className="text-[10px] font-bold" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.5 }}>
                  {action.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT BUBBLE
   ═══════════════════════════════════════════════════════════════════════════ */
const ChatBubble = ({
  message, isStreaming = false, context, onEdit, onFollowUp, onAction, onDrillDown,
}: {
  message: Message; isStreaming?: boolean; context: ConversationContext;
  onEdit?: (id: string, text: string) => void;
  onFollowUp?: (q: string) => void;
  onAction?: (path: string) => void;
  onDrillDown?: (e: string) => void;
}) => {
  const isUser = message.role === "user";
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editing && editRef.current) { editRef.current.focus(); editRef.current.select(); } }, [editing]);

  const limitation      = !isUser && !isStreaming ? detectLimitations(message.content) : null;
  const actionSuggestions = !isUser && !isStreaming ? generateActionSuggestions(message.content, context) : [];
  const followUps       = !isUser && !isStreaming && message.content.length > 100 ? generateFollowUpSuggestions(message.content, context) : [];

  const handleEditSubmit = () => {
    if (editText.trim() && onEdit) { onEdit(message.id, editText.trim()); setEditing(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1"
        style={isUser
          ? { background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "1px solid rgba(220,38,38,0.5)" }
          : { background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.25)" }
        }>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Terminal className="w-3.5 h-3.5 text-red-500" />
        }
      </div>

      <div className={`flex flex-col space-y-1.5 max-w-[88%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Role label */}
        <div className="flex items-center gap-2 px-1" style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
          <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: isUser ? "#f87171" : "#38bdf8", fontFamily: "'IBM Plex Mono',monospace" }}>
            {isUser ? "OPERADOR" : "ALPHADAT-AI"}
          </span>
          <span className="text-[9px] tabular-nums opacity-50" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
            {message.time}
          </span>
        </div>

        {/* Bubble */}
        <div className="relative group" style={{ width: isUser ? undefined : "100%" }}>
          {/* Edit button */}
          {isUser && !editing && onEdit && (
            <button onClick={() => { setEditText(message.content); setEditing(true); }}
              className="absolute -top-1 -right-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
              style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Edit2 className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          )}

          <div className="px-5 py-4 rounded"
            style={isUser
              ? { background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)", borderTopRightRadius: 4 }
              : { background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderTopLeftRadius: 4, borderLeft: "2px solid rgba(220,38,38,0.4)", width: "100%" }
            }>
            {isUser ? (
              editing ? (
                <div className="space-y-3">
                  <textarea ref={editRef} value={editText} onChange={e => setEditText(e.target.value)}
                    className="w-full bg-transparent outline-none resize-none text-[13px]"
                    style={{ border: "1px solid rgba(220,38,38,0.3)", borderRadius: 4, padding: "8px 12px", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace", minHeight: 60 }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); } }} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded text-[10px] font-bold tracking-widest"
                      style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>CANCELAR</button>
                    <button onClick={handleEditSubmit} className="px-3 py-1.5 rounded text-[10px] font-bold tracking-widest"
                      style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", fontFamily: "'IBM Plex Mono',monospace" }}>REENVIAR</button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.6 }}>{message.content}</p>
              )
            ) : (
              <div className="ai-response">
                <style>{`
                  .ai-response h1,.ai-response h2,.ai-response h3{font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:0.05em;color:hsl(var(--foreground));margin-bottom:10px}
                  .ai-response h1{font-size:13px;padding-bottom:8px;border-bottom:1px solid rgba(220,38,38,0.2)}
                  .ai-response h2{font-size:11px;color:rgba(220,38,38,0.8);letter-spacing:0.15em;text-transform:uppercase;margin-top:14px}
                  .ai-response h3{font-size:11px}
                  .ai-response p{font-family:'IBM Plex Mono',monospace;font-size:12px;color:hsl(var(--muted-foreground));line-height:1.75;margin-bottom:10px}
                  .ai-response ul{list-style:none;padding:0;margin-bottom:12px}
                  .ai-response ul li{font-family:'IBM Plex Mono',monospace;font-size:11px;color:hsl(var(--muted-foreground));line-height:1.7;padding:3px 0 3px 16px;position:relative}
                  .ai-response ul li::before{content:'';position:absolute;left:0;top:12px;width:6px;height:1px;background:#dc2626}
                  .ai-response ol{padding-left:18px;margin-bottom:12px}
                  .ai-response ol li{font-family:'IBM Plex Mono',monospace;font-size:11px;color:hsl(var(--muted-foreground));line-height:1.7;padding:2px 0}
                  .ai-response strong{font-weight:700;color:#f87171}
                  .ai-response em{color:#38bdf8;font-style:normal;font-weight:600}
                  .ai-response code{background:rgba(220,38,38,0.1);color:#f87171;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:2px 6px;border-radius:3px;border:1px solid rgba(220,38,38,0.2)}
                  .ai-response blockquote{border-left:2px solid #dc2626;padding:8px 14px;margin:10px 0;background:rgba(220,38,38,0.04);border-radius:0 4px 4px 0}
                  .ai-response blockquote p{color:hsl(var(--muted-foreground));margin:0;font-style:italic}
                  .ai-response table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}
                  .ai-response th{background:rgba(255,255,255,0.04);color:hsl(var(--muted-foreground));font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.15em;text-transform:uppercase;padding:7px 10px;text-align:left;border:1px solid rgba(255,255,255,0.06)}
                  .ai-response td{color:hsl(var(--foreground));font-family:'IBM Plex Mono',monospace;padding:7px 10px;border:1px solid rgba(255,255,255,0.05)}
                  .ai-response tr:nth-child(even) td{background:rgba(255,255,255,0.02)}
                `}</style>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}

            {/* Charts */}
            {!isUser && message.charts && message.charts.length > 0 && (
              <div className="space-y-3 mt-3">
                {message.charts.map((c, i) => <ChartRenderer key={i} chart={c} onDrillDown={onDrillDown} />)}
              </div>
            )}

            {/* Sources */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {message.sources.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
                    <Database className="w-3 h-3" style={{ color: "#38bdf8" }} />{s}
                  </span>
                ))}
                <span className="flex items-center gap-1 ml-auto text-[9px] font-bold tracking-wider"
                  style={{ color: "#4ade80", fontFamily: "'IBM Plex Mono',monospace" }}>
                  <CheckCircle className="w-3 h-3" /> VERIFICADO
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action chips */}
        {actionSuggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-1.5 mt-1">
            {actionSuggestions.map((a, i) => (
              <button key={i} onClick={() => onAction?.(a.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold tracking-wider transition-all"
                style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)"; (e.currentTarget as HTMLElement).style.color = "#38bdf8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}>
                <a.icon className="w-3 h-3" />
                {a.label}
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Limitation */}
        {limitation && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-3 rounded mt-1"
            style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-400" />
            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] mb-1" style={{ color: "#fb923c", fontFamily: "'IBM Plex Mono',monospace" }}>
                LIMITAÇÃO DE DADOS // AVISO
              </div>
              <p className="text-[10px] mb-2" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>{limitation}</p>
              <div className="flex flex-wrap gap-1.5">
                {["ANPG.gov.ao", "OPEC Monthly", "EIA Angola"].map(src => (
                  <span key={src} className="px-2 py-0.5 rounded text-[8px] font-bold tracking-widest"
                    style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)", color: "#fb923c", fontFamily: "'IBM Plex Mono',monospace" }}>
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Follow-ups */}
        {followUps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-1 space-y-1.5">
            <span className="text-[8px] font-bold tracking-[0.25em] px-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}>
              PERGUNTAS RELACIONADAS //
            </span>
            <div className="flex flex-wrap gap-1.5">
              {followUps.map((q, i) => (
                <button key={i} onClick={() => onFollowUp?.(q)}
                  className="px-3 py-1.5 rounded text-[10px] font-bold transition-all"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono',monospace" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}>
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
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */
const Search = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions]           = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSId] = useState<string | null>(null);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [histExpanded, setHistExpanded]   = useState(true);
  const [streamingId, setStreamingId]     = useState<string | null>(null);
  const [histSearch, setHistSearch]       = useState("");
  const [now, setNow]                     = useState(new Date());
  const [conversationContext, setCtx]     = useState<ConversationContext>({
    lastMentionedBlock: null, lastMentionedOperator: null, lastMentionedWell: null,
    lastMentionedMetric: null, lastMentionedPeriod: null, lastChartType: null,
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);

  // Load conversations + messages from Supabase (with localStorage migration fallback)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: convs, error } = await supabase
        .from("chat_conversations")
        .select("id,title,created_at,updated_at")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error || cancelled) { console.error("[chat] load convs", error); return; }

      const convIds = (convs ?? []).map(c => c.id);
      let allMsgs: any[] = [];
      if (convIds.length) {
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("id,conversation_id,role,content,sources,charts,created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: true });
        allMsgs = msgs ?? [];
      }

      const loaded: ChatSession[] = (convs ?? []).map(c => ({
        id: c.id,
        title: c.title,
        date: new Date(c.created_at).toLocaleDateString("pt-BR"),
        messages: allMsgs.filter(m => m.conversation_id === c.id).map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: Array.isArray(m.sources) ? m.sources : undefined,
          charts: Array.isArray(m.charts) && m.charts.length ? m.charts : undefined,
        })),
      }));

      // One-time migration from localStorage if Supabase is empty
      if (loaded.length === 0) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const legacy: ChatSession[] = JSON.parse(saved);
            for (const s of legacy.slice(0, 20)) {
              const newId = crypto.randomUUID();
              const { error: cErr } = await supabase.from("chat_conversations").insert({
                id: newId, user_id: user.id, title: s.title || "CONSULTA",
              });
              if (cErr) continue;
              for (const m of s.messages) {
                await supabase.from("chat_messages").insert({
                  conversation_id: newId, user_id: user.id,
                  role: m.role, content: m.content,
                  sources: (m.sources ?? []) as any, charts: (m.charts ?? []) as any,
                } as any);
              }
            }
            localStorage.removeItem(STORAGE_KEY);
            // reload
            const { data: convs2 } = await supabase
              .from("chat_conversations").select("id,title,created_at")
              .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50);
            if (convs2 && !cancelled) {
              setSessions(convs2.map(c => ({ id: c.id, title: c.title, date: new Date(c.created_at).toLocaleDateString("pt-BR"), messages: [] })));
              setCurrentSId(convs2[0]?.id ?? null);
            }
            return;
          } catch (e) { console.error("[chat] migration failed", e); }
        }
      }

      if (!cancelled) {
        setSessions(loaded);
        if (loaded.length > 0) setCurrentSId(loaded[0].id);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const savedCtx = localStorage.getItem(CONTEXT_KEY);
    if (savedCtx) { try { setCtx(JSON.parse(savedCtx)); } catch {} }
  }, []);
  useEffect(() => { localStorage.setItem(CONTEXT_KEY, JSON.stringify(conversationContext)); }, [conversationContext]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentSession?.messages, loading]);

  const filteredSessions = useMemo(() => {
    if (!histSearch.trim()) return sessions;
    const lower = histSearch.toLowerCase();
    return sessions.filter(s => s.title.toLowerCase().includes(lower) || s.messages.some(m => m.content.toLowerCase().includes(lower)));
  }, [sessions, histSearch]);

  const contextChips = useMemo(() => {
    const parts: string[] = [];
    if (conversationContext.lastMentionedBlock)    parts.push(conversationContext.lastMentionedBlock);
    if (conversationContext.lastMentionedOperator) parts.push(conversationContext.lastMentionedOperator);
    if (conversationContext.lastMentionedWell)     parts.push(conversationContext.lastMentionedWell);
    return parts;
  }, [conversationContext]);

  const clearContext = useCallback(() => {
    setCtx({ lastMentionedBlock: null, lastMentionedOperator: null, lastMentionedWell: null, lastMentionedMetric: null, lastMentionedPeriod: null, lastChartType: null });
  }, []);

  const startNewChat = useCallback(async () => {
    if (!user?.id) { toast.error("Sessão expirada"); return; }
    const id = crypto.randomUUID();
    const { error } = await supabase.from("chat_conversations").insert({
      id, user_id: user.id, title: "NOVA CONSULTA",
    });
    if (error) { toast.error("Erro ao criar conversa"); return; }
    setSessions(prev => [{ id, title: "NOVA CONSULTA", messages: [], date: new Date().toLocaleDateString("pt-BR") }, ...prev]);
    setCurrentSId(id); setInput(""); clearContext(); setSidebarOpen(false);
    toast.success("NOVA SESSÃO INICIADA");
  }, [clearContext, user?.id]);

  const deleteHistory = useCallback(async () => {
    if (!user?.id) return;
    if (window.confirm("Confirma a eliminação de todo o histórico?")) {
      const { error } = await supabase.from("chat_conversations").delete().eq("user_id", user.id);
      if (error) { toast.error("Erro ao apagar histórico"); return; }
      setSessions([]); setCurrentSId(null); toast.error("HISTÓRICO ELIMINADO");
    }
  }, [user?.id]);

  const deleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Eliminar esta sessão?")) {
      const { error } = await supabase.from("chat_conversations").delete().eq("id", sessionId);
      if (error) { toast.error("Erro ao apagar"); return; }
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) setCurrentSId(sessions.find(s => s.id !== sessionId)?.id || null);
      toast.success("SESSÃO ELIMINADA");
    }
  }, [currentSessionId, sessions]);


  const send = useCallback(async (text?: string) => {
    const term = (text ?? input).trim();
    if (!term || loading || !user?.id) return;

    let sessionId = currentSessionId;
    let isFirstMessage = false;
    if (!sessionId) {
      const id = crypto.randomUUID();
      const title = term.substring(0, 50).toUpperCase();
      const { error } = await supabase.from("chat_conversations").insert({
        id, user_id: user.id, title,
      });
      if (error) { toast.error("Erro ao criar conversa"); return; }
      const s: ChatSession = { id, title, messages: [], date: new Date().toLocaleDateString("pt-BR") };
      setSessions(prev => [s, ...prev]); setCurrentSId(id); sessionId = id;
      isFirstMessage = true;
    } else {
      const cur = sessions.find(s => s.id === sessionId);
      isFirstMessage = !cur || cur.messages.length === 0;
    }

    setLoading(true); setInput("");
    const userCtx = parseContextFromText(term);
    setCtx(prev => ({ ...prev, ...userCtx }));

    const userMsgId = crypto.randomUUID();
    const userMsg: Message = {
      id: userMsgId, role: "user", content: term,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const autoCharts = generateChartsForQuery(term);
    if (autoCharts.length) setCtx(prev => ({ ...prev, lastChartType: autoCharts[0].type }));
    const aId = crypto.randomUUID();
    setStreamingId(aId);

    const newTitle = isFirstMessage ? term.substring(0, 50).toUpperCase() : undefined;
    setSessions(prev => prev.map(s => s.id === sessionId
      ? { ...s, messages: [...s.messages, userMsg], title: newTitle ?? s.title }
      : s));

    // Persist user message + title update
    await supabase.from("chat_messages").insert({
      id: userMsgId, conversation_id: sessionId!, user_id: user.id,
      role: "user", content: term,
    } as any);
    if (newTitle) {
      await supabase.from("chat_conversations").update({ title: newTitle }).eq("id", sessionId!);
    }

    try {
      const curMsgs = sessions.find(s => s.id === sessionId)?.messages || [];
      const ctxPrefix = buildContextPrefix(conversationContext);
      const aiMessages = [
        ...curMsgs.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: ctxPrefix ? term + ctxPrefix : term },
      ];
      let acc = "";
      await streamChat({
        messages: aiMessages,
        onDelta: chunk => {
          acc += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === "assistant" && last.id === aId) {
              msgs[msgs.length - 1] = { ...last, content: acc };
            } else {
              msgs.push({ id: aId, role: "assistant", content: acc, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), sources: ["Base de Dados Corporativa", "Elastra Market Feed"], charts: autoCharts.length ? autoCharts : undefined });
            }
            return { ...s, messages: msgs };
          }));
        },
        onDone: async () => {
          setLoading(false); setStreamingId(null);
          const rCtx = parseContextFromText(acc);
          setCtx(prev => ({ ...prev, ...rCtx }));
          // Persist assistant message
          await supabase.from("chat_messages").insert({
            id: aId, conversation_id: sessionId!, user_id: user.id,
            role: "assistant", content: acc,
            sources: ["Base de Dados Corporativa", "Elastra Market Feed"] as any,
            charts: (autoCharts.length ? autoCharts : []) as any,
          } as any);
          await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", sessionId!);
        },
      });
    } catch (error) {
      const errMsg: Message = { id: aId, role: "assistant", content: `### ERRO DE SISTEMA\n\n${error instanceof Error ? error.message : "Erro desconhecido."}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, errMsg] } : s));
      toast.error("ERRO CRÍTICO — CONSULTA FALHADA");
      setLoading(false); setStreamingId(null);
    }
  }, [input, loading, currentSessionId, sessions, conversationContext, user?.id]);

  const handleEditMessage = useCallback((msgId: string, newText: string) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== currentSessionId) return s;
      const idx = s.messages.findIndex(m => m.id === msgId);
      if (idx === -1) return s;
      return { ...s, messages: s.messages.slice(0, idx) };
    }));
    setTimeout(() => send(newText), 100);
  }, [currentSessionId, send]);

  const handleDrillDown = useCallback((entity: string) => {
    send(`Mostra dados detalhados de ${entity} para ${conversationContext.lastMentionedPeriod || "período actual"}`);
  }, [send, conversationContext]);

  return (
    <div className="flex h-screen overflow-hidden text-foreground"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono','Courier New',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
        .hist-scroll::-webkit-scrollbar{width:3px}
        .hist-scroll::-webkit-scrollbar-thumb{background:rgba(220,38,38,0.2);border-radius:10px}
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:10px}
      `}</style>

      <ScanlineOverlay />
      <Sidebar />

      {/* Mobile toggle */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 lg:hidden w-10 h-10 rounded flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "1px solid rgba(220,38,38,0.5)" }}>
        <AnimatePresence mode="wait">
          {sidebarOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-4 h-4 text-white" /></motion.div>
            : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="w-4 h-4 text-white" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* ── History Sidebar ── */}
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0, width: histExpanded ? 260 : 64 }} exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col"
            style={{ background: "hsl(var(--background))", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

            {/* Collapse toggle */}
            <motion.button onClick={() => setHistExpanded(!histExpanded)}
              className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full items-center justify-center"
              style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "1px solid rgba(220,38,38,0.5)" }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <motion.div animate={{ rotate: histExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="w-3 h-3 text-white" />
              </motion.div>
            </motion.button>

            {/* Top controls */}
            <div className="p-3 pt-20 lg:pt-4 space-y-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <AnimatePresence mode="wait">
                {histExpanded ? (
                  <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {/* Status row */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          HISTÓRICO // SESSÕES
                        </span>
                      </div>
                      <button onClick={deleteHistory} style={{ color: "hsl(var(--muted-foreground))" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <button onClick={startNewChat}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold tracking-[0.15em] transition-all"
                      style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", border: "1px solid rgba(220,38,38,0.5)", boxShadow: "0 0 12px rgba(220,38,38,0.2)" }}>
                      <Plus className="w-3.5 h-3.5" /> NOVA CONSULTA
                    </button>

                    <div className="relative">
                      <SearchIcon className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                      <input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="PESQUISAR..."
                        className="w-full h-8 pl-8 pr-3 rounded text-[9px] font-bold tracking-wider outline-none transition-colors"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace" }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.07)"} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                    <button onClick={startNewChat} title="Nova Consulta"
                      className="w-9 h-9 rounded flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sessions list */}
            <ScrollArea.Root className="flex-1 overflow-hidden">
              <ScrollArea.Viewport className="w-full h-full px-2 py-2 hist-scroll">
                <div className="space-y-1 pb-6">
                  {filteredSessions.length === 0 ? (
                    histExpanded && (
                      <div className="text-center py-10" style={{ color: "hsl(var(--muted-foreground))" }}>
                        <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-[9px] font-bold tracking-[0.2em]">SEM SESSÕES</p>
                      </div>
                    )
                  ) : filteredSessions.map(session => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <div key={session.id} className="group relative rounded transition-all duration-150"
                        style={{
                          background: isActive ? "rgba(220,38,38,0.08)" : "transparent",
                          border: `1px solid ${isActive ? "rgba(220,38,38,0.2)" : "transparent"}`,
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <button onClick={() => { setCurrentSId(session.id); setSidebarOpen(false); }}
                          className={`w-full p-2.5 text-left flex items-center gap-2.5 ${!histExpanded && "justify-center"}`}
                          title={!histExpanded ? session.title : undefined}>
                          <MessageSquare className="flex-shrink-0 w-3.5 h-3.5" style={{ color: isActive ? "#f87171" : "hsl(var(--muted-foreground))" }} />
                          {histExpanded && (
                            <div className="flex-1 min-w-0">
                              <span className="truncate block text-[10px] font-bold tracking-wider"
                                style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                                {session.title}
                              </span>
                              <span className="text-[8px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
                                {session.date} · {session.messages.length} MSG
                              </span>
                            </div>
                          )}
                        </button>
                        {histExpanded && (
                          <button onClick={e => deleteSession(session.id, e)}
                            className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" className="w-1.5">
                <ScrollArea.Thumb style={{ background: "rgba(220,38,38,0.2)", borderRadius: 10 }} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Atmospheric glows */}
        <div className="absolute top-0 right-0 w-[40%] h-[30%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(220,38,38,0.04) 0%,transparent 70%)" }} />

        <Header />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 border-b"
          style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}>
          <div className="flex items-center gap-4 text-[10px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1.5 text-red-500">
              <RadarPulse active={true} />
              AI ANALYST ONLINE
            </span>
            <span className="opacity-40">|</span>
            <span>MÓDULO-01 // INTELIGÊNCIA CONVERSACIONAL</span>
            {currentSession && currentSession.messages.length > 0 && (
              <>
                <span className="opacity-40">|</span>
                <span className="truncate max-w-[200px]">{currentSession.title}</span>
              </>
            )}
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span style={{ color: "hsl(var(--foreground))" }}>
              {now.toLocaleTimeString("pt-BR", { hour12: false })}
            </span>
            <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Breadcrumb */}
        {currentSession && currentSession.messages.length > 2 && (
          <div className="px-6 py-1.5 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <Terminal className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>ALPHADAT-OS</span>
            <ChevronRight className="w-3 h-3 opacity-40" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>AI ANALYST</span>
            <ChevronRight className="w-3 h-3 opacity-40" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-[9px] font-bold tracking-[0.2em] truncate max-w-[240px]" style={{ color: "hsl(var(--foreground))" }}>{currentSession.title}</span>
          </div>
        )}

        {/* Messages */}
        <main className="flex-1 overflow-y-auto chat-scroll">
          <div className="max-w-3xl mx-auto w-full px-4 py-6 lg:px-8 flex flex-col min-h-full">
            <AnimatePresence mode="wait">
              {!currentSession || currentSession.messages.length === 0 ? (
                <WelcomeScreen onQuickAction={send} />
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-6 pb-44">
                  {currentSession.messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} isStreaming={msg.id === streamingId}
                      context={conversationContext} onEdit={handleEditMessage}
                      onFollowUp={send} onAction={path => navigate(path)} onDrillDown={handleDrillDown} />
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

        {/* ── Input ── */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-5 md:px-8"
          style={{ background: "linear-gradient(to top, hsl(var(--background)) 65%, transparent)" }}>
          <div className="max-w-3xl mx-auto">

            {/* Context chip */}
            {contextChips.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-bold tracking-wider"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", fontFamily: "'IBM Plex Mono',monospace" }}>
                  <span style={{ color: "rgba(220,38,38,0.7)" }}>CTX //</span>
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{contextChips.join(" · ")}</span>
                  <button onClick={clearContext} className="ml-1 transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="relative flex items-center rounded overflow-hidden"
              style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.2)", boxShadow: "0 0 20px rgba(220,38,38,0.08)" }}>
              {/* Left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: "linear-gradient(180deg,#dc2626,transparent)" }} />

              <div className="pl-5 pr-2 flex-shrink-0">
                <Terminal className="w-3.5 h-3.5 text-red-500 opacity-60" />
              </div>
              <input ref={inputRef}
                className="flex-1 bg-transparent border-none focus:outline-none py-4 px-2 text-[13px]"
                placeholder="CONSULTA // Petróleo · Produção · Exportações · Preços..."
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                disabled={loading}
                style={{ color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono',monospace", caretColor: "#dc2626" }}
              />
              <div className="pr-3 flex-shrink-0">
                <motion.button onClick={() => send()} disabled={!input.trim() || loading}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !loading ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(220,38,38,0.3)" }}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </motion.button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-[8px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
                ALPHADAT © {new Date().getFullYear()}
              </span>
              <div className="w-1 h-1 rounded-full bg-red-600 opacity-40" />
              <span className="text-[8px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
                OIL & GAS AI PLATFORM
              </span>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Search;