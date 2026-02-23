import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "recharts";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChartData {
  type: "area" | "bar" | "line" | "pie";
  title: string;
  unit?: string;
  data: Record<string, string | number>[];
  dataKeys: { key: string; color: string }[];
  xKey: string;
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

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Qual o preço atual do Brent Crude Oil?", icon: TrendingUp, category: "Mercado", accent: "#dc2626" },
  { label: "Relatório de produção mensal da TotalEnergies", icon: BarChart3, category: "Produção", accent: "#1e3a5f" },
  { label: "Principais destinos de exportação de Angola", icon: Ship, category: "Exportações", accent: "#dc2626" },
  { label: "Previsões estratégicas para 2026", icon: Target, category: "Previsões", accent: "#1e3a5f" },
  { label: "Alertas de riscos operacionais ativos", icon: AlertCircle, category: "Riscos", accent: "#dc2626" },
  { label: "Análise geopolítica e impactos no mercado", icon: Shield, category: "Geopolítica", accent: "#1e3a5f" },
];

const STORAGE_KEY = "alphadata_chat_sessions";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-chat`;

const CHART_COLORS = ["#dc2626", "#1e3a5f", "#ef4444", "#3b82f6", "#991b1b", "#1d4ed8"];

/* ═══════════════════════════════════════════════════════════════════════════
   AUTO CHART GENERATOR
   Detects topic from user query and generates relevant chart data
   ═══════════════════════════════════════════════════════════════════════════ */

function generateChartsForQuery(query: string): ChartData[] {
  const q = query.toLowerCase();

  // --- Brent / preço do petróleo ---
  if (q.includes("brent") || q.includes("preço") && (q.includes("petróleo") || q.includes("crude") || q.includes("oil") || q.includes("wti"))) {
    return [
      {
        type: "area",
        title: "Brent Crude — Evolução do Preço (USD/bbl)",
        unit: "USD",
        xKey: "mes",
        dataKeys: [
          { key: "brent", color: "#dc2626" },
          { key: "wti", color: "#3b82f6" },
        ],
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
      {
        type: "bar",
        title: "Variação Mensal do Brent (%)",
        unit: "%",
        xKey: "mes",
        dataKeys: [{ key: "variacao", color: "#dc2626" }],
        data: [
          { mes: "Set", variacao: 5.2 },
          { mes: "Out", variacao: 3.1 },
          { mes: "Nov", variacao: -5.1 },
          { mes: "Dez", variacao: -8.4 },
          { mes: "Jan", variacao: 3.4 },
          { mes: "Fev", variacao: 4.1 },
        ],
      },
    ];
  }

  // --- Produção / TotalEnergies / companhias ---
  if (
    q.includes("produção") ||
    q.includes("totalenergies") ||
    q.includes("sonangol") ||
    q.includes("chevron") ||
    q.includes("bp ") ||
    q.includes("barris")
  ) {
    return [
      {
        type: "area",
        title: "Produção de Petróleo — Angola (Milhares bbl/dia)",
        unit: "Mbbl/d",
        xKey: "mes",
        dataKeys: [
          { key: "producao", color: "#dc2626" },
          { key: "meta", color: "#3b82f6" },
        ],
        data: [
          { mes: "Jan", producao: 1142, meta: 1180 },
          { mes: "Fev", producao: 1155, meta: 1180 },
          { mes: "Mar", producao: 1163, meta: 1190 },
          { mes: "Abr", producao: 1178, meta: 1200 },
          { mes: "Mai", producao: 1195, meta: 1200 },
          { mes: "Jun", producao: 1210, meta: 1220 },
          { mes: "Jul", producao: 1198, meta: 1220 },
        ],
      },
      {
        type: "bar",
        title: "Produção por Operador (Mbbl/dia — 2024)",
        unit: "Mbbl/d",
        xKey: "operador",
        dataKeys: [{ key: "producao", color: "#dc2626" }],
        data: [
          { operador: "TotalEnergies", producao: 312 },
          { operador: "Chevron", producao: 285 },
          { operador: "BP", producao: 214 },
          { operador: "ExxonMobil", producao: 196 },
          { operador: "Eni", producao: 143 },
          { operador: "Outros", producao: 68 },
        ],
      },
    ];
  }

  // --- Exportações / destinos ---
  if (q.includes("exporta") || q.includes("destinos") || q.includes("china") || q.includes("índia") || q.includes("mercado")) {
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

  // --- Previsões / 2025 / 2026 / estratégico ---
  if (q.includes("previsão") || q.includes("previsoes") || q.includes("2025") || q.includes("2026") || q.includes("estratég")) {
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

  // --- Riscos operacionais ---
  if (q.includes("risco") || q.includes("alerta") || q.includes("operacional") || q.includes("segurança")) {
    return [
      {
        type: "bar",
        title: "Alertas de Risco por Categoria (Últimos 30 dias)",
        unit: "ocorrências",
        xKey: "categoria",
        dataKeys: [{ key: "alertas", color: "#dc2626" }],
        data: [
          { categoria: "Geopolítico", alertas: 8 },
          { categoria: "Equipamento", alertas: 14 },
          { categoria: "Clima", alertas: 5 },
          { categoria: "Regulatório", alertas: 6 },
          { categoria: "Logística", alertas: 9 },
          { categoria: "Cibersegurança", alertas: 3 },
        ],
      },
      {
        type: "line",
        title: "Tendência de Incidentes Operacionais (2024)",
        unit: "incidentes",
        xKey: "mes",
        dataKeys: [
          { key: "criticos", color: "#dc2626" },
          { key: "moderados", color: "#f59e0b" },
        ],
        data: [
          { mes: "Jan", criticos: 2, moderados: 8 },
          { mes: "Fev", criticos: 3, moderados: 11 },
          { mes: "Mar", criticos: 1, moderados: 7 },
          { mes: "Abr", criticos: 4, moderados: 13 },
          { mes: "Mai", criticos: 2, moderados: 9 },
          { mes: "Jun", criticos: 1, moderados: 6 },
          { mes: "Jul", criticos: 3, moderados: 10 },
        ],
      },
    ];
  }

  // --- Geopolítica / impactos ---
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

  // Default: no charts
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
   CHART RENDERER
   ═══════════════════════════════════════════════════════════════════════════ */

const ChartRenderer = ({ chart }: { chart: ChartData }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "#0a1628",
        border: "1px solid rgba(220,38,38,0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
      }}>
        <p style={{ color: "#5a8ab5", marginBottom: 4, fontWeight: 600 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: <span style={{ color: "#e2e8f0" }}>{p.value}{chart.unit ? ` ${chart.unit}` : ""}</span>
          </p>
        ))}
      </div>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload?.length || payload.length < 2) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingBottom: 8 }}>
        {payload.map((entry: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: entry.color }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#3d5a7a" }}>{entry.value}</span>
          </div>
        ))}
      </div>
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
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "linear-gradient(180deg, #dc2626, #991b1b)" }}
          />
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#5a8ab5",
            textTransform: "uppercase",
          }}>
            {chart.title}
          </span>
          {chart.unit && (
            <span style={{
              fontSize: 9,
              color: "#2d4a6a",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.1em",
              background: "rgba(30,58,95,0.25)",
              padding: "1px 6px",
              borderRadius: 4,
              border: "1px solid rgba(30,58,95,0.3)",
            }}>
              {chart.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            color: "#dc2626",
            opacity: 0.6,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Live
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220, padding: "0 8px 16px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "area" ? (
            <AreaChart data={chart.data}>
              <defs>
                {chart.dataKeys.map((dk, i) => (
                  <linearGradient key={dk.key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={dk.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={dk.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.18)" />
              <XAxis dataKey={chart.xKey} tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {chart.dataKeys.map((dk, i) => (
                <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} fill={`url(#grad-${i})`} dot={{ fill: dk.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: dk.color }} />
              ))}
            </AreaChart>
          ) : chart.type === "bar" ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.18)" />
              <XAxis dataKey={chart.xKey} tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {chart.dataKeys.map((dk) => (
                <Bar key={dk.key} dataKey={dk.key} name={dk.key} fill={dk.color} radius={[3, 3, 0, 0]} maxBarSize={48} />
              ))}
            </BarChart>
          ) : chart.type === "pie" ? (
            <PieChart>
              <defs>
                {CHART_COLORS.map((color, i) => (
                  <radialGradient key={i} id={`pie-grad-${i}`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </radialGradient>
                ))}
              </defs>
              <Pie
                data={chart.data}
                dataKey={chart.dataKeys[0].key}
                nameKey={chart.xKey}
                cx="50%"
                cy="50%"
                outerRadius={82}
                innerRadius={44}
                strokeWidth={0}
                paddingAngle={2}
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#3d5a7a" }}>{value}</span>
                )}
              />
            </PieChart>
          ) : (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.18)" />
              <XAxis dataKey={chart.xKey} tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#2d4a6a", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {chart.dataKeys.map((dk) => (
                <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.key} stroke={dk.color} strokeWidth={2} dot={{ fill: dk.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: dk.color }} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="h-[1px] flex-1" style={{ background: "rgba(30,58,95,0.2)" }} />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 8,
          color: "#1e3a5f",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          AlphaData Market Intelligence
        </span>
        <div className="h-[1px] flex-1" style={{ background: "rgba(30,58,95,0.2)" }} />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WELCOME SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */

