import React, { useState, useMemo, useCallback } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Users, ArrowUpRight, ArrowDownRight,
  Check, Clock, FileText, Download, AlertCircle,
  Star, Zap, Building2, Mail, Phone, ChevronRight,
  Calendar, TrendingUp, Shield, Sparkles,
  Plus, Trash2, Lock, Eye, EyeOff, Landmark, Wifi, X, BadgeCheck,
  Smartphone, QrCode, Globe, RefreshCw,
  CheckCircle2, Copy, ExternalLink, Info, ChevronDown,
  AlertTriangle, CircleDollarSign, Banknote, Flame,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addYears, addMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — mapped to Tailwind semantic vars
═══════════════════════════════════════════════════════ */
const BG_DEEP  = "hsl(var(--background))";
const BG_NAVY  = "hsl(var(--card))";
const BG_CARD  = "hsl(var(--card))";
const BG_HOVER = "hsl(var(--muted))";
const RED      = "hsl(var(--destructive))";
const RED_DIM  = "hsl(var(--destructive) / 0.12)";
const RED_BDR  = "hsl(var(--destructive) / 0.30)";
const BLUE     = "hsl(var(--primary))";
const BLUE_MID = "hsl(var(--primary))";
const BLUE_DIM = "hsl(var(--primary) / 0.15)";
const BLUE_BDR = "hsl(var(--primary) / 0.30)";
const WHITE    = "hsl(var(--foreground))";
const W60      = "hsl(var(--muted-foreground))";
const W30      = "hsl(var(--muted-foreground) / 0.5)";
const W10      = "hsl(var(--border))";
const BORDER   = "hsl(var(--border))";
const GOLD     = "hsl(var(--accent))";
const GOLD_DIM = "hsl(var(--accent) / 0.12)";
const GOLD_BDR = "hsl(var(--accent) / 0.30)";
const GREEN    = "hsl(var(--success))";
const GREEN_DIM= "hsl(var(--success) / 0.10)";
const GREEN_BDR= "hsl(var(--success) / 0.25)";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface Plan {
  id: string; name: string; price: number; priceMonthly: number;
  maxUsers: number; maxWorkspaces: number; features: string[];
  popular?: boolean; accent: string; accentDim: string; accentBdr: string;
  icon: any;
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

// Bitcoin removed from PaymentMethodType
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

/* ═══════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════ */
const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", price: 14999, priceMonthly: 1499,
    maxUsers: 6, maxWorkspaces: 1,
    accent: W60, accentDim: W10, accentBdr: BORDER,
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
    id: "professional", name: "Professional", price: 49999, priceMonthly: 4999,
    maxUsers: 16, maxWorkspaces: -1, popular: true,
    accent: BLUE_MID, accentDim: BLUE_DIM, accentBdr: BLUE_BDR,
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
      "Suporte prioritário (48h)",
    ],
  },
  {
    id: "enterprise", name: "Enterprise", price: 250000, priceMonthly: 25000,
    maxUsers: -1, maxWorkspaces: -1,
    accent: GOLD, accentDim: GOLD_DIM, accentBdr: GOLD_BDR,
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
  { id:"1", date: new Date("2025-12-01"), amount:49999, status:"paid",    description:"Plano Professional — Dez 2025", invoice:"INV-2025-012", method:"Visa •••• 4242" },
  { id:"2", date: new Date("2025-11-01"), amount:49999, status:"paid",    description:"Plano Professional — Nov 2025", invoice:"INV-2025-011", method:"Visa •••• 4242" },
  { id:"3", date: new Date("2025-10-01"), amount:49999, status:"paid",    description:"Plano Professional — Out 2025", invoice:"INV-2025-010", method:"MULTICAIXA"    },
  { id:"4", date: new Date("2025-09-01"), amount:14999, status:"paid",    description:"Plano Starter — Set 2025",     invoice:"INV-2025-009", method:"Transferência" },
  { id:"5", date: new Date("2025-08-01"), amount:14999, status:"failed",  description:"Plano Starter — Ago 2025",     invoice:"INV-2025-008", method:"Mastercard •••• 5353" },
  { id:"6", date: new Date("2025-07-01"), amount:14999, status:"pending", description:"Plano Starter — Jul 2025",     invoice:"INV-2025-007", method:"USDT (TRC-20)" },
];

const MOCK_SUB: SubscriptionData = {
  plan: "professional", status: "active",
  startDate: new Date("2025-09-01"),
  renewalDate: addYears(new Date(), 1),
  billingCycle: "annual",
  currentUsers: 8, currentWorkspaces: 3, usagePercent: 50,
};

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id:"pm1", type:"visa",        label:"Visa",                last4:"4242", expiry:"08/27", holder:"João Ferreira",  isDefault:true  },
  { id:"pm2", type:"mastercard",  label:"Mastercard",          last4:"5353", expiry:"03/26", holder:"João Ferreira",  isDefault:false },
  { id:"pm3", type:"multicaixa",  label:"MULTICAIXA Express",  phone:"+244 923 456 789",     isDefault:false         },
  { id:"pm4", type:"transfer",    label:"Transferência BAI",   bank:"BAI Angola", iban:"AO06 0044 0000 6729 5034 1X1", isDefault:false },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(v);

/* ═══════════════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════════════ */
const CARD_BG: Record<string, string> = {
  visa:"#1A1F71", mastercard:"#16213E", amex:"#2E77BC",
  unionpay:"#E60012", transfer:BG_HOVER, multicaixa:"#00457C",
  mpesa:"#4CAF50", unitel:"#E30613", paypal:"#003087",
  usdt:"#26A17B", usdc:"#2775CA",
};

