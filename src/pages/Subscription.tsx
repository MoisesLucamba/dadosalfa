import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Users, ArrowUpRight, ArrowDownRight,
  Check, Clock, FileText, Download, AlertCircle,
  Star, Zap, Building2, Mail, Phone, ChevronRight,
  Calendar, TrendingUp, Shield, Sparkles,
  Plus, Trash2, Lock, Eye, EyeOff, Landmark, Wifi, X, BadgeCheck,
  Smartphone, QrCode, Globe, RefreshCw,
  CheckCircle2, Copy, ExternalLink, Info, ChevronDown,
  AlertTriangle, CircleDollarSign, Banknote, Flame,
  Terminal, Activity, Radio, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addYears, addMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Plan {
  id: string; name: string; price: number; priceMonthly: number;
  maxUsers: number; maxWorkspaces: number; features: string[];
  popular?: boolean; accent: string; accentDim: string; accentBdr: string;
  accentHex: string; icon: any; sig: string;
}
interface BillingHistoryItem {
  id: string; date: Date; amount: number;
  status: "paid" | "pending" | "failed"; description: string;
  invoice: string; method: string;
}
interface SubscriptionData {
  plan: string; status: "active" | "past_due" | "canceled";
  startDate: Date; renewalDate: Date; billingCycle: "monthly" | "annual";
  currentUsers: number; currentWorkspaces: number; usagePercent: number;
}
type PaymentMethodType =
  | 'visa' | 'mastercard' | 'amex' | 'unionpay'
  | 'transfer' | 'multicaixa' | 'mpesa' | 'unitel'
  | 'paypal' | 'usdt' | 'usdc';
interface PaymentMethod {
  id: string; type: PaymentMethodType; label: string;
  last4?: string; expiry?: string; holder?: string;
  isDefault: boolean; bank?: string; iban?: string;
  phone?: string; email?: string; wallet?: string; network?: string;
}

/* ─── Static Data ────────────────────────────────────────────────────────── */
const PLANS: Plan[] = [
  {
    id: "starter", name: "STARTER", sig: "STR",
    price: 8000, priceMonthly: 800,
    maxUsers: 6, maxWorkspaces: 1,
    accent: "rgba(148,163,184,0.9)", accentDim: "rgba(148,163,184,0.08)", accentBdr: "rgba(148,163,184,0.2)", accentHex: "#94a3b8",
    icon: Shield,
    features: [
      "Dashboard em tempo real",
      "Dados de produção por bloco/operador",
      "Preços Brent e crudes angolanos",
      "Exportações e logística básica",
      "Previsões IA 30/60/90 dias",
      "Relatórios mensais automáticos",
      "Até 6 utilizadores",
      "1 workspace",
      "Suporte por email",
    ],
  },
  {
    id: "professional", name: "PROFESSIONAL", sig: "PRO",
    price: 60000, priceMonthly: 5500,
    maxUsers: 16, maxWorkspaces: -1, popular: true,
    accent: "rgba(56,189,248,0.9)", accentDim: "rgba(56,189,248,0.08)", accentBdr: "rgba(56,189,248,0.25)", accentHex: "#38bdf8",
    icon: Zap,
    features: [
      "Tudo do plano Starter",
      "Workspaces ilimitados",
      "API de integração básica",
      "Relatórios personalizados",
      "Dados históricos completos",
      "Análise de competidores",
      "Alertas de risco configuráveis",
      "Até 16 utilizadores",
      "Suporte prioritário 48h",
    ],
  },
  {
    id: "enterprise", name: "ENTERPRISE", sig: "ENT",
    price: 120000, priceMonthly: 11000,
    maxUsers: -1, maxWorkspaces: -1,
    accent: "rgba(251,191,36,0.9)", accentDim: "rgba(251,191,36,0.07)", accentBdr: "rgba(251,191,36,0.25)", accentHex: "#fbbf24",
    icon: Sparkles,
    features: [
      "Tudo do plano Professional",
      "Utilizadores ilimitados",
      "API de integração completa",
      "White-label customizado",
      "Domínio personalizado",
      "SLA garantido 99.9%",
      "Suporte 24/7 dedicado",
      "Gestor de conta exclusivo",
      "Relatórios sob medida",
    ],
  },
];

const MOCK_BILLING: BillingHistoryItem[] = [
  { id:"1", date: new Date("2025-12-01"), amount:60000, status:"paid",    description:"Plano PROFESSIONAL — Dez 2025", invoice:"INV-2025-012", method:"VISA •••• 4242" },
  { id:"2", date: new Date("2025-11-01"), amount:60000, status:"paid",    description:"Plano PROFESSIONAL — Nov 2025", invoice:"INV-2025-011", method:"VISA •••• 4242" },
  { id:"3", date: new Date("2025-10-01"), amount:60000, status:"paid",    description:"Plano PROFESSIONAL — Out 2025", invoice:"INV-2025-010", method:"MULTICAIXA" },
  { id:"4", date: new Date("2025-09-01"), amount:8000,  status:"paid",    description:"Plano STARTER — Set 2025",     invoice:"INV-2025-009", method:"TRANSFERÊNCIA" },
  { id:"5", date: new Date("2025-08-01"), amount:8000,  status:"failed",  description:"Plano STARTER — Ago 2025",     invoice:"INV-2025-008", method:"MASTERCARD •••• 5353" },
  { id:"6", date: new Date("2025-07-01"), amount:8000,  status:"pending", description:"Plano STARTER — Jul 2025",     invoice:"INV-2025-007", method:"USDT (TRC-20)" },
];

const MOCK_SUB: SubscriptionData = {
  plan: "professional", status: "active",
  startDate: new Date("2025-09-01"),
  renewalDate: addYears(new Date(), 1),
  billingCycle: "annual",
  currentUsers: 8, currentWorkspaces: 3, usagePercent: 50,
};

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id:"pm1", type:"visa",       label:"Visa",               last4:"4242", expiry:"08/27", holder:"JOÃO FERREIRA", isDefault:true  },
  { id:"pm2", type:"mastercard", label:"Mastercard",         last4:"5353", expiry:"03/26", holder:"JOÃO FERREIRA", isDefault:false },
  { id:"pm3", type:"multicaixa", label:"MULTICAIXA Express", phone:"+244 923 456 789",     isDefault:false },
  { id:"pm4", type:"transfer",   label:"Transferência BAI",  bank:"BAI Angola", iban:"AO06 0044 0000 6729 5034 1X1", isDefault:false },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(v);

/* ─── Scanline Overlay ───────────────────────────────────────────────────── */
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }}
  />
);