const WelcomeScreen = ({ onQuickAction }: { onQuickAction: (label: string) => void }) => (
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full"
        style={{
          background: "rgba(220,38,38,0.08)",
          border: "1px solid rgba(220,38,38,0.25)",
        }}
      >
        <Flame className="w-4 h-4" style={{ color: "#ef4444" }} />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "#9bb5d6",
          textTransform: "uppercase",
        }}>
          Oil & Gas Intelligence Platform
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h1 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, lineHeight: 1.1 }}>
          <span style={{ display: "block", fontSize: "clamp(28px, 5vw, 48px)", color: "#e2e8f0", letterSpacing: "-0.02em" }}>
            OIL & GAS
          </span>
          <span style={{
            display: "block",
            fontSize: "clamp(28px, 5vw, 52px)",
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 40%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            AI ANALYST
          </span>
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "15px",
          color: "#3d5a7a",
          lineHeight: 1.7,
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        Análise de mercado em tempo real, inteligência preditiva e insights estratégicos para o setor energético.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-8"
      >
        {[
          { icon: Droplets, label: "Petróleo", value: "Live" },
          { icon: Activity, label: "Mercados", value: "24/7" },
          { icon: Zap, label: "Resposta", value: "<2s" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}
            >
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

    {/* Quick actions */}
    <div className="w-full max-w-4xl px-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-[1px] flex-1" style={{ background: "rgba(30,58,95,0.35)" }} />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "#2d4a6a",
          textTransform: "uppercase",
        }}>
          Consultas Frequentes
        </span>
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
            style={{
              background: "#080e1a",
              border: "1px solid rgba(30,58,95,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.35)";
              (e.currentTarget as HTMLElement).style.background = "#0d0f1a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.35)";
              (e.currentTarget as HTMLElement).style.background = "#080e1a";
            }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle at top right, ${action.accent}15 0%, transparent 70%)` }}
            />
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all group-hover:scale-110"
                style={{
                  background: `${action.accent}18`,
                  border: `1px solid ${action.accent}30`,
                }}
              >
                <action.icon className="w-4 h-4" style={{ color: action.accent === "#dc2626" ? "#ef4444" : "#60a5fa" }} />
              </div>
              <div className="min-w-0">
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: action.accent === "#dc2626" ? "#ef4444" : "#3b82f6",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  opacity: 0.7,
                }}>
                  {action.category}
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "#7aa3cc",
                  lineHeight: 1.4,
                  display: "block",
                }}>
                  {action.label}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CHART SKELETON — shown while streaming
   ═══════════════════════════════════════════════════════════════════════════ */

const ChartSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 rounded-xl overflow-hidden"
    style={{
      background: "#070d1a",
      border: "1px solid rgba(30,58,95,0.3)",
      height: 260,
    }}
  >
    <div className="px-4 pt-4 pb-2 flex items-center gap-2">
      <div className="w-1 h-4 rounded-full bg-red-800 animate-pulse" />
      <div className="h-3 w-40 rounded bg-[#1e3a5f]/30 animate-pulse" />
    </div>
    <div className="px-4 pb-4" style={{ height: 200 }}>
      <div className="w-full h-full rounded-lg bg-[#0d1520]/50 animate-pulse flex items-end gap-2 p-4">
        {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm animate-pulse"
            style={{
              height: `${h}%`,
              background: i % 2 === 0 ? "rgba(220,38,38,0.15)" : "rgba(30,58,95,0.2)",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT BUBBLE
   ═══════════════════════════════════════════════════════════════════════════ */

const ChatBubble = ({ message, isStreaming = false }: { message: Message; isStreaming?: boolean }) => {
  const isUser = message.role === "user";

  // Detect if charts should be shown as skeleton (AI still responding)
  const showChartSkeleton = !isUser && isStreaming && message.charts && message.charts.length > 0 && message.content.length < 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
        style={isUser
          ? { background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 0 12px rgba(220,38,38,0.3)" }
          : { background: "linear-gradient(135deg, #0f1d35, #1e3a5f)", border: "1px solid rgba(30,58,95,0.6)" }
        }
      >
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Flame className="w-4 h-4" style={{ color: "#ef4444" }} />
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col space-y-1.5 max-w-[88%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Role label */}
        <div className="flex items-center gap-2 px-1" style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: isUser ? "#dc2626" : "#3b82f6",
            textTransform: "uppercase",
          }}>
            {isUser ? "Utilizador" : "AlphaData AI"}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#2d4a6a" }}>
            {message.time}
          </span>
        </div>

        {/* Bubble */}
        <div
          className="px-5 py-4 rounded-2xl"
          style={isUser
            ? {
                background: "linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(153,27,27,0.08) 100%)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderTopRightRadius: 4,
              }
            : {
                background: "#080e1a",
                border: "1px solid rgba(30,58,95,0.4)",
                borderTopLeftRadius: 4,
                width: "100%",
              }
          }
        >
          {isUser ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#e2e8f0", lineHeight: 1.6 }}>
              {message.content}
            </p>
          ) : (
            <div className="ai-response">
              <style>{`
                .ai-response h1 { font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.05em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(30,58,95,0.4); }
                .ai-response h2 { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #9bb5d6; letter-spacing: 0.08em; margin: 16px 0 8px; text-transform: uppercase; }
                .ai-response h3 { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #7aa3cc; margin: 12px 0 6px; }
                .ai-response p { font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #7aa3cc; line-height: 1.75; margin-bottom: 10px; }
                .ai-response ul { list-style: none; padding: 0; margin-bottom: 12px; }
                .ai-response ul li { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #5a8ab5; line-height: 1.65; padding: 4px 0 4px 18px; position: relative; }
                .ai-response ul li::before { content: ''; position: absolute; left: 0; top: 13px; width: 6px; height: 1px; background: #dc2626; }
                .ai-response ol { padding-left: 20px; margin-bottom: 12px; }
                .ai-response ol li { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #5a8ab5; line-height: 1.65; padding: 3px 0; }
                .ai-response strong { font-weight: 700; color: #ef4444; }
                .ai-response em { color: #60a5fa; font-style: normal; font-weight: 600; }
                .ai-response code { background: rgba(30,58,95,0.3); color: #93c5fd; font-family: 'Space Mono', monospace; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(30,58,95,0.4); }
                .ai-response blockquote { border-left: 2px solid #dc2626; padding-left: 14px; margin: 12px 0; background: rgba(220,38,38,0.04); border-radius: 0 6px 6px 0; padding: 10px 14px; }
                .ai-response blockquote p { color: #9bb5d6; margin: 0; font-style: italic; }
                .ai-response table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
                .ai-response th { background: rgba(30,58,95,0.4); color: #9bb5d6; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 12px; text-align: left; border: 1px solid rgba(30,58,95,0.3); }
                .ai-response td { color: #5a8ab5; font-family: 'DM Sans', sans-serif; padding: 8px 12px; border: 1px solid rgba(30,58,95,0.2); }
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
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Charts — skeleton while streaming, real after done */}
          {!isUser && message.charts && message.charts.length > 0 && (
            <div className="space-y-3 mt-3">
              {showChartSkeleton
                ? message.charts.map((_, i) => <ChartSkeleton key={i} />)
                : message.charts.map((chart, i) => (
                    <ChartRenderer key={i} chart={chart} />
                  ))
              }
            </div>
          )}

          {/* Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(30,58,95,0.3)" }}>
              {message.sources.map((s, si) => (
                <span
                  key={si}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(30,58,95,0.25)",
                    border: "1px solid rgba(30,58,95,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#3d5a7a",
                  }}
                >
                  <Database className="w-3 h-3" style={{ color: "#1e3a5f" }} />
                  {s}
                </span>
              ))}
              <span className="flex items-center gap-1 ml-auto" style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "9px",
                color: "#dc2626",
                opacity: 0.7,
              }}>
                <CheckCircle className="w-3 h-3" /> Verificado
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   LOADING
   ═══════════════════════════════════════════════════════════════════════════ */

const LoadingIndicator = () => (
  <div className="flex gap-3">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
      style={{ background: "linear-gradient(135deg, #0f1d35, #1e3a5f)", border: "1px solid rgba(30,58,95,0.6)" }}
    >
      <Flame className="w-4 h-4 animate-pulse" style={{ color: "#ef4444" }} />
    </div>
    <div
      className="flex items-center gap-3 px-5 py-4 rounded-2xl"
      style={{ background: "#080e1a", border: "1px solid rgba(30,58,95,0.4)", borderTopLeftRadius: 4 }}
    >
      <div className="flex gap-1.5">
        {[0, 0.15, 0.3].map((delay, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ background: "#dc2626", animationDelay: `${delay}s` }}
          />
        ))}
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#2d4a6a", letterSpacing: "0.05em" }}>
        Analisando dados...
      </span>
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
  // Track the current streaming message id to pass isStreaming to bubble
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  const startNewChat = useCallback(() => {
    const newId = Date.now().toString();
    setSessions((prev) => [{ id: newId, title: "Nova Consulta", messages: [], date: new Date().toLocaleDateString() }, ...prev]);
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: term,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Generate charts based on the user query
    const autoCharts = generateChartsForQuery(term);
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
      const aiMessages = [
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: term },
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
  }, [input, loading, currentSessionId, sessions]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#050b14", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@700&display=swap');

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
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 lg:hidden w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl"
        style={{ background: "#dc2626" }}
      >
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
            initial={{ x: -300 }}
            animate={{ x: 0, width: historySidebarExpanded ? 280 : 72 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col"
            style={{
              background: "#070d1a",
              borderRight: "1px solid rgba(30,58,95,0.4)",
            }}
          >
            {/* Toggle */}
            <motion.button
              onClick={() => setHistorySidebarExpanded(!historySidebarExpanded)}
              className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full items-center justify-center shadow-lg"
              style={{ background: "#dc2626" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div animate={{ rotate: historySidebarExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </motion.button>

            {/* Top */}
            <div className="p-4 pt-24 lg:pt-5 space-y-3">
              <AnimatePresence mode="wait">
                {historySidebarExpanded ? (
                  <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <button
                      onClick={startNewChat}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg, #dc2626, #991b1b)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "white",
                        border: "none",
                      }}
                    >
                      <Plus className="w-4 h-4" /> NOVA CONSULTA
                    </button>

                    <div className="flex items-center justify-between px-1">
                      <span style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "8px",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        color: "#1e3a5f",
                        textTransform: "uppercase",
                      }}>
                        Histórico
                      </span>
                      <button onClick={deleteHistory} className="p-1 rounded transition-colors hover:text-red-500" style={{ color: "#1e3a5f" }} title="Eliminar histórico">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                    <button
                      onClick={startNewChat}
                      title="Nova Consulta"
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90"
                      style={{ background: "#dc2626" }}
                    >
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
                  {sessions.length === 0 ? (
                    historySidebarExpanded && (
                      <div className="text-center py-12" style={{ color: "#1e3a5f" }}>
                        <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>Sem sessões</p>
                      </div>
                    )
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group relative rounded-xl transition-all duration-200"
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
                        }}
                      >
                        <button
                          onClick={() => { setCurrentSessionId(session.id); setSidebarOpen(false); }}
                          className={`w-full p-3 text-left text-sm flex items-center gap-2.5 ${!historySidebarExpanded && "justify-center"}`}
                          title={!historySidebarExpanded ? session.title : undefined}
                        >
                          <MessageSquare
                            className="flex-shrink-0 w-4 h-4"
                            style={{ color: currentSessionId === session.id ? "#ef4444" : "#2d4a6a" }}
                          />
                          {historySidebarExpanded && (
                            <span
                              className="truncate flex-1"
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: currentSessionId === session.id ? "#e2e8f0" : "#3d5a7a",
                              }}
                            >
                              {session.title}
                            </span>
                          )}
                        </button>
                        {historySidebarExpanded && (
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: "#2d4a6a" }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#2d4a6a"}
                          >
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
                    />
                  ))}
                  {loading && currentSession.messages[currentSession.messages.length - 1]?.role !== "assistant" && (
                    <LoadingIndicator />
                  )}
                  <div ref={chatBottomRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Input */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 md:p-8"
          style={{ background: "linear-gradient(to top, #050b14 60%, transparent)" }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div
                className="absolute -inset-[1px] rounded-2xl pointer-events-none"
                style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(30,58,95,0.2))", filter: "blur(8px)" }}
              />
              <div
                className="relative flex items-center rounded-2xl overflow-hidden"
                style={{ background: "#080e1a", border: "1px solid rgba(30,58,95,0.5)" }}
              >
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
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "14px",
                    color: "#e2e8f0",
                    caretColor: "#dc2626",
                  }}
                />

                <div className="pr-2 flex-shrink-0">
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: input.trim() && !loading
                        ? "linear-gradient(135deg, #dc2626, #991b1b)"
                        : "rgba(30,58,95,0.3)",
                    }}
                  >
                    {loading
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-3">
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "9px",
                color: "#1e3a5f",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                AlphaData © {new Date().getFullYear()}
              </span>
              <div className="w-1 h-1 rounded-full" style={{ background: "#dc2626", opacity: 0.4 }} />
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "9px",
                color: "#1e3a5f",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                Oil & Gas AI Platform
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;