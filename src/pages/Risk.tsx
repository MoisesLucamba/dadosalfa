import { useState, useEffect, useMemo } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Shield,
  Globe,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  MapPin,
  RefreshCw,
  Loader2,
  Clock,
  FileDown,
  ArrowUpRight,
  Activity,
  Zap,
  X,
  Terminal,
  ChevronRight,
  Radio,
  Lock,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RiskHistoryChart } from "@/components/dashboard/RiskHistoryChart";
import { RegulatoryImpactSimulator } from "@/components/dashboard/RegulatoryImpactSimulator";
import { EnergyTransitionRisk } from "@/components/dashboard/EnergyTransitionRisk";
import { DataDepthBadge } from "@/components/dashboard/DataDepthBadge";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { generateRiskPDF } from "@/utils/generateRiskPDF";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Citation {
  title?: string;
  source?: string;
  url?: string;
  date?: string;
}

interface RiskScore {
  category: string;
  score: number;
  trend: "up" | "down" | "stable";
  description: string;
  is_ai_estimated?: boolean;
  confidence_level?: string;
  citations?: Citation[];
  methodology?: string;
}

interface RiskAlert {
  id: string;
  alert_type: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  region: string;
  created_at: string;
  is_ai_estimated?: boolean;
  confidence_level?: string;
  citations?: Citation[];
  source_url?: string;
}