const CardLogo = ({ type }: { type: PaymentMethodType }) => {
  if (type === "visa")        return <span className="font-black text-white italic text-sm" style={{ fontFamily:"Georgia,serif", letterSpacing:"-0.5px" }}>VISA</span>;
  if (type === "mastercard")  return <span className="flex"><span className="w-5 h-5 rounded-full bg-[#EB001B]"/><span className="w-5 h-5 rounded-full -ml-2.5 opacity-80 bg-[#F79E1B]"/></span>;
  if (type === "amex")        return <span className="font-black text-white text-xs">AMEX</span>;
  if (type === "unionpay")    return <span className="font-black text-white text-xs">UnionPay</span>;
  if (type === "multicaixa")  return <span className="font-black text-white text-[10px] text-center leading-tight">MULTI-<br/>CAIXA</span>;
  if (type === "mpesa")       return <span className="font-black text-white text-xs">M-Pesa</span>;
  if (type === "unitel")      return <span className="font-black text-white text-xs">Unitel</span>;
  if (type === "paypal")      return <span className="font-black text-white text-xs">PayPal</span>;
  if (type === "usdt")        return <span className="font-black text-white text-xs font-mono">USDT</span>;
  if (type === "usdc")        return <span className="font-black text-white text-xs font-mono">USDC</span>;
  return <Landmark className="w-5 h-5 text-white/60"/>;
};

const MethodMeta = ({ m }: { m: PaymentMethod }) => {
  if (m.type === "transfer") return (
    <>
      <p className="font-bold text-white text-sm">{m.label}</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color:W30 }}>{m.iban}</p>
      <p className="text-[10px]" style={{ color:W30 }}>{m.bank}</p>
    </>
  );
  if (m.type === "multicaixa" || m.type === "mpesa" || m.type === "unitel") return (
    <>
      <p className="font-bold text-white text-sm">{m.label}</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color:W30 }}>{m.phone}</p>
    </>
  );
  if (m.type === "paypal") return (
    <>
      <p className="font-bold text-white text-sm">PayPal</p>
      <p className="text-[10px] mt-0.5" style={{ color:W30 }}>{m.email}</p>
    </>
  );
  if (m.type === "usdt" || m.type === "usdc") return (
    <>
      <p className="font-bold text-white text-sm">{m.type.toUpperCase()} — Stablecoin</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color:W30 }}>
        {m.wallet ? `${m.wallet.slice(0,10)}…${m.wallet.slice(-6)}` : "Carteira configurada"}{m.network ? ` · ${m.network}` : ""}
      </p>
    </>
  );
  return (
    <>
      <p className="font-bold text-white text-sm">{m.label} •••• {m.last4}</p>
      <p className="text-[11px] mt-0.5" style={{ color:W30 }}>{m.holder} · Expira {m.expiry}</p>
    </>
  );
};

/* ═══════════════════════════════════════════════════════
   USAGE BAR
═══════════════════════════════════════════════════════ */
const UsageBar = ({ label, current, max, percent, accent = BLUE_MID }:
  { label:string; current:number; max:number; percent?:number; accent?:string }) => {
  const pct = percent ?? (max === -1 ? 20 : Math.round((current / max) * 100));
  const danger = pct > 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:W30 }}>{label}</span>
        <span className="text-sm font-black" style={{ color:WHITE }}>
          {current}{max !== undefined && <span style={{ color:W30 }}>/{max === -1 ? "∞" : max}</span>}
          {percent !== undefined && "%"}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:W10 }}>
        <motion.div
          initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:0.8, ease:"easeOut" }}
          className="h-full rounded-full"
          style={{ background: danger ? RED : accent }}
        />
      </div>
      <p className="text-[10px]" style={{ color: danger ? RED : W30 }}>
        {danger ? "Limite próximo" : `${pct}% utilizado`}
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PLAN CARD
═══════════════════════════════════════════════════════ */
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
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:index * 0.08 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: isCurrent ? plan.accentDim : BG_CARD,
        border:`1px solid ${isCurrent ? plan.accentBdr : BORDER}`,
        boxShadow: plan.popular ? `0 0 40px ${plan.accentDim}` : "none",
      }}
    >
      {plan.popular && (
        <div className="absolute top-4 right-4">
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background:plan.accentDim, color:plan.accent, border:`1px solid ${plan.accentBdr}` }}>
            Mais Popular
          </span>
        </div>
      )}
      {savings > 0 && cycle === "annual" && (
        <div className="absolute top-4 left-4">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background:GREEN_DIM, color:GREEN, border:`1px solid ${GREEN_BDR}` }}>
            -{savings}%
          </span>
        </div>
      )}

      <div className="p-6 border-b" style={{ borderColor:BORDER }}>
        <div className="flex items-center gap-3 mb-4 mt-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:plan.accentDim }}>
            <Icon className="w-5 h-5" style={{ color:plan.accent }} />
          </div>
          <div>
            <p className="font-black text-white">{plan.name}</p>
            {isCurrent && <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:plan.accent }}>● Plano Atual</span>}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white">{fmt(price)}</span>
          <span className="text-xs font-bold" style={{ color:W30 }}>/{cycle === "annual" ? "ano" : "mês"}</span>
        </div>
        {cycle === "annual" && savings > 0 && (
          <p className="text-[10px] mt-1" style={{ color:GREEN }}>Poupa {fmt(plan.priceMonthly * 12 - plan.price)}/ano vs mensal</p>
        )}
      </div>

      <div className="p-6 flex-1 space-y-2.5">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background:plan.accentDim }}>
              <Check className="w-2.5 h-2.5" style={{ color:plan.accent }} />
            </div>
            <span className="text-xs font-medium" style={{ color:W60 }}>{f}</span>
          </div>
        ))}
      </div>

      <div className="p-6 pt-0">
        <button
          disabled={isCurrent}
          onClick={() => !isCurrent && onAction(plan.id, isUpgrade ? "upgrade" : "downgrade")}
          className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:cursor-default"
          style={{
            background: isCurrent ? plan.accentDim : plan.accent === W60 ? W10 : plan.accent,
            color: isCurrent ? plan.accent : plan.accent === W60 ? W60 : (plan.accent === GOLD ? "#000" : WHITE),
            border: isCurrent ? `1px solid ${plan.accentBdr}` : "none",
          }}
          onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {isCurrent ? <><Check className="w-4 h-4"/> Plano Atual</> :
           isUpgrade  ? <><ArrowUpRight className="w-4 h-4"/> Fazer Upgrade</> :
                        <><ArrowDownRight className="w-4 h-4"/> Mudar Plano</>}
        </button>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   PAYMENT METHOD CARD