/* ─── Radar Pulse ────────────────────────────────────────────────────────── */
const RadarPulse = ({ active, color = "bg-red-500" }: { active: boolean; color?: string }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? color : "bg-slate-600"} ${active ? "animate-ping opacity-75" : ""}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? color : "bg-slate-600"}`} />
  </span>
);

/* ─── Stat Counter ───────────────────────────────────────────────────────── */
const StatCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const iv = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [value]);
  return <>{display}</>;
};

/* ─── Card Logo ──────────────────────────────────────────────────────────── */
const CARD_BG: Record<string, string> = {
  visa:"#1A1F71", mastercard:"#16213E", amex:"#2E77BC",
  unionpay:"#E60012", transfer:"#1e293b", multicaixa:"#00457C",
  mpesa:"#4CAF50", unitel:"#E30613", paypal:"#003087",
  usdt:"#26A17B", usdc:"#2775CA",
};
const CardLogo = ({ type }: { type: PaymentMethodType }) => {
  if (type === "visa")       return <span className="font-black text-white italic text-sm" style={{ fontFamily:"Georgia,serif", letterSpacing:"-0.5px" }}>VISA</span>;
  if (type === "mastercard") return <span className="flex"><span className="w-5 h-5 rounded-full bg-[#EB001B]"/><span className="w-5 h-5 rounded-full -ml-2.5 opacity-80 bg-[#F79E1B]"/></span>;
  if (type === "amex")       return <span className="font-black text-white text-xs">AMEX</span>;
  if (type === "multicaixa") return <span className="font-black text-white text-[9px] text-center leading-tight">MULTI-<br/>CAIXA</span>;
  if (type === "mpesa")      return <span className="font-black text-white text-xs">M-Pesa</span>;
  if (type === "unitel")     return <span className="font-black text-white text-xs">Unitel</span>;
  if (type === "paypal")     return <span className="font-black text-white text-xs">PayPal</span>;
  if (type === "usdt")       return <span className="font-black text-white text-xs font-mono">USDT</span>;
  if (type === "usdc")       return <span className="font-black text-white text-xs font-mono">USDC</span>;
  return <Landmark className="w-5 h-5 text-white/60"/>;
};

/* ─── Usage Bar ──────────────────────────────────────────────────────────── */
const UsageBar = ({ label, current, max, percent, accentHex, tag }:
  { label:string; current:number; max:number; percent?:number; accentHex:string; tag:string }) => {
  const pct = percent ?? (max === -1 ? 20 : Math.round((current / max) * 100));
  const danger = pct > 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${accentHex}18`, color: accentHex }}
          >{tag}</span>
          <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
          {current}<span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>/{max === -1 ? "∞" : max}</span>
        </span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: danger ? "#dc2626" : accentHex }}
        />
      </div>
      <p className="text-[9px] tabular-nums" style={{ color: danger ? "#f87171" : "hsl(var(--muted-foreground))" }}>
        {danger ? "// LIMITE PRÓXIMO" : `${pct}% UTILIZADO`}
      </p>
    </div>
  );
};