interface CountryRisk {
  country: string;
  score: number;
  trend: string;
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
const ConfidenceBadge = ({ level, isAI, onClick }: { level?: string; isAI?: boolean; onClick?: (e: React.MouseEvent) => void }) => {
  const lvl = (level || "estimated").toLowerCase();
  const cfg = lvl === "verified" || lvl === "official"
    ? { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", label: lvl === "official" ? "OFICIAL" : "VERIFICADO", Icon: CheckCircle2 }
    : lvl === "high"
    ? { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)", label: "ALTA CONFIANÇA", Icon: Shield }
    : { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", label: isAI ? "IA-ESTIMADO" : "ESTIMADO", Icon: Sparkles };
  const Icon = cfg.Icon;
  const Tag: any = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick ? (e: React.MouseEvent) => { e.stopPropagation(); onClick(e); } : undefined}
      className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider ${onClick ? "cursor-pointer hover:brightness-125 transition" : ""}`}
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      title={onClick ? "Clica para ver metodologia, parâmetros e fontes completas" : (isAI ? "Estimativa baseada em modelos de IA — verificar fontes" : "Nível de confiança")}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </Tag>
  );
};

// ─── Citations list ───────────────────────────────────────────────────────────
const CitationsList = ({ citations, sourceUrl }: { citations?: Citation[]; sourceUrl?: string }) => {
  const items = Array.isArray(citations) ? citations : [];
  if (!items.length && !sourceUrl) return null;
  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-2.5 h-2.5" style={{ color: "hsl(var(--muted-foreground))" }} />
        <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          FONTES & CITAÇÕES ({items.length || 1})
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((c, idx) => {
          const href = c.url;
          const label = c.title || c.source || c.url || `Fonte ${idx + 1}`;
          return (
            <li key={idx}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-start gap-1.5 text-[9px] hover:underline group"
                  style={{ color: "#60a5fa" }}
                >
                  <ExternalLink className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  <span className="flex-1">
                    {label}
                    {c.source && c.title && (
                      <span className="ml-1 opacity-60">— {c.source}</span>
                    )}
                    {c.date && <span className="ml-1 opacity-50">({c.date})</span>}
                  </span>
                </a>
              ) : (
                <div className="flex items-start gap-1.5 text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  <span>{label}{c.source ? ` — ${c.source}` : ""}</span>
                </div>
              )}
            </li>
          );
        })}
        {sourceUrl && !items.some((c) => c.url === sourceUrl) && (
          <li>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-start gap-1.5 text-[9px] hover:underline"
              style={{ color: "#60a5fa" }}
            >
              <ExternalLink className="w-2.5 h-2.5 mt-0.5 shrink-0" />
              <span>Fonte primária</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
export interface RiskDetailPayload {
  kind: "score" | "alert";
  title: string;
  subtitle?: string;
  level?: string;
  isAI?: boolean;
  score?: number;
  trend?: string;
  description?: string;
  region?: string;
  alertType?: string;
  createdAt?: string;
  methodology?: string;
  parameters?: Array<{ label: string; value: string | number }>;
  citations?: Citation[];
  sourceUrl?: string;
}

const RiskDetailModal = ({ payload, onOpenChange }: { payload: RiskDetailPayload | null; onOpenChange: (o: boolean) => void }) => {
  const open = !!payload;
  const accent = payload?.score !== undefined ? scoreColor(payload.score) : "#a78bfa";
  const cites = payload?.citations || [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ background: "hsl(var(--card))", border: `1px solid ${accent}33`, fontFamily: "'IBM Plex Mono', monospace" }}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {payload?.kind === "alert" ? "ALERTA // DETALHE" : "SCORE // METODOLOGIA"}
            </span>
            {payload && (payload.isAI || payload.level) && (
              <ConfidenceBadge level={payload.level} isAI={payload.isAI} />
            )}
          </div>
          <DialogTitle className="text-base font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            {payload?.title}
          </DialogTitle>
          {payload?.subtitle && (
            <DialogDescription className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {payload.subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {payload?.score !== undefined && (
          <div className="flex items-baseline gap-3 py-2">
            <span className="text-[42px] font-bold tabular-nums leading-none" style={{ color: accent, letterSpacing: "-0.04em" }}>{payload.score}</span>
            <span className="text-[10px] opacity-60">/100</span>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: accent }}>{scoreLabel(payload.score)}</span>
            {payload.trend && (
              <span className="text-[9px] tracking-wider opacity-70 ml-auto">TENDÊNCIA: {payload.trend.toUpperCase()}</span>
            )}
          </div>
        )}

        {payload?.description && (
          <div className="mt-2">
            <div className="text-[8px] font-bold tracking-[0.2em] mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>RESUMO</div>
            <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{payload.description}</p>
          </div>
        )}

        {payload?.parameters && payload.parameters.length > 0 && (
          <div className="mt-3">
            <div className="text-[8px] font-bold tracking-[0.2em] mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>PARÂMETROS UTILIZADOS</div>
            <div className="grid grid-cols-2 gap-2">
              {payload.parameters.map((p, i) => (
                <div key={i} className="p-2 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[8px] tracking-wider opacity-60">{p.label}</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {payload?.methodology ? (
          <div className="mt-3">
            <div className="text-[8px] font-bold tracking-[0.2em] mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>METODOLOGIA</div>
            <p className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--foreground))", background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", padding: "10px", borderRadius: "4px" }}>
              {payload.methodology}
            </p>
          </div>
        ) : (
          <div className="mt-3 text-[9px] italic opacity-60">
            Sem metodologia documentada — score derivado de heurísticas IA. Verificar fontes abaixo.
          </div>
        )}

        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              FONTES COMPLETAS ({cites.length}{payload?.sourceUrl ? "+1" : ""})
            </span>
          </div>
          {cites.length === 0 && !payload?.sourceUrl && (
            <p className="text-[9px] italic opacity-60">Nenhuma citação registada para este item.</p>
          )}
          <ul className="space-y-1.5">
            {cites.map((c, i) => (
              <li key={i} className="p-2 rounded" style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#60a5fa" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {c.title || c.source || c.url || `Fonte ${i + 1}`}
                    </div>
                    {c.source && c.title && (
                      <div className="text-[9px] opacity-70">{c.source}</div>
                    )}
                    {c.date && <div className="text-[8px] opacity-60">{c.date}</div>}
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[9px] hover:underline break-all" style={{ color: "#60a5fa" }}>
                        {c.url}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {payload?.sourceUrl && !cites.some(c => c.url === payload.sourceUrl) && (
              <li className="p-2 rounded" style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#60a5fa" }} />
                  <a href={payload.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline break-all" style={{ color: "#60a5fa" }}>
                    {payload.sourceUrl}
                  </a>
                </div>
              </li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Pulse = ({ color = "#ef4444" }: { color?: string }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
  </span>
);

// ─── Score color helpers ──────────────────────────────────────────────────────
const scoreColor = (s: number) =>
  s > 70 ? "#ef4444" : s > 50 ? "#f97316" : s > 30 ? "#f59e0b" : "#4ade80";

const scoreLabel = (s: number) =>
  s > 70 ? "CRÍTICO" : s > 50 ? "ELEVADO" : s > 30 ? "MODERADO" : "ESTÁVEL";

// ─── Custom Radar Tooltip ─────────────────────────────────────────────────────
const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div
      className="px-3 py-2 text-[10px] font-bold"
      style={{ background: "hsl(var(--card))", border: `1px solid ${scoreColor(score)}44`, borderRadius: "4px", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div style={{ color: "hsl(var(--muted-foreground))" }}>{payload[0].payload.category}</div>
      <div style={{ color: scoreColor(score), fontSize: "18px", letterSpacing: "-0.03em" }}>{score}<span style={{ fontSize: "10px", opacity: 0.6 }}>/100</span></div>
      <div style={{ color: scoreColor(score) }}>{scoreLabel(score)}</div>
    </div>
  );
};

// ─── Alert row ────────────────────────────────────────────────────────────────
const alertConfig = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  icon: AlertTriangle, label: "CRÍTICO"  },
  warning:  { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", icon: AlertCircle,   label: "AVISO"    },
  info:     { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)", icon: Info,          label: "INFO"     },
};

// ═════════════════════════════════════════════════════════════════════════════
const Risk = () => {
  const [riskScores, setRiskScores]   = useState<RiskScore[]>([]);
  const [alerts, setAlerts]           = useState<RiskAlert[]>([]);
  const [countryRisks, setCountryRisks] = useState<CountryRisk[]>([]);
  const [loading, setLoading]         = useState(true);
  const [analyzing, setAnalyzing]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [activeTab, setActiveTab]     = useState<"risk" | "transition">("risk");
  const [now, setNow]                 = useState(new Date());
  const [bootDone, setBootDone]       = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [detail, setDetail] = useState<RiskDetailPayload | null>(null);

  const openScoreDetail = (r: RiskScore) => setDetail({
    kind: "score",
    title: r.category,
    subtitle: "Score categórico de risco para o sector petrolífero angolano",
    level: r.confidence_level,
    isAI: r.is_ai_estimated,
    score: r.score,
    trend: r.trend,
    description: r.description,
    methodology: r.methodology,
    parameters: [
      { label: "Categoria", value: r.category },
      { label: "Score", value: `${r.score}/100` },
      { label: "Classificação", value: scoreLabel(r.score) },
      { label: "Tendência", value: (r.trend || "—").toString().toUpperCase() },
      { label: "Confiança", value: (r.confidence_level || "estimated").toUpperCase() },
      { label: "Origem", value: r.is_ai_estimated ? "Estimativa IA" : "Verificado" },
    ],
    citations: r.citations,
  });

  const openAlertDetail = (a: RiskAlert) => setDetail({
    kind: "alert",
    title: a.title,
    subtitle: a.region ? `Região: ${a.region}` : undefined,
    level: a.confidence_level,
    isAI: a.is_ai_estimated,
    description: a.description,
    region: a.region,
    alertType: a.alert_type,
    createdAt: a.created_at,
    parameters: [
      { label: "Tipo", value: (a.alert_type || "info").toUpperCase() },
      { label: "Impacto", value: (a.impact || "—").toString().toUpperCase() },
      { label: "Região", value: a.region || "—" },
      { label: "Emitido", value: new Date(a.created_at).toLocaleString("pt-PT") },
      { label: "Confiança", value: (a.confidence_level || "estimated").toUpperCase() },
      { label: "Origem", value: a.is_ai_estimated ? "Estimativa IA" : "Verificado" },
    ],
    citations: a.citations,
    sourceUrl: a.source_url,
  });

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 950); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCategoryName = (cat: string) => ({
    geopolitical: "GEOPOLÍTICO", regulatory: "REGULATÓRIO", fiscal: "FISCAL",
    operational: "OPERACIONAL", currency: "CAMBIAL", environmental: "AMBIENTAL",
  }[cat] ?? cat.toUpperCase());

  const formatTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h > 24) return `${Math.floor(h / 24)}D AGO`;
    if (h > 0)  return `${h}H AGO`;
    return `${Math.floor((diff % 3600000) / 60000)}M AGO`;
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const [riskResult, alertsResult, countryResult] = await Promise.all([
        supabase.from("risk_data").select("*").order("created_at", { ascending: false }),
        supabase.from("risk_alerts").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("country_risk").select("*").order("data_date", { ascending: false }),
      ]);
      if (riskResult.data?.length) {
        const latest = riskResult.data.reduce((acc: Record<string, RiskScore>, item: any) => {
          if (!acc[item.category]) acc[item.category] = {
            category: getCategoryName(item.category),
            score: item.score,
            trend: item.trend as any,
            description: item.description,
            is_ai_estimated: item.is_ai_estimated,
            confidence_level: item.confidence_level,
            citations: item.citations,
            methodology: item.methodology,
          };
          return acc;
        }, {});
        setRiskScores(Object.values(latest));
        setLastUpdated(riskResult.data[0]?.updated_at);
      }
      if (alertsResult.data?.length) setAlerts(alertsResult.data as any);
      if (countryResult.data?.length) {
        const latest = countryResult.data.reduce((acc: Record<string, CountryRisk>, item) => {
          if (!acc[item.country]) acc[item.country] = { country: item.country, score: item.score, trend: item.trend };
          return acc;
        }, {});
        setCountryRisks(Object.values(latest));
      }
    } catch { toast.error("FALHA — Dados de risco indisponíveis"); }
    finally { setLoading(false); }
  };

  const analyzeRisks = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-risks");
      if (error) throw error;
      if (data?.success) { toast.success("INTELIGÊNCIA ACTUALIZADA // SYS OK"); fetchRiskData(); }
    } catch { toast.error("ANÁLISE FALHOU — Tentar novamente"); }
    finally { setAnalyzing(false); }
  };

  useEffect(() => { fetchRiskData(); }, []);

  const globalRiskIndex = useMemo(() => {
    if (!riskScores.length) return 0;
    const weights: Record<string, number> = { "GEOPOLÍTICO": 0.25, "REGULATÓRIO": 0.2, "FISCAL": 0.2, "OPERACIONAL": 0.15, "CAMBIAL": 0.1, "AMBIENTAL": 0.1 };
    return Math.round(riskScores.reduce((s, r) => s + r.score * (weights[r.category] ?? 0.15), 0));
  }, [riskScores]);

  const criticalCount = alerts.filter(a => a.alert_type === "critical").length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Helmet><title>Elastra — Risco & Geopolítica</title></Helmet>

      <Sidebar activeItem="/risk" />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Header activeItem="/risk" />

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: bootDone ? 1 : 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between px-6 py-2 border-b shrink-0"
          style={{ borderColor: "rgba(220,38,38,0.12)", background: "rgba(220,38,38,0.03)" }}
        >
          <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1.5" style={{ color: criticalCount > 0 ? "#f87171" : "#4ade80" }}>
              <Pulse color={criticalCount > 0 ? "#ef4444" : "#4ade80"} />
              {criticalCount > 0 ? `${criticalCount} ALERTA(S) CRÍTICO(S)` : "SISTEMA ESTÁVEL"}
            </span>
            <span className="opacity-40">|</span>
            <span>MÓDULO: RISCO & GEOPOLÍTICA</span>
            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> CLASSIFICAÇÃO: RESTRITO</span>
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
            {lastUpdated && <span className="mr-3 opacity-50">UPD: {formatTimeAgo(lastUpdated)}</span>}
            <span style={{ color: "hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12: false })}</span>
          </div>
        </motion.div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: bootDone ? 1 : 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
            >
              <div>
                <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Terminal className="w-3 h-3 text-red-500" />
                  <span>ALPHADAT-OS</span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                  <span>INTELLIGENCE</span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                  <span style={{ color: "hsl(var(--foreground))" }}>RISCO</span>
                </div>
                <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                  MÓDULO-06 // THREAT INTELLIGENCE
                </div>
                <h1 className="font-bold leading-none" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.02em" }}>
                  RISCO & GEOPOLÍTICA
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="h-[1px] w-12 bg-red-600" />
                  <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                    MONITORIZAÇÃO AVANÇADA DE AMEAÇAS REGULATÓRIAS E DINÂMICAS DE PODER
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => generateRiskPDF({ riskScores, alerts, countryRisks, geopoliticalForecasts: [], globalRiskIndex })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold tracking-widest transition-all border"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  EXPORTAR
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeRisks}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold tracking-widest"
                  style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", boxShadow: "0 0 20px rgba(220,38,38,0.3)", border: "1px solid rgba(220,38,38,0.5)", opacity: analyzing ? 0.7 : 1 }}
                >
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {analyzing ? "PROCESSANDO..." : "ACTUALIZAR INTEL"}
                </motion.button>
              </div>
            </motion.div>

            {/* ── Tab Toggle ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: bootDone ? 1 : 0 }}
              transition={{ delay: 0.25 }}
              className="flex rounded overflow-hidden text-[10px] font-bold tracking-widest w-fit"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "hsl(var(--card))" }}
            >
              {(["risk", "transition"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-2 px-5 py-2.5 transition-all duration-150"
                  style={activeTab === tab ? { background: "rgba(255,255,255,0.07)", color: "hsl(var(--foreground))" } : { color: "hsl(var(--muted-foreground))" }}
                >
                  {tab === "risk" ? "RISCO & GEOPOLÍTICA" : (
                    <>
                      TRANSITION RISK
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}>NEW</span>
                    </>
                  )}
                </button>
              ))}
            </motion.div>

            {activeTab === "transition" ? (
              <EnergyTransitionRisk />
            ) : (
              <>
                {/* ── KPI Grid ── */}
                <motion.div
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    {
                      label: "ÍNDICE GLOBAL",
                      value: globalRiskIndex,
                      suffix: "/100",
                      sub: scoreLabel(globalRiskIndex),
                      icon: Shield,
                      color: scoreColor(globalRiskIndex),
                      tag: "GRI",
                    },
                    {
                      label: "GEOPOLÍTICO",
                      value: riskScores.find(r => r.category === "GEOPOLÍTICO")?.score ?? 0,
                      suffix: "/100",
                      sub: null,
                      icon: Globe,
                      color: scoreColor(riskScores.find(r => r.category === "GEOPOLÍTICO")?.score ?? 0),
                      tag: "GEO",
                      trend: riskScores.find(r => r.category === "GEOPOLÍTICO")?.trend,
                    },
                    {
                      label: "REGULATÓRIO",
                      value: riskScores.find(r => r.category === "REGULATÓRIO")?.score ?? 0,
                      suffix: "/100",
                      sub: "IMPACTO MÉDIO",
                      icon: Scale,
                      color: scoreColor(riskScores.find(r => r.category === "REGULATÓRIO")?.score ?? 0),
                      tag: "REG",
                    },
                    {
                      label: "ALERTAS ACTIVOS",
                      value: alerts.length,
                      suffix: "",
                      sub: `${criticalCount} CRÍTICOS`,
                      icon: AlertTriangle,
                      color: criticalCount > 0 ? "#ef4444" : alerts.length > 0 ? "#f97316" : "#4ade80",
                      tag: "ALT",
                    },
                  ].map((k, i) => (
                    <motion.div
                      key={k.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 10 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className="relative overflow-hidden rounded p-5 group cursor-default"
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${k.color}33`}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                    >
                      <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5" style={{ background: `${k.color}18`, color: k.color, borderBottomLeftRadius: "4px" }}>
                        {k.tag}
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                        <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{k.label}</span>
                        {"trend" in k && k.trend && (
                          <span className="ml-auto" style={{ color: k.trend === "up" ? "#ef4444" : "#4ade80" }}>
                            {k.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      {loading ? (
                        <div className="h-8 w-16 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                      ) : (
                        <div>
                          <span className="text-3xl font-bold tabular-nums" style={{ color: k.color, letterSpacing: "-0.03em" }}>{k.value}</span>
                          <span className="text-[10px] ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>{k.suffix}</span>
                        </div>
                      )}
                      {k.sub && <div className="text-[9px] font-bold mt-1 tracking-wider" style={{ color: k.color }}>{k.sub}</div>}
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                  {/* ── Radar + Score Matrix ── */}
                  <motion.div
                    className="lg:col-span-7 rounded overflow-hidden"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : -12 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-red-500" />
                        <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          VECTOR ANALYSIS // PERFIL DE RISCO MULTIDIMENSIONAL
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Radar */}
                      <div className="h-[340px]">
                        {loading ? (
                          <div className="w-full h-full rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={riskScores.map(r => ({ category: r.category, value: r.score }))}>
                              <PolarGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
                              <PolarAngleAxis
                                dataKey="category"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono" }}
                              />
                              <Radar
                                name="Risco"
                                dataKey="value"
                                stroke="#dc2626"
                                fill="#dc2626"
                                fillOpacity={0.1}
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#dc2626", strokeWidth: 0 }}
                              />
                              <Tooltip content={<RadarTooltip />} />
                            </RadarChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      {/* Score matrix */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                        {riskScores.map((r, i) => {
                          const c = scoreColor(r.score);
                          return (
                            <div
                              key={i}
                              className="p-3 rounded group"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "border-color 0.2s" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${c}33`}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{r.category}</span>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: c }}>{r.score}</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${r.score}%` }}
                                  transition={{ delay: 0.5 + i * 0.07, duration: 0.8 }}
                                  style={{ background: c }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1.5 gap-1">
                                <div className="text-[8px] font-bold tracking-widest" style={{ color: c }}>{scoreLabel(r.score)}</div>
                                <ConfidenceBadge level={r.confidence_level} isAI={r.is_ai_estimated} onClick={() => openScoreDetail(r)} />
                              </div>
                              <button
                                type="button"
                                onClick={() => openScoreDetail(r)}
                                className="mt-2 w-full text-[8px] font-bold tracking-[0.2em] py-1 rounded hover:brightness-125 transition"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                              >
                                VER METODOLOGIA & FONTES →
                              </button>
                              {r.citations && r.citations.length > 0 && (
                                <CitationsList citations={r.citations} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* ── Right Column ── */}
                  <div className="lg:col-span-5 flex flex-col gap-4">

                    {/* Alerts Feed */}
                    <motion.div
                      className="rounded overflow-hidden flex-1"
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : 12 }}
                      transition={{ delay: 0.42 }}
                    >
                      <div
                        className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="w-3 h-3 text-red-500" />
                          <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            THREAT FEED // ALERTAS ACTIVOS
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{
                            background: criticalCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)",
                            color: criticalCount > 0 ? "#f87171" : "#4ade80",
                            border: `1px solid ${criticalCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)"}`,
                          }}
                        >
                          {alerts.length} ACTIVOS
                        </span>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                          {alerts.length > 0 ? alerts.map((alert, i) => {
                            const cfg = alertConfig[alert.alert_type] ?? alertConfig.info;
                            const Icon = cfg.icon;
                            const isSelected = selectedAlert === alert.id;
                            return (
                              <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => setSelectedAlert(isSelected ? null : alert.id)}
                                className="px-5 py-4 cursor-pointer relative"
                                style={{
                                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                                  background: isSelected ? `${cfg.bg}` : "transparent",
                                  transition: "background 0.15s",
                                }}
                              >
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: cfg.color }} />}
                                <div className="flex gap-3">
                                  <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <span className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{alert.title}</span>
                                      <span className="text-[9px] tabular-nums shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>{formatTimeAgo(alert.created_at)}</span>
                                    </div>
                                    <p className={`text-[10px] leading-relaxed ${isSelected ? "" : "line-clamp-1"}`} style={{ color: "hsl(var(--muted-foreground))" }}>
                                      {alert.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      {alert.region && (
                                        <>
                                          <MapPin className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                                          <span className="text-[9px] font-bold tracking-wider" style={{ color: cfg.color }}>{alert.region.toUpperCase()}</span>
                                        </>
                                      )}
                                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                      </span>
                                      <ConfidenceBadge level={alert.confidence_level} isAI={alert.is_ai_estimated} onClick={() => openAlertDetail(alert)} />
                                    </div>
                                    {isSelected && (
                                      <CitationsList citations={alert.citations} sourceUrl={alert.source_url} />
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); openAlertDetail(alert); }}
                                        className="text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 rounded hover:brightness-125 transition"
                                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                                      >
                                        DETALHE & FONTES →
                                      </button>
                                      {!isSelected && ((alert.citations && alert.citations.length > 0) || alert.source_url) && (
                                        <span className="text-[8px] italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                                          {(alert.citations?.length || 0) + (alert.source_url ? 1 : 0)} fonte(s)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }) : (
                            <div className="py-12 text-center text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                              // NENHUM ALERTA ACTIVO
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Simulator CTA */}
                    <motion.div
                      className="rounded overflow-hidden relative"
                      style={{
                        background: "linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.04) 50%, transparent 100%)",
                        border: "1px solid rgba(220,38,38,0.2)",
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 8 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="absolute top-3 right-3 opacity-8">
                        <Activity className="w-20 h-20 text-red-500 opacity-10" />
                      </div>

                      <div className="p-5 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-3 h-3 text-red-500" />
                          <span className="text-[9px] font-bold tracking-[0.25em] text-red-500">MOTOR DE SIMULAÇÃO // ACTIVO</span>
                        </div>
                        <h3 className="text-[13px] font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>SIMULADOR DE IMPACTO REGULATÓRIO</h3>
                        <p className="text-[10px] leading-relaxed mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Calcule o impacto de novas taxas e royalties no seu portfólio com o motor de simulação preditiva.
                        </p>
                        <button
                          onClick={() => setShowSimulator(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
                          style={{
                            background: "linear-gradient(135deg, #dc2626, #991b1b)",
                            color: "white",
                            boxShadow: "0 0 16px rgba(220,38,38,0.25)",
                            border: "1px solid rgba(220,38,38,0.4)",
                          }}
                        >
                          ABRIR SIMULADOR
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ── History + Data Sources ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <motion.div
                    className="lg:col-span-9 rounded overflow-hidden relative"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                    transition={{ delay: 0.55 }}
                  >
                    <div
                      className="flex items-center gap-2 px-5 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        HISTORICAL INTEL // EVOLUÇÃO DO ÍNDICE DE RISCO
                      </span>
                      <div className="ml-auto">
                        <DataDepthBadge startYear={2019} endYear={2025} source="ANPG Annual Reports, Sonangol Production Data, OPEC Statistical Bulletin" />
                      </div>
                    </div>
                    <div className="p-4">
                      <RiskHistoryChart />
                    </div>
                  </motion.div>

                  <motion.div
                    className="lg:col-span-3 rounded overflow-hidden"
                    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : 12 }}
                    transition={{ delay: 0.58 }}
                  >
                    <div
                      className="flex items-center gap-2 px-5 py-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        FONTES // DATA SOURCES
                      </span>
                    </div>
                    <div className="p-4">
                      <DataSourcesPanel />
                    </div>
                  </motion.div>
                </div>
              </>
            )}

          </div>
        </main>

        <MobileBottomNav />
      </div>

      <RiskDetailModal payload={detail} onOpenChange={(o) => !o && setDetail(null)} />

      {/* ── Simulator Modal ── */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid rgba(220,38,38,0.25)",
                borderRadius: "6px",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {/* Modal header bar */}
              <div
                className="flex items-center justify-between px-5 py-3 sticky top-0 z-10"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--background))" }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    SIMULADOR DE IMPACTO REGULATÓRIO // MODO ACTIVO
                  </span>
                </div>
                <button
                  onClick={() => setShowSimulator(false)}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                <RegulatoryImpactSimulator />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Risk;