═══════════════════════════════════════════════════════ */
const PMCard = ({ method, onDelete, onSetDefault }:
  { method:PaymentMethod; onDelete:(id:string)=>void; onSetDefault:(id:string)=>void }) => (
  <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
    className="relative group rounded-2xl overflow-hidden"
    style={{ background: method.isDefault ? BLUE_DIM : BG_CARD, border:`1px solid ${method.isDefault ? BLUE_BDR : BORDER}` }}>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: CARD_BG[method.type] || BG_HOVER }}>
            <div className="absolute inset-0 opacity-10" style={{ background:"linear-gradient(135deg, rgba(255,255,255,0.3), transparent)" }}/>
            <CardLogo type={method.type}/>
          </div>
          <MethodMeta m={method}/>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {method.isDefault ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background:BLUE_DIM, color:BLUE_MID, border:`1px solid ${BLUE_BDR}` }}>
              <BadgeCheck className="w-3 h-3"/> Predefinido
            </span>
          ) : (
            <button onClick={() => onSetDefault(method.id)}
              className="h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 border"
              style={{ borderColor:BORDER, color:W30 }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=BLUE_BDR; el.style.color=BLUE_MID; el.style.background=BLUE_DIM; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=BORDER; el.style.color=W30; el.style.background="transparent"; }}>
              Predefinir
            </button>
          )}
          <button onClick={() => onDelete(method.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            style={{ color:W30 }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color=RED; el.style.background=RED_DIM; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color=W30; el.style.background="transparent"; }}>
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   PAYMENT TAB
═══════════════════════════════════════════════════════ */

// Bitcoin removed from AddStep
type AddStep = "choose" | "card" | "transfer" | "multicaixa" | "mobile_money" | "paypal" | "stablecoin";

const PAYMENT_GROUPS = [
  {
    label: "Cartões Internacionais",
    items: [
      { type:"card" as const, label:"Cartão Visa / Mastercard / AMEX / UnionPay", icon:CreditCard, desc:"Débito ou crédito, qualquer banco" },
    ],
  },
  {
    label: "Angola — Métodos Locais",
    items: [
      { type:"multicaixa" as const, label:"MULTICAIXA Express", icon:QrCode, desc:"Via QR Code ou número de telemóvel" },
      { type:"mobile_money" as const, label:"M-Pesa / Unitel Money", icon:Smartphone, desc:"Carteiras móveis angolanas" },
      { type:"transfer" as const, label:"Transferência Bancária (IBAN)", icon:Landmark, desc:"BAI, BFA, BIC, ATL, Millennium BIM…" },
    ],
  },
  {
    label: "Internacional Digital",
    items: [
      { type:"paypal" as const, label:"PayPal", icon:Globe, desc:"Conta PayPal verificada" },
    ],
  },
  {
    label: "Stablecoins",
    items: [
      { type:"stablecoin" as const, label:"USDT / USDC", icon:CircleDollarSign, desc:"Stablecoins via TRC-20 ou ERC-20" },
    ],
  },
];

const PaymentTab = () => {
  const [methods, setMethods]         = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [showDialog, setShowDialog]   = useState(false);
  const [step, setStep]               = useState<AddStep>("choose");
  const [isAdding, setIsAdding]       = useState(false);
  const [showCVV, setShowCVV]         = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);
  const [stableCoin, setStableCoin]   = useState<"usdt"|"usdc">("usdt");
  const [stableNet, setStableNet]     = useState("TRC-20");
  const [mobileOp, setMobileOp]       = useState<"mpesa"|"unitel">("mpesa");
  const [autoRenew, setAutoRenew]     = useState(true);

  const [cardForm, setCardForm]       = useState({ number:"", holder:"", expiry:"", cvv:"", network:"visa" as PaymentMethodType });
  const [tfForm, setTfForm]           = useState({ bank:"", iban:"", swift:"" });
  const [mcForm, setMcForm]           = useState({ phone:"" });
  const [mmForm, setMmForm]           = useState({ phone:"" });
  const [ppForm, setPpForm]           = useState({ email:"" });
  const [crForm, setCrForm]           = useState({ wallet:"" });

  const formatCardNum = (v: string) => v.replace(/\D/g,"").slice(0,16).replace(/(\d{4})/g,"$1 ").trim();
  const formatExpiry  = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2) : d; };
  const detectNet = (n: string): PaymentMethodType => {
    const s = n.replace(/\s/g,"");
    if (s.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(s)) return "mastercard";
    if (/^3[47]/.test(s)) return "amex";
    if (/^62/.test(s)) return "unionpay";
    return "visa";
  };

  const handleDelete     = (id: string) => { setMethods(p => p.filter(m => m.id !== id)); toast.success("Método removido."); };
  const handleSetDefault = (id: string) => { setMethods(p => p.map(m => ({ ...m, isDefault: m.id === id }))); toast.success("Método predefinido atualizado."); };

  const openDialog  = () => { setStep("choose"); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setTimeout(() => setStep("choose"), 300); };

  const copyToClipboard = (text: string, key: string) => {
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
      setMethods(p => [...p, { id, type:t, label:t.charAt(0).toUpperCase()+t.slice(1), last4:cardForm.number.replace(/\s/g,"").slice(-4), expiry:cardForm.expiry, holder:cardForm.holder, isDefault:false }]);
    } else if (step === "transfer") {
      setMethods(p => [...p, { id, type:"transfer", label:`Transferência ${tfForm.bank}`, bank:tfForm.bank, iban:tfForm.iban, isDefault:false }]);
    } else if (step === "multicaixa") {
      setMethods(p => [...p, { id, type:"multicaixa", label:"MULTICAIXA Express", phone:mcForm.phone, isDefault:false }]);
    } else if (step === "mobile_money") {
      setMethods(p => [...p, { id, type:mobileOp, label:mobileOp === "mpesa" ? "M-Pesa" : "Unitel Money", phone:mmForm.phone, isDefault:false }]);
    } else if (step === "paypal") {
      setMethods(p => [...p, { id, type:"paypal", label:"PayPal", email:ppForm.email, isDefault:false }]);
    } else if (step === "stablecoin") {
      setMethods(p => [...p, { id, type:stableCoin, label:`${stableCoin.toUpperCase()} (${stableNet})`, wallet:crForm.wallet, network:stableNet, isDefault:false }]);
    }

    toast.success("Método de pagamento adicionado com sucesso.");
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

  const inp = "h-11 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:border-blue-500/40 px-3 w-full outline-none transition-colors";

  const ALPHA_BANK = [
    ["Banco",       "Standard Bank Angola"],
    ["Titular",     "AlphaData Technologies Lda"],
    ["IBAN",        "AO06 0090 0000 1234 5678 9X1"],
    ["SWIFT",       "STBAAOLUAXXX"],
    ["Referência",  `SUB-${Date.now().toString().slice(-6)}`],
  ];

  // Only stablecoins — no Bitcoin
  const STABLE_WALLETS: Record<string, string> = {
    "usdt-TRC-20":  "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    "usdt-ERC-20":  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "usdc-ERC-20":  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "usdc-TRC-20":  "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  };
  const walletKey = `${stableCoin}-${stableNet}`;

  const stableCoinColor: Record<string, string> = {
    usdt: CARD_BG.usdt,
    usdc: CARD_BG.usdc,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-black text-white">Métodos de Pagamento</p>
          <p className="text-[11px] font-medium mt-0.5" style={{ color:W30 }}>
            Gire cartões, contas bancárias e carteiras digitais associadas à sua organização.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:W30 }}>Renovação Auto</span>
            <button onClick={() => setAutoRenew(p => !p)}
              className="w-9 h-5 rounded-full relative transition-colors"
              style={{ background: autoRenew ? BLUE : W10 }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: autoRenew ? "calc(100% - 18px)" : "2px" }}/>
            </button>
          </div>
          <button onClick={openDialog}
            className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white transition-all"
            style={{ background:BLUE }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#1448D0")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}>
            <Plus className="w-4 h-4"/> Adicionar Método
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {methods.length > 0 ? methods.map(m => (
            <PMCard key={m.id} method={m} onDelete={handleDelete} onSetDefault={handleSetDefault}/>
          )) : (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="rounded-2xl p-14 flex flex-col items-center gap-4 text-center"
              style={{ background:BG_CARD, border:`1px dashed ${BORDER}` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:W10 }}>
                <CreditCard className="w-7 h-7" style={{ color:W30 }}/>
              </div>
              <div>
                <p className="font-black text-white">Nenhum método guardado</p>
                <p className="text-xs mt-1" style={{ color:W30 }}>Adicione um método para ativar renovações automáticas.</p>
              </div>
              <button onClick={openDialog} className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white" style={{ background:BLUE }}>
                <Plus className="w-3.5 h-3.5 inline mr-1.5"/> Adicionar Método
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next payment */}
      <div className="rounded-2xl p-5" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color:W30 }}>Próximo Pagamento</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:BLUE_DIM }}>
              <Calendar className="w-5 h-5" style={{ color:BLUE_MID }}/>
            </div>
            <div>
              <p className="font-black text-white">{fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)}</p>
              <p className="text-[11px]" style={{ color:W30 }}>
                {format(MOCK_SUB.renewalDate, "dd 'de' MMMM 'de' yyyy", { locale:pt })}
                {" "}· Plano {PLANS.find(p=>p.id===MOCK_SUB.plan)?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-7 rounded-md flex items-center justify-center" style={{ background:CARD_BG[methods.find(m=>m.isDefault)?.type||"transfer"]||BG_HOVER }}>
              <CardLogo type={methods.find(m=>m.isDefault)?.type||"transfer"}/>
            </div>
            <span className="text-xs font-bold" style={{ color:W60 }}>
              {methods.find(m=>m.isDefault)?.label || "Sem método predefinido"}
            </span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background:BLUE_DIM, border:`1px solid ${BLUE_BDR}` }}>
        <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color:BLUE_MID }}/>
        <p className="text-[11px] font-medium" style={{ color:W60 }}>
          Os dados de pagamento são encriptados com TLS 256-bit. Processamento PCI-DSS Nível 1 via Stripe.
          Transações em stablecoins verificadas on-chain antes da ativação da subscrição.
        </p>
      </div>

      {/* ══ ADD METHOD DIALOG ══ */}
      <Dialog open={showDialog} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
          style={{ background:BG_CARD, border:`1px solid ${BLUE_BDR}`, borderRadius:"1.25rem", scrollbarWidth:"thin", scrollbarColor:`${BORDER} transparent` }}>

          <DialogHeader>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                {step !== "choose" && (
                  <button onClick={() => setStep("choose")} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background:W10, color:W60 }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG_HOVER)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = W10)}>
                    ←
                  </button>
                )}
                <DialogTitle className="text-white font-black text-lg">
                  {step === "choose"      ? "Adicionar Método de Pagamento" :
                   step === "card"        ? "Cartão Bancário" :
                   step === "transfer"    ? "Transferência Bancária" :
                   step === "multicaixa"  ? "MULTICAIXA Express" :
                   step === "mobile_money"? "Carteira Móvel" :
                   step === "paypal"      ? "PayPal" :
                                           "Stablecoin (USDT / USDC)"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">

            {/* ─── CHOOSE ─── */}
            {step === "choose" && (
              <motion.div key="choose" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-5 py-2">
                {PAYMENT_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color:W30 }}>{group.label}</p>
                    <div className="space-y-1.5">
                      {group.items.map(item => (
                        <button key={item.type}
                          onClick={() => setStep(item.type as AddStep)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group"
                          style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=BLUE_BDR; el.style.background=BG_HOVER; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=BORDER; el.style.background=BG_NAVY; }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background:BLUE_DIM }}>
                            <item.icon className="w-5 h-5" style={{ color:BLUE_MID }}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">{item.label}</p>
                            <p className="text-[11px]" style={{ color:W30 }}>{item.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color:WHITE }}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ─── CARD ─── */}
            {step === "card" && (
              <motion.div key="card" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="relative h-36 rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
                  style={{ background:`linear-gradient(135deg, ${CARD_BG[detectNet(cardForm.number)]}, ${BG_NAVY})`, border:`1px solid ${BORDER}` }}>
                  <div className="absolute inset-0 opacity-10" style={{ background:"radial-gradient(ellipse at top right, white, transparent 60%)" }}/>
                  <div className="flex items-center justify-between relative">
                    <Wifi className="w-5 h-5 rotate-90" style={{ color:"rgba(255,255,255,0.4)" }}/>
                    <CardLogo type={detectNet(cardForm.number)}/>
                  </div>
                  <div className="relative">
                    <p className="font-mono text-white text-lg tracking-widest font-bold">{cardForm.number || "•••• •••• •••• ••••"}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.5)" }}>{cardForm.holder || "NOME DO TITULAR"}</span>
                      <span className="text-[11px] font-mono" style={{ color:"rgba(255,255,255,0.5)" }}>{cardForm.expiry || "MM/AA"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>Número do Cartão</label>
                  <input className={inp} placeholder="1234 5678 9012 3456" maxLength={19}
                    value={cardForm.number} onChange={e => setCardForm(p => ({ ...p, number:formatCardNum(e.target.value) }))}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>Titular do Cartão</label>
                  <input className={inp} placeholder="Como aparece no cartão"
                    value={cardForm.holder} onChange={e => setCardForm(p => ({ ...p, holder:e.target.value.toUpperCase() }))}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>Validade</label>
                    <input className={inp} placeholder="MM/AA" maxLength={5}
                      value={cardForm.expiry} onChange={e => setCardForm(p => ({ ...p, expiry:formatExpiry(e.target.value) }))}/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>CVV</label>
                    <div className="relative">
                      <input type={showCVV ? "text" : "password"} className={inp + " pr-10"} placeholder="•••" maxLength={4}
                        value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv:e.target.value.replace(/\D/g,"").slice(0,4) }))}/>
                      <button type="button" onClick={() => setShowCVV(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:W30 }}>
                        {showCVV ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── TRANSFER ─── */}
            {step === "transfer" && (
              <motion.div key="transfer" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>Banco</label>
                  <input className={inp} placeholder="Ex: BAI, BFA, BIC, Millennium BIM, ATL"
                    value={tfForm.bank} onChange={e => setTfForm(p => ({ ...p, bank:e.target.value }))}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>IBAN / Conta</label>
                  <input className={inp} placeholder="AO06 0044 0000 6729 5034 1X1"
                    value={tfForm.iban} onChange={e => setTfForm(p => ({ ...p, iban:e.target.value.toUpperCase() }))}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>
                    SWIFT / BIC <span className="normal-case font-normal" style={{ color:"rgba(255,255,255,0.18)" }}>(opcional)</span>
                  </label>
                  <input className={inp} placeholder="Ex: BAIAAOLUAXXX"
                    value={tfForm.swift} onChange={e => setTfForm(p => ({ ...p, swift:e.target.value.toUpperCase() }))}/>
                </div>
                <div className="p-4 rounded-xl space-y-3" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:BLUE_MID }}>Dados para Transferência — AlphaData</p>
                  {ALPHA_BANK.map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center group">
                      <span className="text-[10px]" style={{ color:W30 }}>{k}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-white">{v}</span>
                        <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:W30 }}>
                          {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color:GREEN }}/> : <Copy className="w-3 h-3"/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── MULTICAIXA ─── */}
            {step === "multicaixa" && (
              <motion.div key="multicaixa" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="p-5 rounded-xl flex flex-col items-center gap-3 text-center" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background:CARD_BG.multicaixa }}>
                    <QrCode className="w-7 h-7 text-white"/>
                  </div>
                  <div>
                    <p className="font-black text-white">MULTICAIXA Express</p>
                    <p className="text-[11px]" style={{ color:W30 }}>Pagamentos instantâneos via app ou referência</p>
                  </div>
                  <div className="w-full p-3 rounded-lg" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color:BLUE_MID }}>Referência de Pagamento</p>
                    {[["Entidade", "11223"], ["Referência", "987 654 321"], ["Montante", fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)]].map(([k,v]) => (
                      <div key={k} className="flex justify-between group">
                        <span className="text-[10px]" style={{ color:W30 }}>{k}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-white">{v}</span>
                          <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:W30 }}>
                            {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color:GREEN }}/> : <Copy className="w-3 h-3"/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>Número de Telemóvel (para renovações)</label>
                  <input className={inp} placeholder="+244 9XX XXX XXX"
                    value={mcForm.phone} onChange={e => setMcForm({ phone:e.target.value })}/>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background:GREEN_DIM, border:`1px solid ${GREEN_BDR}` }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color:GREEN }}/>
                  <p className="text-[11px]" style={{ color:W60 }}>Após pagamento, o acesso é ativado automaticamente em até 15 minutos úteis.</p>
                </div>
              </motion.div>
            )}

            {/* ─── MOBILE MONEY ─── */}
            {step === "mobile_money" && (
              <motion.div key="mobile" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="flex gap-2 p-1.5 rounded-xl" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                  {(["mpesa","unitel"] as const).map(op => (
                    <button key={op} onClick={() => setMobileOp(op)}
                      className="flex-1 h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
                      style={{ background: mobileOp === op ? BLUE : "transparent", color: mobileOp === op ? WHITE : W30 }}>
                      {op === "mpesa" ? "M-Pesa" : "Unitel Money"}
                    </button>
                  ))}
                </div>
                <div className="p-4 rounded-xl space-y-2" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:BLUE_MID }}>
                    Enviar para AlphaData via {mobileOp === "mpesa" ? "M-Pesa" : "Unitel Money"}
                  </p>
                  {[
                    ["Número",  mobileOp === "mpesa" ? "+244 912 345 678" : "+244 923 765 432"],
                    ["Titular", "AlphaData Technologies"],
                    ["Ref.",    `ALPHA-${Date.now().toString().slice(-6)}`],
                    ["Valor",   fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between group">
                      <span className="text-[10px]" style={{ color:W30 }}>{k}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-white">{v}</span>
                        <button onClick={() => copyToClipboard(v, k)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:W30 }}>
                          {copied === k ? <CheckCircle2 className="w-3 h-3" style={{ color:GREEN }}/> : <Copy className="w-3 h-3"/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>O seu número (para renovações automáticas)</label>
                  <input className={inp} placeholder="+244 9XX XXX XXX"
                    value={mmForm.phone} onChange={e => setMmForm({ phone:e.target.value })}/>
                </div>
              </motion.div>
            )}

            {/* ─── PAYPAL ─── */}
            {step === "paypal" && (
              <motion.div key="paypal" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                <div className="p-5 rounded-xl flex flex-col items-center gap-3 text-center" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background:CARD_BG.paypal }}>
                    <Globe className="w-7 h-7 text-white"/>
                  </div>
                  <div>
                    <p className="font-black text-white">PayPal</p>
                    <p className="text-[11px]" style={{ color:W30 }}>Pagamentos internacionais via conta PayPal verificada</p>
                  </div>
                  <div className="p-3 rounded-lg w-full flex items-center justify-between group" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
                    <span className="text-[10px]" style={{ color:W30 }}>Email AlphaData</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-white">billing@alphadata.ao</span>
                      <button onClick={() => copyToClipboard("billing@alphadata.ao", "paypal_email")} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:W30 }}>
                        {copied === "paypal_email" ? <CheckCircle2 className="w-3 h-3" style={{ color:GREEN }}/> : <Copy className="w-3 h-3"/>}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>O seu email PayPal</label>
                  <input className={inp} type="email" placeholder="exemplo@gmail.com"
                    value={ppForm.email} onChange={e => setPpForm({ email:e.target.value })}/>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background:BLUE_DIM, border:`1px solid ${BLUE_BDR}` }}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color:BLUE_MID }}/>
                  <p className="text-[11px]" style={{ color:W60 }}>Será redirecionado para o PayPal para autorizar o débito automático em cada ciclo de faturação.</p>
                </div>
              </motion.div>
            )}

            {/* ─── STABLECOIN (USDT / USDC — no Bitcoin) ─── */}
            {step === "stablecoin" && (
              <motion.div key="stablecoin" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} className="space-y-4 py-2">
                {/* Coin selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color:W30 }}>Moeda</label>
                  <div className="flex gap-2">
                    {(["usdt","usdc"] as const).map(coin => (
                      <button key={coin} onClick={() => setStableCoin(coin)}
                        className="flex-1 h-10 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        style={{
                          background: stableCoin === coin ? stableCoinColor[coin] : BG_NAVY,
                          border:`1px solid ${stableCoin === coin ? "rgba(255,255,255,0.15)" : BORDER}`,
                          color: WHITE,
                        }}>
                        {coin === "usdt" ? "₮ USDT" : "$ USDC"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Network selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color:W30 }}>Rede Blockchain</label>
                  <div className="flex gap-2">
                    {["TRC-20","ERC-20"].map(net => (
                      <button key={net} onClick={() => setStableNet(net)}
                        className="flex-1 h-9 rounded-xl text-[11px] font-black transition-all"
                        style={{
                          background: stableNet === net ? BLUE_DIM : BG_NAVY,
                          color: stableNet === net ? BLUE_MID : W30,
                          border:`1px solid ${stableNet === net ? BLUE_BDR : BORDER}`,
                        }}>
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet address */}
                {STABLE_WALLETS[walletKey] && (
                  <div className="p-4 rounded-xl space-y-3" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: stableCoinColor[stableCoin] }}>
                      Endereço AlphaData — {stableCoin.toUpperCase()} ({stableNet})
                    </p>
                    <div className="p-3 rounded-lg flex items-start justify-between gap-3" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
                      <p className="text-[11px] font-mono text-white break-all leading-relaxed">{STABLE_WALLETS[walletKey]}</p>
                      <button onClick={() => copyToClipboard(STABLE_WALLETS[walletKey], "wallet")} className="shrink-0 mt-0.5" style={{ color:W30 }}>
                        {copied === "wallet" ? <CheckCircle2 className="w-4 h-4" style={{ color:GREEN }}/> : <Copy className="w-4 h-4"/>}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px]" style={{ color:W30 }}>Valor a transferir</span>
                      <span className="text-[10px] font-mono font-bold text-white">
                        {fmt(PLANS.find(p=>p.id===MOCK_SUB.plan)?.price||0)} — verificar câmbio na data
                      </span>
                    </div>
                  </div>
                )}

                {/* Return wallet (optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color:W30 }}>
                    Endereço de retorno <span className="normal-case font-normal" style={{ color:"rgba(255,255,255,0.18)" }}>(opcional, para recibos)</span>
                  </label>
                  <input className={inp} placeholder="O seu endereço de carteira"
                    value={crForm.wallet} onChange={e => setCrForm({ wallet:e.target.value })}/>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background:GOLD_DIM, border:`1px solid ${GOLD_BDR}` }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:GOLD }}/>
                  <p className="text-[11px]" style={{ color:W60 }}>
                    A subscrição é ativada após 2–6 confirmações on-chain. Envie apenas {stableCoin.toUpperCase()} via rede {stableNet}.
                    Envio de outro ativo ou rede resulta em perda permanente de fundos.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {step !== "choose" && (
            <DialogFooter className="gap-2 mt-2">
              <button onClick={closeDialog} disabled={isAdding}
                className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
                style={{ background:W10, color:W60, border:`1px solid ${BORDER}` }}>
                Cancelar
              </button>
              <button onClick={handleAdd} disabled={isAdding || !canSubmit()}
                className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white disabled:opacity-40 min-w-[160px] justify-center"
                style={{ background:BLUE }}
                onMouseEnter={e => { if(!isAdding) (e.currentTarget as HTMLElement).style.background="#1448D0"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=BLUE; }}>
                {isAdding
                  ? <><Clock className="w-4 h-4 animate-spin"/> A guardar…</>
                  : <><Check className="w-4 h-4"/> Guardar Método</>}
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
const Subscription = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"annual"|"monthly">("annual");
  const [dialogState, setDialogState]   = useState<{ type:"upgrade"|"downgrade"|null; planId:string|null }>({ type:null, planId:null });
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlan = useMemo(() => PLANS.find(p => p.id === MOCK_SUB.plan) || PLANS[0], []);
  const targetPlan  = useMemo(() => PLANS.find(p => p.id === dialogState.planId), [dialogState.planId]);

  const handlePlanAction = useCallback((planId:string, type:"upgrade"|"downgrade") => setDialogState({ type, planId }), []);
  const closeDialog = () => setDialogState({ type:null, planId:null });

  const confirmPlanChange = async () => {
    setIsProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success(`Plano ${dialogState.type === "upgrade" ? "atualizado" : "alterado"} com sucesso.`, {
        description:"As alterações entrarão em vigor no próximo ciclo de faturação.",
      });
      closeDialog();
    } catch { toast.error("Erro ao alterar o plano. Por favor tente novamente."); }
    finally { setIsProcessing(false); }
  };

  const TH = "text-[10px] font-black uppercase tracking-widest py-3 px-5 text-left";
  const TD = "py-4 px-5 text-sm";

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background:BG_DEEP, color:WHITE }}>
      <Sidebar activeItem="/subscription"/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeItem="/subscription"/>

        <main className="flex-1 overflow-y-auto p-6 md:p-10" style={{ scrollbarWidth:"thin", scrollbarColor:`${BORDER} transparent` }}>
          <div className="max-w-[1300px] mx-auto space-y-8">

            {/* Page header */}
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{ background:BLUE_DIM, color:BLUE_MID, border:`1px solid ${BLUE_BDR}` }}>
                  <Flame className="w-3 h-3 fill-current"/> Faturação & Subscrição
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Gestão de <span style={{ color:BLUE_MID }}>Subscrição</span>
              </h1>
              <p className="text-sm font-medium mt-1" style={{ color:W30 }}>
                Gira o plano, métodos de pagamento e histórico de faturação da sua organização.
              </p>
            </motion.div>

            {/* Hero — current plan */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="rounded-2xl overflow-hidden"
              style={{ background:BG_CARD, border:`1px solid ${currentPlan.accentBdr}` }}>
              <div className="relative p-6 md:p-8 overflow-hidden"
                style={{ background:`linear-gradient(135deg, ${currentPlan.accentDim}, transparent 60%)` }}>
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border opacity-5"
                  style={{ borderColor:currentPlan.accent, borderWidth:32 }}/>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background:currentPlan.accentDim, border:`1px solid ${currentPlan.accentBdr}` }}>
                      <currentPlan.icon className="w-8 h-8" style={{ color:currentPlan.accent }}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-black text-white">Plano {currentPlan.name}</h2>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background:GREEN_DIM, color:GREEN, border:`1px solid ${GREEN_BDR}` }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"/> Ativo
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color:W30 }}>
                        {fmt(currentPlan.price)}/ano
                        <span className="mx-2" style={{ color:W10 }}>·</span>
                        Renovação em {format(MOCK_SUB.renewalDate, "dd 'de' MMMM 'de' yyyy", { locale:pt })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border"
                      style={{ background:W10, color:W60, borderColor:BORDER }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background=BG_HOVER; el.style.color=WHITE; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background=W10; el.style.color=W60; }}>
                      <FileText className="w-4 h-4"/> Ver Contrato
                    </button>
                    <button className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all text-white"
                      style={{ background:BLUE }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#1448D0")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}>
                      <Zap className="w-4 h-4"/> Atualizar Agora
                    </button>
                  </div>
                </div>
              </div>

              {/* Usage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 border-t" style={{ borderColor:BORDER }}>
                <UsageBar label="Utilizadores"   current={MOCK_SUB.currentUsers}      max={currentPlan.maxUsers}      accent={currentPlan.accent}/>
                <UsageBar label="Workspaces"     current={MOCK_SUB.currentWorkspaces}  max={currentPlan.maxWorkspaces} accent={currentPlan.accent}/>
                <UsageBar label="Uso Geral"      current={MOCK_SUB.usagePercent}       max={100} percent={MOCK_SUB.usagePercent} accent={currentPlan.accent}/>
              </div>
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="plans" className="space-y-6">
              <TabsList className="flex gap-1 p-1.5 rounded-2xl h-auto w-fit"
                style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                {[["plans","Planos"],["billing","Faturação"],["payment","Pagamento"]].map(([v,l]) => (
                  <TabsTrigger key={v} value={v}
                    className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/30 transition-all data-[state=active]:text-black data-[state=active]:shadow-md whitespace-nowrap">
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* PLANS */}
              <TabsContent value="plans" className="mt-0 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:W30 }}>Ciclo de Faturação:</span>
                  <div className="flex p-1 rounded-xl gap-1" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
                    {(["annual","monthly"] as const).map(c => (
                      <button key={c} onClick={() => setBillingCycle(c)}
                        className="px-4 h-8 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
                        style={{ background: billingCycle === c ? BLUE : "transparent", color: billingCycle === c ? WHITE : W30 }}>
                        {c === "annual" ? "Anual (–20%)" : "Mensal"}
                      </button>
                    ))}
                  </div>
                  {billingCycle === "annual" && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background:GREEN_DIM, color:GREEN, border:`1px solid ${GREEN_BDR}` }}>
                      Poupe até {fmt(PLANS[1].priceMonthly * 12 - PLANS[1].price)}/ano
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {PLANS.map((plan, i) => (
                    <PlanCard key={plan.id} plan={plan} index={i}
                      isCurrent={plan.id === MOCK_SUB.plan}
                      onAction={handlePlanAction} cycle={billingCycle}/>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Info className="w-4 h-4" style={{ color:W30 }}/>
                  <span className="text-[11px]" style={{ color:W30 }}>
                    Todos os planos incluem SSL, backups diários e conformidade RGPD.
                  </span>
                </div>
              </TabsContent>

              {/* BILLING */}
              <TabsContent value="billing" className="mt-0 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label:"Total Pago (2025)", value:fmt(MOCK_BILLING.filter(b=>b.status==="paid").reduce((s,b)=>s+b.amount,0)), color:GREEN, bg:GREEN_DIM, bdr:GREEN_BDR },
                    { label:"Pendente",           value:fmt(MOCK_BILLING.filter(b=>b.status==="pending").reduce((s,b)=>s+b.amount,0)), color:GOLD, bg:GOLD_DIM, bdr:GOLD_BDR },
                    { label:"Falhou",             value:fmt(MOCK_BILLING.filter(b=>b.status==="failed").reduce((s,b)=>s+b.amount,0)),  color:RED,  bg:RED_DIM,  bdr:RED_BDR  },
                  ].map(s => (
                    <div key={s.label} className="p-5 rounded-2xl" style={{ background:s.bg, border:`1px solid ${s.bdr}` }}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:s.color }}>{s.label}</p>
                      <p className="text-2xl font-black text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl overflow-hidden" style={{ background:BG_CARD, border:`1px solid ${BORDER}` }}>
                  <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor:BORDER }}>
                    <div>
                      <p className="font-black text-white">Faturas Recentes</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color:W30 }}>Histórico completo de pagamentos da organização</p>
                    </div>
                    <button className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      style={{ background:BLUE_DIM, color:BLUE_MID, border:`1px solid ${BLUE_BDR}` }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(26,92,255,0.25)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE_DIM)}>
                      <Download className="w-3.5 h-3.5"/> Exportar Todas
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                          {["Data","Descrição","Método","Valor","Estado",""].map((h,i) => (
                            <th key={i} className={`${TH}${i === 5 ? " text-right" : ""}`} style={{ color:W30 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_BILLING.map(item => (
                          <tr key={item.id} style={{ borderBottom:`1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className={TD} style={{ color:W60 }}>{format(item.date, "dd MMM yyyy", { locale:pt })}</td>
                            <td className={`${TD} font-medium text-white`}>{item.description}</td>
                            <td className={`${TD} text-xs`} style={{ color:W60 }}>{item.method}</td>
                            <td className={`${TD} font-mono font-black text-white`}>{fmt(item.amount)}</td>
                            <td className={TD}>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                                style={{
                                  background: item.status==="paid" ? GREEN_DIM : item.status==="pending" ? GOLD_DIM : RED_DIM,
                                  color:      item.status==="paid" ? GREEN      : item.status==="pending" ? GOLD      : RED,
                                }}>
                                {item.status==="paid" ? "Pago" : item.status==="pending" ? "Pendente" : "Falhou"}
                              </span>
                            </td>
                            <td className={`${TD} text-right`}>
                              <button className="h-8 w-8 rounded-lg flex items-center justify-center ml-auto transition-all" style={{ color:W30 }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background=BLUE_DIM; el.style.color=BLUE_MID; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background="transparent"; el.style.color=W30; }}
                                title={`Descarregar ${item.invoice}`}>
                                <Download className="w-4 h-4"/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* PAYMENT */}
              <TabsContent value="payment" className="mt-0">
                <PaymentTab/>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Plan change dialog */}
      <Dialog open={!!dialogState.type} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[460px]"
          style={{ background:BG_CARD, border:`1px solid ${dialogState.type==="downgrade" ? RED_BDR : BLUE_BDR}`, borderRadius:"1.25rem" }}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: dialogState.type==="upgrade" ? BLUE_DIM : RED_DIM }}>
                {dialogState.type==="upgrade"
                  ? <ArrowUpRight className="w-5 h-5" style={{ color:BLUE_MID }}/>
                  : <ArrowDownRight className="w-5 h-5" style={{ color:RED }}/>}
              </div>
              <DialogTitle className="text-white font-black text-lg">
                {dialogState.type==="upgrade" ? "Upgrade de Plano" : "Alteração de Plano"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {dialogState.type==="downgrade" && (
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background:RED_DIM, border:`1px solid ${RED_BDR}` }}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color:RED }}/>
                <p className="text-xs font-medium" style={{ color:W60 }}>
                  Verifique que o uso atual ({MOCK_SUB.currentUsers} utilizadores) está dentro dos limites do novo plano
                  ({targetPlan?.maxUsers === -1 ? "ilimitado" : targetPlan?.maxUsers}).
                </p>
              </div>
            )}

            <div className="rounded-xl p-5 space-y-3" style={{ background:BG_NAVY, border:`1px solid ${BORDER}` }}>
              {[["Plano Atual", currentPlan.name, WHITE],["Novo Plano", targetPlan?.name||"—", targetPlan?.accent||WHITE]].map(([k,v,c]) => (
                <React.Fragment key={k}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:W30 }}>{k}</span>
                    <span className="text-sm font-bold" style={{ color:c }}>{v}</span>
                  </div>
                  <div className="h-px" style={{ background:BORDER }}/>
                </React.Fragment>
              ))}
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:W30 }}>Novo Valor Anual</span>
                <span className="text-2xl font-black text-white">{targetPlan ? fmt(targetPlan.price) : "—"}/ano</span>
              </div>
            </div>

            <p className="text-[11px] font-medium" style={{ color:W30 }}>
              {dialogState.type==="upgrade"
                ? `Terá acesso imediato a todas as funcionalidades do plano ${targetPlan?.name}. O valor será ajustado pro-rata.`
                : `Algumas funcionalidades serão desativadas no próximo ciclo de faturação.`}
            </p>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <button onClick={closeDialog} disabled={isProcessing}
              className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
              style={{ background:W10, color:W60, border:`1px solid ${BORDER}` }}>
              Cancelar
            </button>
            <button onClick={confirmPlanChange} disabled={isProcessing}
              className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white disabled:opacity-70 min-w-[160px] justify-center"
              style={{ background: dialogState.type==="upgrade" ? BLUE : RED }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = dialogState.type==="upgrade" ? "#1448D0" : "#C4111F"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = dialogState.type==="upgrade" ? BLUE : RED; }}>
              {isProcessing
                ? <><Clock className="w-4 h-4 animate-spin"/> A processar…</>
                : <><Check className="w-4 h-4"/> Confirmar Alteração</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        [role="tab"][data-state="active"] { background: ${BLUE_MID} !important; color: #fff !important; }
      `}</style>
    </div>
  );
};

export default Subscription;