/* ─── Plan Card ──────────────────────────────────────────────────────────── */
const PlanCard = ({ plan, isCurrent, onAction, index, cycle }:
  { plan:Plan; isCurrent:boolean; onAction:(id:string, t:"upgrade"|"downgrade")=>void; index:number; cycle:"annual"|"monthly" }) => {
  const currentIdx = PLANS.findIndex(p => p.id === MOCK_SUB.plan);
  const thisIdx    = PLANS.findIndex(p => p.id === plan.id);
  const isUpgrade  = thisIdx > currentIdx;
  const Icon       = plan.icon;
  const price      = cycle === "annual" ? plan.price : plan.priceMonthly;
  const savings    = cycle === "annual" ? Math.round(((plan.priceMonthly * 12 - plan.price) / (plan.priceMonthly * 12)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: index * 0.08 }}
      className="relative flex flex-col rounded overflow-hidden group"
      style={{
        background: "hsl(var(--card))",
        border: `1px solid ${isCurrent ? plan.accentBdr : "rgba(255,255,255,0.06)"}`,
        boxShadow: isCurrent ? `0 0 30px ${plan.accentDim}` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.borderColor = plan.accentBdr; } }}
      onMouseLeave={e => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; } }}
    >
      {/* Corner tag */}
      <div
        className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1"
        style={{ background: `${plan.accentHex}18`, color: plan.accentHex, borderBottomLeftRadius: "4px", letterSpacing: "0.2em" }}
      >
        {plan.sig}
      </div>

      {plan.popular && (
        <div className="absolute top-0 left-0 text-[8px] font-bold px-2.5 py-1 tracking-widest"
          style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", borderBottomRightRadius: "4px" }}>
          POPULAR
        </div>
      )}

      {/* Top section */}
      <div className="p-6 pt-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 flex items-center justify-center rounded" style={{ background: plan.accentDim }}>
            <Icon className="w-4 h-4" style={{ color: plan.accentHex }} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--foreground))" }}>{plan.name}</p>
            {isCurrent && (
              <span className="text-[8px] font-bold tracking-widest" style={{ color: plan.accentHex }}>
                ● PLANO ACTIVO
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
            {fmt(price)}
          </span>
          <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            /{cycle === "annual" ? "ANO" : "MÊS"}
          </span>
        </div>

        {cycle === "annual" && savings > 0 && (
          <div
            className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
            style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            POUPA -{savings}% VS MENSAL
          </div>
        )}
      </div>

      {/* Features */}
      <div className="p-5 flex-1 space-y-2">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-3.5 h-3.5 flex items-center justify-center rounded shrink-0 mt-0.5"
              style={{ background: plan.accentDim }}
            >
              <Check className="w-2 h-2" style={{ color: plan.accentHex }} />
            </div>
            <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-5 pt-0">
        <button
          disabled={isCurrent}
          onClick={() => !isCurrent && onAction(plan.id, isUpgrade ? "upgrade" : "downgrade")}
          className="w-full h-10 rounded text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-all"
          style={{
            background: isCurrent
              ? plan.accentDim
              : `linear-gradient(135deg, ${plan.accentHex}dd, ${plan.accentHex}88)`,
            color: isCurrent ? plan.accentHex : plan.id === "enterprise" ? "#000" : "white",
            border: isCurrent ? `1px solid ${plan.accentBdr}` : "none",
            opacity: isCurrent ? 1 : 1,
            cursor: isCurrent ? "default" : "pointer",
            boxShadow: isCurrent ? "none" : `0 0 16px ${plan.accentHex}33`,
          }}
        >
          {isCurrent
            ? <><Check className="w-3 h-3" /> PLANO ACTUAL</>
            : isUpgrade
              ? <><ArrowUpRight className="w-3 h-3" /> UPGRADE</>
              : <><ArrowDownRight className="w-3 h-3" /> MUDAR PLANO</>}
        </button>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${plan.accentHex}, transparent)` }}
      />
    </motion.div>
  );
};

/* ─── Payment Method Card ────────────────────────────────────────────────── */
const MethodMeta = ({ m }: { m: PaymentMethod }) => {
  if (m.type === "transfer") return (
    <>
      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{m.label}</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{m.iban}</p>
    </>
  );
  if (["multicaixa","mpesa","unitel"].includes(m.type)) return (
    <>
      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{m.label}</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{m.phone}</p>
    </>
  );
  if (m.type === "paypal") return (
    <>
      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>PAYPAL</p>
      <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{m.email}</p>
    </>
  );
  if (["usdt","usdc"].includes(m.type)) return (
    <>
      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{m.type.toUpperCase()} — STABLECOIN</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
        {m.wallet ? `${m.wallet.slice(0,10)}…${m.wallet.slice(-6)}` : "CARTEIRA CONFIGURADA"}{m.network ? ` · ${m.network}` : ""}
      </p>
    </>
  );
  return (
    <>
      <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{m.label} •••• {m.last4}</p>
      <p className="text-[10px] mt-0.5 tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{m.holder} · EXP {m.expiry}</p>
    </>
  );
};

const PMCard = ({ method, onDelete, onSetDefault }:
  { method:PaymentMethod; onDelete:(id:string)=>void; onSetDefault:(id:string)=>void }) => (
  <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
    className="relative group rounded overflow-hidden"
    style={{
      background: method.isDefault ? "rgba(56,189,248,0.05)" : "hsl(var(--card))",
      border: `1px solid ${method.isDefault ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.06)"}`,
    }}
  >
    {/* Left accent */}
    {method.isDefault && (
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: "#38bdf8" }} />
    )}
    {/* Corner tag */}
    {method.isDefault && (
      <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 tracking-widest"
        style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8", borderBottomLeftRadius: "4px" }}>
        DEFAULT
      </div>
    )}

    <div className="p-4 pl-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-8 rounded flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: CARD_BG[method.type] || "#1e293b" }}
          >
            <div className="absolute inset-0 opacity-10" style={{ background:"linear-gradient(135deg, rgba(255,255,255,0.3), transparent)" }}/>
            <CardLogo type={method.type}/>
          </div>
          <MethodMeta m={method}/>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!method.isDefault && (
            <button
              onClick={() => onSetDefault(method.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2.5 rounded text-[9px] font-bold tracking-widest"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(56,189,248,0.3)"; el.style.color="#38bdf8"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.08)"; el.style.color="hsl(var(--muted-foreground))"; }}
            >
              SET DEFAULT
            </button>
          )}
          <button
            onClick={() => onDelete(method.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color="#f87171"; el.style.background="rgba(220,38,38,0.1)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color="hsl(var(--muted-foreground))"; el.style.background="transparent"; }}
          >
            <Trash2 className="w-3 h-3"/>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ─── Payment Tab ────────────────────────────────────────────────────────── */
type AddStep = "choose" | "card" | "transfer" | "multicaixa" | "mobile_money" | "paypal" | "stablecoin";

const PAYMENT_GROUPS = [
  { label: "CARTÕES INTERNACIONAIS",   items: [{ type:"card" as const,        label:"VISA / MASTERCARD / AMEX / UNIONPAY", icon:CreditCard,       desc:"Débito ou crédito, qualquer banco" }] },
  { label: "ANGOLA // MÉTODOS LOCAIS", items: [
    { type:"multicaixa" as const,   label:"MULTICAIXA EXPRESS",  icon:QrCode,           desc:"QR Code ou número de telemóvel" },
    { type:"mobile_money" as const, label:"M-PESA / UNITEL MONEY",icon:Smartphone,      desc:"Carteiras móveis angolanas" },
    { type:"transfer" as const,     label:"TRANSFERÊNCIA BANCÁRIA",icon:Landmark,        desc:"BAI, BFA, BIC, ATL, Millennium BIM…" },
  ]},
  { label: "INTERNACIONAL DIGITAL",    items: [{ type:"paypal" as const,       label:"PAYPAL",                             icon:Globe,            desc:"Conta PayPal verificada" }] },
  { label: "STABLECOINS // BLOCKCHAIN",items: [{ type:"stablecoin" as const,   label:"USDT / USDC",                        icon:CircleDollarSign, desc:"Stablecoins via TRC-20 ou ERC-20" }] },
];

const PaymentTab = () => {
  const [methods, setMethods]       = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep]             = useState<AddStep>("choose");
  const [isAdding, setIsAdding]     = useState(false);
  const [showCVV, setShowCVV]       = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const [stableCoin, setStableCoin] = useState<"usdt"|"usdc">("usdt");
  const [stableNet, setStableNet]   = useState("TRC-20");
  const [mobileOp, setMobileOp]     = useState<"mpesa"|"unitel">("mpesa");
  const [autoRenew, setAutoRenew]   = useState(true);

  const [cardForm, setCardForm] = useState({ number:"", holder:"", expiry:"", cvv:"" });
  const [tfForm, setTfForm]     = useState({ bank:"", iban:"", swift:"" });
  const [mcForm, setMcForm]     = useState({ phone:"" });
  const [mmForm, setMmForm]     = useState({ phone:"" });
  const [ppForm, setPpForm]     = useState({ email:"" });
  const [crForm, setCrForm]     = useState({ wallet:"" });

  const formatCardNum = (v:string) => v.replace(/\D/g,"").slice(0,16).replace(/(\d{4})/g,"$1 ").trim();
  const formatExpiry  = (v:string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2) : d; };
  const detectNet = (n:string): PaymentMethodType => {
    const s = n.replace(/\s/g,"");
    if (s.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(s)) return "mastercard";
    if (/^3[47]/.test(s)) return "amex";
    return "visa";
  };

  const handleDelete     = (id:string) => { setMethods(p => p.filter(m => m.id !== id)); toast.success("MÉTODO REMOVIDO // OK"); };
  const handleSetDefault = (id:string) => { setMethods(p => p.map(m => ({ ...m, isDefault: m.id === id }))); toast.success("DEFAULT ACTUALIZADO // ACK"); };

  const openDialog  = () => { setStep("choose"); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setTimeout(() => setStep("choose"), 300); };

  const copyToClipboard = (text:string, key:string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    await new Promise(r => setTimeout(r, 1200));
    const id = "pm" + Date.now();
    if (step === "card") {
      const t = detectNet(cardForm.number);
      setMethods(p => [...p, { id, type:t, label:t.toUpperCase(), last4:cardForm.number.replace(/\s/g,"").slice(-4), expiry:cardForm.expiry, holder:cardForm.holder, isDefault:false }]);
    } else if (step === "transfer") {
      setMethods(p => [...p, { id, type:"transfer", label:`TRANSFERÊNCIA ${tfForm.bank}`, bank:tfForm.bank, iban:tfForm.iban, isDefault:false }]);
    } else if (step === "multicaixa") {
      setMethods(p => [...p, { id, type:"multicaixa", label:"MULTICAIXA EXPRESS", phone:mcForm.phone, isDefault:false }]);
    } else if (step === "mobile_money") {
      setMethods(p => [...p, { id, type:mobileOp, label:mobileOp === "mpesa" ? "M-PESA" : "UNITEL MONEY", phone:mmForm.phone, isDefault:false }]);
    } else if (step === "paypal") {
      setMethods(p => [...p, { id, type:"paypal", label:"PAYPAL", email:ppForm.email, isDefault:false }]);
    } else if (step === "stablecoin") {
      setMethods(p => [...p, { id, type:stableCoin, label:`${stableCoin.toUpperCase()} (${stableNet})`, wallet:crForm.wallet, network:stableNet, isDefault:false }]);
    }
    toast.success("MÉTODO ADICIONADO // SISTEMA OK");
    setIsAdding(false);
    closeDialog();
  };

  const canSubmit = () => {
    if (step === "card")         return !!cardForm.number && !!cardForm.holder && !!cardForm.expiry && !!cardForm.cvv;
    if (step === "transfer")     return !!tfForm.bank && !!tfForm.iban;
    if (step === "multicaixa")   return !!mcForm.phone;
    if (step === "mobile_money") return !!mmForm.phone;
    if (step === "paypal")       return !!ppForm.email;
    if (step === "stablecoin")   return !!crForm.wallet;
    return false;
  };

  const inp = `h-11 w-full px-3 rounded text-[11px] font-bold tracking-wider outline-none transition-colors`;
  const inpStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--foreground))", fontFamily: "'IBM Plex Mono', monospace" };

  const ALPHA_BANK = [
    ["BANCO",      "Standard Bank Angola"],
    ["TITULAR",    "Elastra Technologies Lda"],
    ["IBAN",       "AO06 0090 0000 1234 5678 9X1"],
    ["SWIFT",      "STBAAOLUAXXX"],
    ["REFERÊNCIA", `SUB-${Date.now().toString().slice(-6)}`],
  ];

  const STABLE_WALLETS: Record<string,string> = {
    "usdt-TRC-20": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    "usdt-ERC-20": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "usdc-ERC-20": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "usdc-TRC-20": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  };
  const walletKey = `${stableCoin}-${stableNet}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "#38bdf8" }}>MÓDULO // PAGAMENTOS</span>
          </div>
          <p className="text-[13px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>MÉTODOS DE PAGAMENTO</p>
          <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            GERIR CARTÕES, CONTAS E CARTEIRAS DIGITAIS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-renew toggle */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[9px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>AUTO-RENOVAÇÃO</span>
            <button
              onClick={() => setAutoRenew(p => !p)}
              className="w-9 h-5 rounded-full relative transition-colors"
              style={{ background: autoRenew ? "#38bdf8" : "rgba(255,255,255,0.1)" }}
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: autoRenew ? "calc(100% - 18px)" : "2px" }}/>
            </button>
          </div>

          <button
            onClick={openDialog}
            className="flex items-center gap-2 px-4 py-2.5 rounded text-[10px] font-bold tracking-widest"
            style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)", color: "white", boxShadow: "0 0 16px rgba(56,189,248,0.25)", border: "1px solid rgba(56,189,248,0.3)" }}
          >
            <Plus className="w-3 h-3"/> ADICIONAR MÉTODO
          </button>
        </div>
      </div>

      {/* Methods list */}
      <div className="space-y-2">
        <AnimatePresence>
          {methods.length > 0 ? methods.map(m => (
            <PMCard key={m.id} method={m} onDelete={handleDelete} onSetDefault={handleSetDefault}/>
          )) : (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="py-16 rounded flex flex-col items-center gap-4 text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
            >
              <CreditCard className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.3 }}/>
              <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                // NENHUM MÉTODO CONFIGURADO
              </div>
              <button onClick={openDialog}
                className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest"
                style={{ border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", background: "rgba(56,189,248,0.06)" }}
              >
                <Plus className="w-3 h-3"/> INICIALIZAR MÉTODO
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next billing */}
      <div
        className="rounded p-5"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-3 h-3" style={{ color: "#38bdf8" }}/>
          <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>PRÓXIMO PAGAMENTO // CRON</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
              {fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {format(MOCK_SUB.renewalDate, "dd 'DE' MMMM 'DE' yyyy", { locale:pt }).toUpperCase()} · PLANO {PLANS.find(p=>p.id===MOCK_SUB.plan)?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-7 rounded flex items-center justify-center" style={{ background: CARD_BG[methods.find(m=>m.isDefault)?.type||"transfer"]||"#1e293b" }}>
              <CardLogo type={methods.find(m=>m.isDefault)?.type||"transfer"}/>
            </div>
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
              {methods.find(m=>m.isDefault)?.label?.toUpperCase() || "SEM MÉTODO"}
            </span>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div
        className="flex items-start gap-3 p-4 rounded"
        style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.15)" }}
      >
        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#38bdf8" }}/>
        <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          DADOS ENCRIPTADOS TLS 256-BIT // PCI-DSS NÍVEL 1 VIA STRIPE // TRANSACÇÕES STABLECOIN VERIFICADAS ON-CHAIN
        </p>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={open => !open && closeDialog()}>
        <DialogContent
          className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {step !== "choose" && (
                <button
                  onClick={() => setStep("choose")}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", color: "hsl(var(--muted-foreground))" }}
                >
                  <ChevronLeft className="w-3.5 h-3.5"/>
                </button>
              )}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Terminal className="w-3 h-3" style={{ color: "#38bdf8" }}/>
                  <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(56,189,248,0.8)" }}>
                    {step === "choose" ? "NOVO MÉTODO // CONFIG" : `MÉTODO // ${step.toUpperCase()}`}
                  </span>
                </div>
                <DialogTitle className="text-[14px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                  {step === "choose"       ? "ADICIONAR MÉTODO DE PAGAMENTO" :
                   step === "card"         ? "CARTÃO BANCÁRIO" :
                   step === "transfer"     ? "TRANSFERÊNCIA BANCÁRIA" :
                   step === "multicaixa"   ? "MULTICAIXA EXPRESS" :
                   step === "mobile_money" ? "CARTEIRA MÓVEL" :
                   step === "paypal"       ? "PAYPAL" :
                                            "STABLECOIN (USDT / USDC)"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "choose" && (
              <motion.div key="choose" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                {PAYMENT_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }}/>
                      <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>{group.label}</span>
                      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }}/>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(item => (
                        <button
                          key={item.type}
                          onClick={() => setStep(item.type as AddStep)}
                          className="w-full flex items-center gap-3 p-3.5 rounded text-left group transition-all"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(56,189,248,0.25)"; el.style.background="rgba(56,189,248,0.05)"; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.06)"; el.style.background="rgba(255,255,255,0.02)"; }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded shrink-0" style={{ background: "rgba(56,189,248,0.1)" }}>
                            <item.icon className="w-4 h-4" style={{ color: "#38bdf8" }}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{item.label}</p>
                            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#38bdf8" }}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === "card" && (
              <motion.div key="card" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                {/* Card preview */}
                <div
                  className="relative h-32 rounded overflow-hidden p-4 flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${CARD_BG[detectNet(cardForm.number)]}, #0f172a)`, border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ background:"radial-gradient(ellipse at top right, white, transparent 60%)" }}/>
                  <div className="flex items-center justify-between relative">
                    <Wifi className="w-4 h-4 rotate-90" style={{ color:"rgba(255,255,255,0.4)" }}/>
                    <CardLogo type={detectNet(cardForm.number)}/>
                  </div>
                  <div className="relative">
                    <p className="font-mono text-white text-base tracking-widest font-bold">{cardForm.number || "•••• •••• •••• ••••"}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.4)" }}>{cardForm.holder || "NOME DO TITULAR"}</span>
                      <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.4)" }}>{cardForm.expiry || "MM/AA"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>NÚMERO DO CARTÃO</label>
                  <input className={inp} style={inpStyle} placeholder="1234 5678 9012 3456" maxLength={19}
                    value={cardForm.number} onChange={e => setCardForm(p => ({ ...p, number:formatCardNum(e.target.value) }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>TITULAR</label>
                  <input className={inp} style={inpStyle} placeholder="COMO APARECE NO CARTÃO"
                    value={cardForm.holder} onChange={e => setCardForm(p => ({ ...p, holder:e.target.value.toUpperCase() }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>VALIDADE</label>
                    <input className={inp} style={inpStyle} placeholder="MM/AA" maxLength={5}
                      value={cardForm.expiry} onChange={e => setCardForm(p => ({ ...p, expiry:formatExpiry(e.target.value) }))}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>CVV</label>
                    <div className="relative">
                      <input type={showCVV ? "text" : "password"} className={`${inp} pr-10`} style={inpStyle} placeholder="•••" maxLength={4}
                        value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv:e.target.value.replace(/\D/g,"").slice(0,4) }))}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                      />
                      <button type="button" onClick={() => setShowCVV(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {showCVV ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "transfer" && (
              <motion.div key="transfer" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>BANCO</label>
                  <input className={inp} style={inpStyle} placeholder="BAI, BFA, BIC, MILLENNIUM BIM, ATL"
                    value={tfForm.bank} onChange={e => setTfForm(p => ({ ...p, bank:e.target.value }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>IBAN / CONTA</label>
                  <input className={inp} style={inpStyle} placeholder="AO06 0044 0000 6729 5034 1X1"
                    value={tfForm.iban} onChange={e => setTfForm(p => ({ ...p, iban:e.target.value.toUpperCase() }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                {/* Elastra bank details */}
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"/>
                    <span className="text-[9px] font-bold tracking-[0.25em]" style={{ color: "#38bdf8" }}>DADOS ALPHADAT // TRANSFERÊNCIA</span>
                  </div>
                  {ALPHA_BANK.map(([k,v]) => (
                    <div key={k} className="flex justify-between items-center group py-1">
                      <span className="text-[9px] tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{k}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>{v}</span>
                        <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color: "#4ade80" }}/> : <Copy className="w-3 h-3"/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "multicaixa" && (
              <motion.div key="multicaixa" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="p-4 rounded flex flex-col items-center gap-3 text-center" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-12 h-12 flex items-center justify-center rounded" style={{ background: CARD_BG.multicaixa }}>
                    <QrCode className="w-6 h-6 text-white"/>
                  </div>
                  <div className="w-full rounded p-3" style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[9px] font-bold tracking-widest block mb-2" style={{ color: "#38bdf8" }}>REF. DE PAGAMENTO</span>
                    {[["ENTIDADE","11223"],["REFERÊNCIA","987 654 321"],["MONTANTE",fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)]].map(([k,v]) => (
                      <div key={k} className="flex justify-between group py-0.5">
                        <span className="text-[9px]" style={{ color:"hsl(var(--muted-foreground))" }}>{k}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold" style={{ color:"hsl(var(--foreground))" }}>{v}</span>
                          <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:"hsl(var(--muted-foreground))" }}>
                            {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color:"#4ade80" }}/> : <Copy className="w-3 h-3"/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>NÚMERO DE TELEMÓVEL</label>
                  <input className={inp} style={inpStyle} placeholder="+244 9XX XXX XXX"
                    value={mcForm.phone} onChange={e => setMcForm({ phone:e.target.value })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded" style={{ background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.2)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color:"#4ade80" }}/>
                  <p className="text-[10px]" style={{ color:"hsl(var(--muted-foreground))" }}>ACESSO ACTIVADO AUTOMATICAMENTE EM ATÉ 15 MIN APÓS PAGAMENTO</p>
                </div>
              </motion.div>
            )}

            {step === "mobile_money" && (
              <motion.div key="mobile" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="flex gap-2 p-1.5 rounded" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  {(["mpesa","unitel"] as const).map(op => (
                    <button key={op} onClick={() => setMobileOp(op)}
                      className="flex-1 h-9 rounded text-[10px] font-bold tracking-widest transition-all"
                      style={{ background: mobileOp === op ? "rgba(56,189,248,0.15)" : "transparent", color: mobileOp === op ? "#38bdf8" : "hsl(var(--muted-foreground))", border: mobileOp === op ? "1px solid rgba(56,189,248,0.3)" : "1px solid transparent" }}>
                      {op === "mpesa" ? "M-PESA" : "UNITEL MONEY"}
                    </button>
                  ))}
                </div>
                <div className="rounded p-4 space-y-1.5" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[9px] font-bold tracking-widest block mb-2" style={{ color:"#38bdf8" }}>ENVIAR PARA ALPHADATA // {mobileOp.toUpperCase()}</span>
                  {[
                    ["NÚMERO",  mobileOp === "mpesa" ? "+244 912 345 678" : "+244 923 765 432"],
                    ["TITULAR", "ALPHADATA TECHNOLOGIES"],
                    ["REF.",    `ALPHA-${Date.now().toString().slice(-6)}`],
                    ["VALOR",   fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between group py-0.5">
                      <span className="text-[9px]" style={{ color:"hsl(var(--muted-foreground))" }}>{k}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color:"hsl(var(--foreground))" }}>{v}</span>
                        <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:"hsl(var(--muted-foreground))" }}>
                          {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color:"#4ade80" }}/> : <Copy className="w-3 h-3"/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>O SEU NÚMERO</label>
                  <input className={inp} style={inpStyle} placeholder="+244 9XX XXX XXX"
                    value={mmForm.phone} onChange={e => setMmForm({ phone:e.target.value })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
              </motion.div>
            )}

            {step === "paypal" && (
              <motion.div key="paypal" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="p-4 rounded flex flex-col items-center gap-3 text-center" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-12 h-12 flex items-center justify-center rounded" style={{ background: CARD_BG.paypal }}>
                    <Globe className="w-6 h-6 text-white"/>
                  </div>
                  <div className="p-3 rounded w-full flex items-center justify-between group" style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[9px] tracking-widest" style={{ color:"hsl(var(--muted-foreground))" }}>EMAIL ALPHADATA</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold" style={{ color:"hsl(var(--foreground))" }}>billing@alphadata.ao</span>
                      <button onClick={() => copyToClipboard("billing@alphadata.ao","paypal_email")} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:"hsl(var(--muted-foreground))" }}>
                        {copied === "paypal_email" ? <CheckCircle2 className="w-3 h-3" style={{ color:"#4ade80" }}/> : <Copy className="w-3 h-3"/>}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>O SEU EMAIL PAYPAL</label>
                  <input className={inp} style={inpStyle} type="email" placeholder="exemplo@gmail.com"
                    value={ppForm.email} onChange={e => setPpForm({ email:e.target.value })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded" style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.15)" }}>
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color:"#38bdf8" }}/>
                  <p className="text-[10px]" style={{ color:"hsl(var(--muted-foreground))" }}>REDIRECÇÃO PAYPAL PARA AUTORIZAR DÉBITO AUTOMÁTICO EM CADA CICLO</p>
                </div>
              </motion.div>
            )}

            {step === "stablecoin" && (
              <motion.div key="stablecoin" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>MOEDA</label>
                  <div className="flex gap-2">
                    {(["usdt","usdc"] as const).map(coin => (
                      <button key={coin} onClick={() => setStableCoin(coin)}
                        className="flex-1 h-10 rounded text-[10px] font-bold tracking-widest transition-all"
                        style={{ background: stableCoin === coin ? CARD_BG[coin] : "rgba(255,255,255,0.03)", border:`1px solid ${stableCoin === coin ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`, color:"white" }}>
                        {coin === "usdt" ? "₮ USDT" : "$ USDC"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>REDE BLOCKCHAIN</label>
                  <div className="flex gap-2">
                    {["TRC-20","ERC-20"].map(net => (
                      <button key={net} onClick={() => setStableNet(net)}
                        className="flex-1 h-9 rounded text-[10px] font-bold tracking-widest transition-all"
                        style={{ background: stableNet === net ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.02)", color: stableNet === net ? "#38bdf8" : "hsl(var(--muted-foreground))", border:`1px solid ${stableNet === net ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                        {net}
                      </button>
                    ))}
                  </div>
                </div>
                {STABLE_WALLETS[walletKey] && (
                  <div className="rounded p-4 space-y-2" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[9px] font-bold tracking-widest block" style={{ color: stableCoin === "usdt" ? "#26A17B" : "#2775CA" }}>
                      ENDEREÇO ALPHADATA // {stableCoin.toUpperCase()} ({stableNet})
                    </span>
                    <div className="flex items-start justify-between gap-3 p-2 rounded" style={{ background:"rgba(0,0,0,0.2)" }}>
                      <p className="text-[10px] font-mono break-all leading-relaxed" style={{ color:"hsl(var(--foreground))" }}>{STABLE_WALLETS[walletKey]}</p>
                      <button onClick={() => copyToClipboard(STABLE_WALLETS[walletKey],"wallet")} className="shrink-0 mt-0.5" style={{ color:"hsl(var(--muted-foreground))" }}>
                        {copied === "wallet" ? <CheckCircle2 className="w-4 h-4" style={{ color:"#4ade80" }}/> : <Copy className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] block mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>ENDEREÇO DE RETORNO</label>
                  <input className={inp} style={inpStyle} placeholder="O SEU ENDEREÇO DE CARTEIRA"
                    value={crForm.wallet} onChange={e => setCrForm({ wallet:e.target.value })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(56,189,248,0.4)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded" style={{ background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.2)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color:"#fbbf24" }}/>
                  <p className="text-[10px]" style={{ color:"hsl(var(--muted-foreground))" }}>
                    ATIVAÇÃO APÓS 2-6 CONFIRMAÇÕES ON-CHAIN // ENVIE APENAS {stableCoin.toUpperCase()} VIA {stableNet} // REDE ERRADA = PERDA PERMANENTE
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "choose" && (
            <DialogFooter className="gap-2 mt-2">
              <button
                onClick={closeDialog} disabled={isAdding}
                className="px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                CANCELAR
              </button>
              <button
                onClick={handleAdd} disabled={isAdding || !canSubmit()}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest"
                style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)", color:"white", boxShadow:"0 0 16px rgba(56,189,248,0.25)", opacity: (isAdding || !canSubmit()) ? 0.5 : 1 }}
              >
                {isAdding ? <><Clock className="w-3 h-3 animate-spin"/> GUARDANDO…</> : <><Check className="w-3 h-3"/> GUARDAR MÉTODO</>}
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const Subscription = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState<"plans"|"billing"|"payment">("plans");
  const [billingCycle, setBillingCycle] = useState<"annual"|"monthly">("annual");
  const [dialogState, setDialogState] = useState<{ type:"upgrade"|"downgrade"|null; planId:string|null }>({ type:null, planId:null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [bootDone, setBootDone]       = useState(false);
  const [now, setNow]                 = useState(new Date());

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 1200); }, []);

  const currentPlan = useMemo(() => PLANS.find(p => p.id === MOCK_SUB.plan) || PLANS[0], []);
  const targetPlan  = useMemo(() => PLANS.find(p => p.id === dialogState.planId), [dialogState.planId]);

  const handlePlanAction = useCallback((planId:string, type:"upgrade"|"downgrade") => setDialogState({ type, planId }), []);
  const closeDialog      = () => setDialogState({ type:null, planId:null });

  const confirmPlanChange = async () => {
    setIsProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success(
        dialogState.type === "upgrade" ? "UPGRADE CONFIRMADO // SISTEMA OK" : "PLANO ALTERADO // ACK",
        { description: "ALTERAÇÕES ACTIVAS NO PRÓXIMO CICLO" }
      );
      closeDialog();
    } catch { toast.error("ERRO CRÍTICO — TENTATIVA FALHADA"); }
    finally { setIsProcessing(false); }
  };

  const tabs: { id: "plans"|"billing"|"payment"; label: string; sig: string }[] = [
    { id:"plans",   label:"PLANOS",     sig:"PLN" },
    { id:"billing", label:"FATURAÇÃO",  sig:"BIL" },
    { id:"payment", label:"PAGAMENTO",  sig:"PAY" },
  ];

  const billingStats = useMemo(() => ({
    paid:    MOCK_BILLING.filter(b=>b.status==="paid").reduce((s,b)=>s+b.amount,0),
    pending: MOCK_BILLING.filter(b=>b.status==="pending").reduce((s,b)=>s+b.amount,0),
    failed:  MOCK_BILLING.filter(b=>b.status==="failed").reduce((s,b)=>s+b.amount,0),
  }), []);

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // SUBSCRIÇÃO</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <ScanlineOverlay />

      {/* Boot screen */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: "#000", fontFamily: "'IBM Plex Mono', monospace" }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <div className="text-red-500 text-xs space-y-1 w-96 max-w-full px-8">
              <p className="text-red-400 text-lg font-bold mb-4">&gt; ALPHADAT-OS v3.2.1</p>
              <p className="opacity-70">LOADING BILLING MODULE.................... OK</p>
              <p className="opacity-70">MOUNTING SUBSCRIPTION DATABASE........... OK</p>
              <p className="opacity-70">VALIDATING PAYMENT GATEWAYS.............. OK</p>
              <p className="text-red-500 animate-pulse">INITIALIZING SUBSCRIPTION MODULE......... ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/subscription"/>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-[50%] h-[35%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.03) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[40%] h-[30%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(251,191,36,0.02) 0%, transparent 70%)" }} />

          <Header activeItem="/subscription"/>

          <main className="flex-1 overflow-y-auto" style={{ padding: 0 }}>

            {/* System Status Bar */}
            <motion.div
              initial={{ opacity:0, y:-8 }}
              animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -8 }}
              transition={{ delay:0.1 }}
              className="flex items-center justify-between px-6 py-2 border-b"
              style={{ borderColor:"rgba(56,189,248,0.1)", background:"rgba(56,189,248,0.02)" }}
            >
              <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color:"hsl(var(--muted-foreground))" }}>
                <span className="flex items-center gap-1.5" style={{ color: "#38bdf8" }}>
                  <RadarPulse active={true} color="bg-sky-400"/>
                  BILLING ONLINE
                </span>
                <span className="opacity-40">|</span>
                <span>OPERATOR: {user?.email?.split("@")[0].toUpperCase() ?? "ANON"}</span>
                <span className="opacity-40">|</span>
                <span>PLANO: {currentPlan.name}</span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5" style={{ color:"#4ade80" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                  SUBSCRIÇÃO ACTIVA
                </span>
              </div>
              <div className="text-[10px] tabular-nums" style={{ color:"hsl(var(--muted-foreground))" }}>
                <span style={{ color:"hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12:false })}</span>
                <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
              </div>
            </motion.div>

            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">

              {/* Header */}
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay:0.2 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color:"hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3" style={{ color: "#38bdf8" }}/>
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40"/>
                    <span>SISTEMA</span>
                    <ChevronRight className="w-3 h-3 opacity-40"/>
                    <span style={{ color:"hsl(var(--foreground))" }}>SUBSCRIÇÃO</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color:"rgba(56,189,248,0.8)" }}>
                    MÓDULO-07 // BILLING & LICENCIAMENTO
                  </div>
                  <h1
                    className="font-bold leading-none"
                    style={{ fontSize:"clamp(2rem, 4vw, 3.5rem)", letterSpacing:"-0.02em", color:"hsl(var(--foreground))" }}
                  >
                    SUBSCRIÇÃO
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-[1px] w-12" style={{ background: "#38bdf8" }}/>
                    <p className="text-[11px]" style={{ color:"hsl(var(--muted-foreground))", letterSpacing:"0.05em" }}>
                      PLANOS, PAGAMENTOS E HISTÓRICO DE FATURAÇÃO
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold tracking-widest transition-all border"
                    style={{ borderColor:"rgba(255,255,255,0.08)", color:"hsl(var(--muted-foreground))", background:"transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(56,189,248,0.3)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--foreground))"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--muted-foreground))"; }}
                  >
                    <FileText className="w-3.5 h-3.5"/>
                    VER CONTRATO
                  </button>
                  <motion.button
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold tracking-widest"
                    style={{ background:"linear-gradient(135deg, #38bdf8, #0284c7)", color:"white", boxShadow:"0 0 20px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.1)", border:"1px solid rgba(56,189,248,0.4)" }}
                  >
                    <Zap className="w-3.5 h-3.5"/>
                    UPGRADE AGORA
                  </motion.button>
                </div>
              </motion.div>

              {/* Current plan hero */}
              <motion.div
                initial={{ opacity:0, y:16 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 16 }}
                transition={{ delay:0.3 }}
                className="rounded overflow-hidden"
                style={{ border:`1px solid ${currentPlan.accentBdr}`, background:"hsl(var(--card))" }}
              >
                {/* Hero top */}
                <div
                  className="relative p-6 md:p-8 overflow-hidden"
                  style={{ background:`linear-gradient(135deg, ${currentPlan.accentDim}, transparent 60%)` }}
                >
                  {/* Decorative circle */}
                  <div
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.04]"
                    style={{ border: `32px solid ${currentPlan.accentHex}` }}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
                    <div className="flex items-center gap-5">
                      <div
                        className="w-14 h-14 flex items-center justify-center rounded shrink-0"
                        style={{ background: currentPlan.accentDim, border:`1px solid ${currentPlan.accentBdr}` }}
                      >
                        <currentPlan.icon className="w-7 h-7" style={{ color: currentPlan.accentHex }}/>
                      </div>
                      <div>
                        {/* Corner sig */}
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="text-[8px] font-bold px-2 py-0.5 rounded tracking-widest"
                            style={{ background:`${currentPlan.accentHex}18`, color: currentPlan.accentHex }}
                          >
                            {currentPlan.sig}
                          </span>
                          <span
                            className="flex items-center gap-1 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded"
                            style={{ background:"rgba(74,222,128,0.1)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.2)" }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                            ACTIVO
                          </span>
                        </div>
                        <h2 className="text-xl font-bold tracking-wider" style={{ color:"hsl(var(--foreground))" }}>
                          PLANO {currentPlan.name}
                        </h2>
                        <p className="text-[11px] mt-0.5 tracking-wider" style={{ color:"hsl(var(--muted-foreground))" }}>
                          {fmt(currentPlan.price)}/ANO · RENOVAÇÃO EM {format(MOCK_SUB.renewalDate, "dd 'DE' MMMM 'DE' yyyy", { locale:pt }).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage bars */}
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8"
                  style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}
                >
                  <UsageBar label="UTILIZADORES"  current={MOCK_SUB.currentUsers}     max={currentPlan.maxUsers}      accentHex={currentPlan.accentHex} tag="USR"/>
                  <UsageBar label="WORKSPACES"    current={MOCK_SUB.currentWorkspaces} max={currentPlan.maxWorkspaces}  accentHex={currentPlan.accentHex} tag="WRK"/>
                  <UsageBar label="USO GERAL"     current={MOCK_SUB.usagePercent}      max={100} percent={MOCK_SUB.usagePercent} accentHex={currentPlan.accentHex} tag="GEN"/>
                </div>
              </motion.div>

              {/* Stats row */}
              <motion.div
                className="grid grid-cols-3 gap-3"
                initial={{ opacity:0, y:12 }}
                animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 12 }}
                transition={{ delay:0.35 }}
              >
                {[
                  { label:"TOTAL PAGO 2025", value: billingStats.paid,    color:"#4ade80", tag:"PAD", bg:"rgba(74,222,128,0.06)",  bdr:"rgba(74,222,128,0.15)" },
                  { label:"PENDENTE",        value: billingStats.pending,  color:"#fbbf24", tag:"PND", bg:"rgba(251,191,36,0.06)",  bdr:"rgba(251,191,36,0.15)" },
                  { label:"FALHADO",         value: billingStats.failed,   color:"#f87171", tag:"FLD", bg:"rgba(220,38,38,0.06)",   bdr:"rgba(220,38,38,0.15)"  },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity:0, y:8 }}
                    animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : 8 }}
                    transition={{ delay: 0.38 + i * 0.05 }}
                    className="relative overflow-hidden rounded p-5 group"
                    style={{ background: s.bg, border:`1px solid ${s.bdr}` }}
                  >
                    <div className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 tracking-widest" style={{ background:`${s.color}18`, color:s.color, borderBottomLeftRadius:"4px" }}>{s.tag}</div>
                    <p className="text-[9px] font-bold tracking-[0.2em] mb-3" style={{ color:"hsl(var(--muted-foreground))" }}>{s.label}</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color:s.color, letterSpacing:"-0.03em" }}>{fmt(s.value)}</p>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background:`linear-gradient(90deg, ${s.color}, transparent)` }}/>
                  </motion.div>
                ))}
              </motion.div>

              {/* Tabs */}
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay:0.4 }}
              >
                {/* Tab bar */}
                <div
                  className="flex rounded overflow-hidden text-[10px] font-bold tracking-widest mb-6"
                  style={{ border:"1px solid rgba(255,255,255,0.07)", background:"hsl(var(--card))", width:"fit-content" }}
                >
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-5 py-3 transition-all duration-150"
                      style={activeTab === tab.id ? {
                        background: "rgba(255,255,255,0.07)",
                        color: "hsl(var(--foreground))",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                      } : {
                        color: "hsl(var(--muted-foreground))",
                        borderRight: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded"
                        style={{ background: activeTab === tab.id ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.05)", color: activeTab === tab.id ? "#38bdf8" : "inherit" }}
                      >{tab.sig}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {activeTab === "plans" && (
                    <motion.div key="plans" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-6">
                      {/* Billing cycle toggle */}
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color:"hsl(var(--muted-foreground))" }}>CICLO // FATURAÇÃO:</span>
                        <div
                          className="flex rounded overflow-hidden text-[10px] font-bold tracking-widest"
                          style={{ border:"1px solid rgba(255,255,255,0.07)", background:"hsl(var(--card))" }}
                        >
                          {(["annual","monthly"] as const).map(c => (
                            <button
                              key={c}
                              onClick={() => setBillingCycle(c)}
                              className="px-4 py-2.5 transition-all duration-150"
                              style={billingCycle === c ? { background:"rgba(255,255,255,0.07)", color:"hsl(var(--foreground))" } : { color:"hsl(var(--muted-foreground))" }}
                            >
                              {c === "annual" ? "ANUAL (-20%)" : "MENSAL"}
                            </button>
                          ))}
                        </div>
                        {billingCycle === "annual" && (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded tracking-widest"
                            style={{ background:"rgba(74,222,128,0.1)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.2)" }}
                          >
                            POUPE ATÉ {fmt(PLANS[1].priceMonthly * 12 - PLANS[1].price)}/ANO
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANS.map((plan, i) => (
                          <PlanCard key={plan.id} plan={plan} index={i}
                            isCurrent={plan.id === MOCK_SUB.plan}
                            onAction={handlePlanAction} cycle={billingCycle}
                          />
                        ))}
                      </div>

                      <div
                        className="flex items-center gap-3 p-4 rounded"
                        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}
                      >
                        <Info className="w-3.5 h-3.5 shrink-0" style={{ color:"hsl(var(--muted-foreground))", opacity:0.5 }}/>
                        <span className="text-[10px]" style={{ color:"hsl(var(--muted-foreground))" }}>
                          TODOS OS PLANOS INCLUEM SSL, BACKUPS DIÁRIOS E CONFORMIDADE RGPD
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "billing" && (
                    <motion.div key="billing" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-4">
                      {/* Table header */}
                      <div
                        className="hidden sm:grid px-5 py-2.5 rounded text-[9px] font-bold tracking-[0.2em]"
                        style={{ gridTemplateColumns:"120px 1fr 160px 120px 100px 60px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", color:"hsl(var(--muted-foreground))" }}
                      >
                        <span>DATA</span>
                        <span>DESCRIÇÃO</span>
                        <span>MÉTODO</span>
                        <span>VALOR</span>
                        <span>ESTADO</span>
                        <span className="text-right">DWN</span>
                      </div>

                      <div className="space-y-1.5">
                        {MOCK_BILLING.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity:0, x:8 }}
                            animate={{ opacity:1, x:0 }}
                            transition={{ delay: index * 0.04 }}
                            className="hidden sm:grid px-5 py-4 rounded group cursor-default transition-all"
                            style={{
                              gridTemplateColumns:"120px 1fr 160px 120px 100px 60px",
                              alignItems:"center",
                              background:"hsl(var(--card))",
                              border:"1px solid rgba(255,255,255,0.05)",
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.05)"}
                          >
                            <span className="text-[10px] tabular-nums" style={{ color:"hsl(var(--muted-foreground))" }}>
                              {format(item.date,"dd MMM yyyy",{locale:pt}).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-bold tracking-wider" style={{ color:"hsl(var(--foreground))" }}>{item.description}</span>
                            <span className="text-[10px] tracking-wider" style={{ color:"hsl(var(--muted-foreground))" }}>{item.method}</span>
                            <span className="text-[12px] font-bold tabular-nums" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.02em" }}>{fmt(item.amount)}</span>
                            <span>
                              <span
                                className="text-[8px] font-bold tracking-widest px-2 py-1 rounded"
                                style={{
                                  background: item.status==="paid" ? "rgba(74,222,128,0.1)" : item.status==="pending" ? "rgba(251,191,36,0.1)" : "rgba(220,38,38,0.1)",
                                  color:      item.status==="paid" ? "#4ade80"               : item.status==="pending" ? "#fbbf24"               : "#f87171",
                                  border:     item.status==="paid" ? "1px solid rgba(74,222,128,0.2)" : item.status==="pending" ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(220,38,38,0.2)",
                                }}
                              >
                                {item.status==="paid" ? "PAGO" : item.status==="pending" ? "PENDENTE" : "FALHOU"}
                              </span>
                            </span>
                            <div className="flex justify-end">
                              <button
                                className="w-7 h-7 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100"
                                style={{ color:"hsl(var(--muted-foreground))" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="#38bdf8"; (e.currentTarget as HTMLElement).style.background="rgba(56,189,248,0.1)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="hsl(var(--muted-foreground))"; (e.currentTarget as HTMLElement).style.background="transparent"; }}
                              >
                                <Download className="w-3 h-3"/>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Export row */}
                      <div className="flex justify-end">
                        <button
                          className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all"
                          style={{ border:"1px solid rgba(56,189,248,0.2)", color:"#38bdf8", background:"rgba(56,189,248,0.06)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(56,189,248,0.12)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(56,189,248,0.06)"; }}
                        >
                          <Download className="w-3 h-3"/> EXPORTAR TODAS AS FATURAS
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "payment" && (
                    <motion.div key="payment" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                      <PaymentTab/>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Plan change dialog */}
      <Dialog open={!!dialogState.type} onOpenChange={open => !open && closeDialog()}>
        <DialogContent
          className="sm:max-w-[440px]"
          style={{ background:"hsl(var(--card))", border:`1px solid ${dialogState.type==="downgrade" ? "rgba(220,38,38,0.2)" : "rgba(56,189,248,0.2)"}`, borderRadius:"6px", fontFamily:"'IBM Plex Mono', monospace" }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4" style={{ color: dialogState.type==="upgrade" ? "#38bdf8" : "#f87171" }}/>
              <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: dialogState.type==="upgrade" ? "rgba(56,189,248,0.8)" : "rgba(220,38,38,0.8)" }}>
                {dialogState.type==="upgrade" ? "UPGRADE // CONFIRMAÇÃO" : "ALTERAÇÃO // CONFIRMAÇÃO"}
              </span>
            </div>
            <DialogTitle className="text-[14px] font-bold tracking-wider" style={{ color:"hsl(var(--foreground))" }}>
              {dialogState.type==="upgrade" ? "CONFIRMAR UPGRADE DE PLANO" : "CONFIRMAR ALTERAÇÃO DE PLANO"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogState.type==="downgrade" && (
              <div
                className="flex items-start gap-3 p-4 rounded"
                style={{ background:"rgba(220,38,38,0.06)", border:"1px solid rgba(220,38,38,0.2)" }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:"#f87171" }}/>
                <p className="text-[11px]" style={{ color:"hsl(var(--muted-foreground))" }}>
                  VERIFIQUE QUE O USO ACTUAL ({MOCK_SUB.currentUsers} UTILIZADORES) ESTÁ DENTRO DOS LIMITES DO NOVO PLANO ({targetPlan?.maxUsers === -1 ? "∞" : targetPlan?.maxUsers}).
                </p>
              </div>
            )}

            <div
              className="rounded p-4 space-y-3"
              style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                ["PLANO ACTUAL", currentPlan.name, currentPlan.accentHex],
                ["NOVO PLANO",   targetPlan?.name || "—", targetPlan?.accentHex || "hsl(var(--foreground))"],
              ].map(([k,v,c]) => (
                <React.Fragment key={k}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color:"hsl(var(--muted-foreground))" }}>{k}</span>
                    <span className="text-[12px] font-bold tracking-wider" style={{ color:c }}>{v}</span>
                  </div>
                  <div className="h-px" style={{ background:"rgba(255,255,255,0.05)" }}/>
                </React.Fragment>
              ))}
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color:"hsl(var(--muted-foreground))" }}>NOVO VALOR ANUAL</span>
                <span className="text-2xl font-bold tabular-nums" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.03em" }}>
                  {targetPlan ? fmt(targetPlan.price) : "—"}<span className="text-[11px] ml-1" style={{ color:"hsl(var(--muted-foreground))" }}>/ANO</span>
                </span>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed" style={{ color:"hsl(var(--muted-foreground))" }}>
              {dialogState.type==="upgrade"
                ? `ACESSO IMEDIATO A TODAS AS FUNCIONALIDADES DO PLANO ${targetPlan?.name}. VALOR AJUSTADO PRO-RATA.`
                : `ALGUMAS FUNCIONALIDADES SERÃO DESACTIVADAS NO PRÓXIMO CICLO DE FATURAÇÃO.`}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={closeDialog} disabled={isProcessing}
              className="px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-colors"
              style={{ color:"hsl(var(--muted-foreground))" }}
            >
              CANCELAR
            </button>
            <button
              onClick={confirmPlanChange} disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
              style={{
                background: dialogState.type==="upgrade"
                  ? "linear-gradient(135deg, #38bdf8, #0284c7)"
                  : "linear-gradient(135deg, #dc2626, #991b1b)",
                color:"white",
                boxShadow: dialogState.type==="upgrade" ? "0 0 16px rgba(56,189,248,0.3)" : "0 0 16px rgba(220,38,38,0.3)",
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              {isProcessing
                ? <><Clock className="w-3 h-3 animate-spin"/> PROCESSANDO…</>
                : <><Check className="w-3 h-3"/> CONFIRMAR</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileBottomNav/>
    </div>
  );
};

export default Subscription;