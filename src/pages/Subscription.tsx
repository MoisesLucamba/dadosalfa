import React, { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Users, ArrowUpRight, ArrowDownRight,
  Check, Clock, FileText, Download, AlertCircle,
  Star, Zap, Building2, Mail, Phone, ChevronRight,
  Calendar, TrendingUp, Shield, Sparkles,
  Plus, Trash2, Lock, Eye, EyeOff, Landmark, Wifi, X, BadgeCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, addYears } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────────────────── */
const BG_DEEP  = "#04060D";
const BG_NAVY  = "#080D1A";
const BG_CARD  = "#0D1526";
const BG_HOVER = "#111E33";
const RED      = "#E8192C";
const RED_DIM  = "rgba(232,25,44,0.12)";
const RED_BDR  = "rgba(232,25,44,0.30)";
const BLUE     = "#1A5CFF";
const BLUE_MID = "#3B7BFF";
const BLUE_DIM = "rgba(26,92,255,0.15)";
const BLUE_BDR = "rgba(59,123,255,0.30)";
const WHITE    = "#FFFFFF";
const W60      = "rgba(255,255,255,0.60)";
const W30      = "rgba(255,255,255,0.30)";
const W10      = "rgba(255,255,255,0.08)";
const BORDER   = "rgba(255,255,255,0.07)";
const GOLD     = "#F59E0B";
const GOLD_DIM = "rgba(245,158,11,0.12)";
const GOLD_BDR = "rgba(245,158,11,0.30)";

/* ─── Types ──────────────────────────────────────────── */
interface Plan {
  id: string; name: string; price: number; maxUsers: number;
  maxWorkspaces: number; features: string[]; popular?: boolean;
  accent: string; accentDim: string; accentBdr: string;
  icon: any; priceMax?: number;
}
interface BillingHistoryItem {
  id: string; date: Date; amount: number;
  status: "paid" | "pending" | "failed"; description: string; invoice: string;
}
interface SubscriptionData {
  plan: string; status: "active" | "past_due" | "canceled";
  startDate: Date; renewalDate: Date; billingCycle: "monthly" | "annual";
  currentUsers: number; currentWorkspaces: number; usagePercent: number;
}

/* ─── Data ───────────────────────────────────────────── */
const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", price: 14999,
    maxUsers: 6, maxWorkspaces: 1,
    accent: W60, accentDim: W10, accentBdr: BORDER,
    icon: Shield,
    features: [
      "Dashboard em tempo real",
      "Dados de produção por bloco/operador",
      "Preços Brent e crudes angolanos",
      "Exportações e logística",
      "Previsões IA 30/60/90 dias",
      "Relatórios mensais automáticos",
      "Suporte por email",
    ],
  },
  {
    id: "professional", name: "Professional", price: 49999,
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
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise", name: "Enterprise", price: 250000,
    maxUsers: -1, maxWorkspaces: -1,
    accent: GOLD, accentDim: GOLD_DIM, accentBdr: GOLD_BDR,
    icon: Sparkles,
    features: [
      "Tudo do plano Professional",
      "Utilizadores ilimitados",
      "API de integração completa",
      "White-label customizado",
      "Domínio personalizado",
      "Suporte 24/7 dedicado",
      "Gestor de conta exclusivo",
    ],
  },
];

const MOCK_BILLING: BillingHistoryItem[] = [
  { id: "1", date: new Date("2025-12-01"), amount: 499, status: "paid", description: "Plano Professional — Dezembro 2025", invoice: "INV-2025-012" },
  { id: "2", date: new Date("2025-11-01"), amount: 499, status: "paid", description: "Plano Professional — Novembro 2025", invoice: "INV-2025-011" },
  { id: "3", date: new Date("2025-10-01"), amount: 499, status: "paid", description: "Plano Professional — Outubro 2025",  invoice: "INV-2025-010" },
  { id: "4", date: new Date("2025-09-01"), amount: 149, status: "paid", description: "Plano Starter — Setembro 2025",      invoice: "INV-2025-009" },
  { id: "5", date: new Date("2025-08-01"), amount: 149, status: "paid", description: "Plano Starter — Agosto 2025",        invoice: "INV-2025-008" },
];

const MOCK_SUB: SubscriptionData = {
  plan: "professional", status: "active",
  startDate: new Date("2025-09-01"),
  renewalDate: addYears(new Date(), 1),
  billingCycle: "annual",
  currentUsers: 8, currentWorkspaces: 3, usagePercent: 50,
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

/* ─── Usage bar ──────────────────────────────────────── */
const UsageBar = ({
  label, current, max, percent, accent = BLUE_MID
}: {
  label: string; current: number; max: number; percent?: number; accent?: string;
}) => {
  const pct = percent ?? (max === -1 ? 20 : Math.round((current / max) * 100));
  const displayMax = max === -1 ? "∞" : max;
  const danger = pct > 80;
  const barColor = danger ? RED : accent;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: W30 }}>{label}</span>
        <span className="text-sm font-black" style={{ color: WHITE }}>
          {current}{max !== undefined && <span style={{ color: W30 }}>/{displayMax}</span>}
          {percent !== undefined && "%"}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: W10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
      <p className="text-[10px]" style={{ color: danger ? RED : W30 }}>
        {danger ? "Limite próximo" : `${pct}% utilizado`}
      </p>
    </div>
  );
};

/* ─── Plan card ──────────────────────────────────────── */
const PlanCard = ({
  plan, isCurrent, onAction, index
}: {
  plan: Plan; isCurrent: boolean;
  onAction: (id: string, type: "upgrade" | "downgrade") => void;
  index: number;
}) => {
  const currentIdx = PLANS.findIndex(p => p.id === MOCK_SUB.plan);
  const thisIdx    = PLANS.findIndex(p => p.id === plan.id);
  const isUpgrade  = thisIdx > currentIdx;
  const Icon       = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: isCurrent ? `${plan.accentDim}` : BG_CARD,
        border: `1px solid ${isCurrent ? plan.accentBdr : BORDER}`,
        boxShadow: plan.popular ? `0 0 40px ${plan.accentDim}` : "none",
      }}
    >
      {/* popular badge */}
      {plan.popular && (
        <div className="absolute top-4 right-4">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: plan.accentDim, color: plan.accent, border: `1px solid ${plan.accentBdr}` }}
          >
            Mais Popular
          </span>
        </div>
      )}

      {/* header */}
      <div className="p-6 border-b" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: plan.accentDim }}>
            <Icon className="w-5 h-5" style={{ color: plan.accent }} />
          </div>
          <div>
            <p className="font-black text-white">{plan.name}</p>
            {isCurrent && (
              <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: plan.accent }}>
                ● Plano Atual
              </span>
            )}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">{fmt(plan.price)}</span>
            <span className="text-xs font-bold" style={{ color: W30 }}>/ano</span>
          </div>
          {plan.priceMax && (
            <p className="text-[10px]" style={{ color: W30 }}>até {fmt(plan.priceMax)}/ano</p>
          )}
        </div>
      </div>

      {/* features */}
      <div className="p-6 flex-1 space-y-2.5">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: plan.accentDim }}>
              <Check className="w-2.5 h-2.5" style={{ color: plan.accent }} />
            </div>
            <span className="text-xs font-medium" style={{ color: W60 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-6 pt-0">
        <button
          disabled={isCurrent}
          onClick={() => !isCurrent && onAction(plan.id, isUpgrade ? "upgrade" : "downgrade")}
          className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:cursor-default"
          style={{
            background: isCurrent ? plan.accentDim : plan.accent === W60 ? W10 : plan.accent,
            color: isCurrent ? plan.accent : plan.accent === W60 ? W60 : (plan.accent === GOLD ? "#000" : WHITE),
            border: isCurrent ? `1px solid ${plan.accentBdr}` : "none",
            opacity: isCurrent ? 1 : undefined,
          }}
          onMouseEnter={e => {
            if (!isCurrent) (e.currentTarget as HTMLElement).style.opacity = "0.85";
          }}
          onMouseLeave={e => {
            if (!isCurrent) (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          {isCurrent ? (
            <><Check className="w-4 h-4" /> Plano Atual</>
          ) : isUpgrade ? (
            <><ArrowUpRight className="w-4 h-4" /> Fazer Upgrade</>
          ) : (
            <><ArrowDownRight className="w-4 h-4" /> Mudar Plano</>
          )}
        </button>
      </div>
    </motion.div>
  );
};


/* ─── Saved payment method card ──────────────────────── */
interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'transfer';
  label: string;
  last4?: string;
  expiry?: string;
  holder?: string;
  isDefault: boolean;
  bank?: string;
  iban?: string;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm1', type: 'visa',       label: 'Visa',       last4: '4242', expiry: '08/27', holder: 'João Ferreira', isDefault: true  },
  { id: 'pm2', type: 'mastercard', label: 'Mastercard', last4: '5353', expiry: '03/26', holder: 'João Ferreira', isDefault: false },
  { id: 'pm3', type: 'transfer',   label: 'Transferência Bancária', bank: 'BAI Angola', iban: 'AO06 0044 0000 6729 5034 1X1', isDefault: false },
];

const CARD_NETWORK_COLORS: Record<string, string> = {
  visa:       '#1A1F71',
  mastercard: '#EB001B',
  amex:       '#2E77BC',
  transfer:   BG_HOVER,
};

const CardLogo = ({ type }: { type: string }) => {
  if (type === 'visa') return (
    <span className='font-black text-white italic tracking-tight text-sm' style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>VISA</span>
  );
  if (type === 'mastercard') return (
    <span className='flex items-center gap-0 shrink-0'>
      <span className='w-5 h-5 rounded-full' style={{ background: '#EB001B' }} />
      <span className='w-5 h-5 rounded-full -ml-2.5 opacity-80' style={{ background: '#F79E1B' }} />
    </span>
  );
  if (type === 'amex') return (
    <span className='font-black text-white text-xs'>AMEX</span>
  );
  return <Landmark className='w-5 h-5' style={{ color: BLUE_MID }} />;
};

const PaymentMethodCard = ({
  method, onDelete, onSetDefault
}: {
  method: PaymentMethod;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97 }}
    className='relative group rounded-2xl overflow-hidden'
    style={{
      background: method.isDefault ? BLUE_DIM : BG_CARD,
      border: `1px solid ${method.isDefault ? BLUE_BDR : BORDER}`,
    }}
  >
    <div className='p-5'>
      <div className='flex items-start justify-between gap-3'>
        {/* card visual */}
        <div className='flex items-center gap-4'>
          <div
            className='w-14 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden'
            style={{ background: CARD_NETWORK_COLORS[method.type] || BG_HOVER }}
          >
            <div className='absolute inset-0 opacity-10'
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3), transparent)' }} />
            <CardLogo type={method.type} />
          </div>
          <div>
            {method.type === 'transfer' ? (
              <>
                <p className='font-bold text-white text-sm'>{method.label}</p>
                <p className='text-[11px] font-mono mt-0.5' style={{ color: W30 }}>{method.iban}</p>
                <p className='text-[10px] mt-0.5' style={{ color: W30 }}>{method.bank}</p>
              </>
            ) : (
              <>
                <p className='font-bold text-white text-sm'>
                  {method.label} •••• {method.last4}
                </p>
                <p className='text-[11px] mt-0.5' style={{ color: W30 }}>
                  {method.holder} · Expira {method.expiry}
                </p>
              </>
            )}
          </div>
        </div>

        {/* actions */}
        <div className='flex items-center gap-1.5 shrink-0'>
          {method.isDefault ? (
            <span
              className='flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full'
              style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}
            >
              <BadgeCheck className='w-3 h-3' /> Predefinido
            </span>
          ) : (
            <button
              onClick={() => onSetDefault(method.id)}
              className='h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 border'
              style={{ borderColor: BORDER, color: W30 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BLUE_BDR; (e.currentTarget as HTMLElement).style.color = BLUE_MID; (e.currentTarget as HTMLElement).style.background = BLUE_DIM; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.color = W30; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              Predefinir
            </button>
          )}
          <button
            onClick={() => onDelete(method.id)}
            className='w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100'
            style={{ color: W30 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = RED; (e.currentTarget as HTMLElement).style.background = RED_DIM; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = W30; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Trash2 className='w-3.5 h-3.5' />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ─── Full Payment Tab ───────────────────────────────── */
const PaymentTab = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<'card' | 'transfer'>('card');
  const [showCVV, setShowCVV] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [cardForm, setCardForm] = useState({
    number: '', holder: '', expiry: '', cvv: '',
  });
  const [transferForm, setTransferForm] = useState({
    bank: '', iban: '', swift: '',
  });

  const handleDelete = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    toast.success('Método de pagamento removido.');
  };

  const handleSetDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    toast.success('Método predefinido atualizado.');
  };

  const formatCardNumber = (v: string) => {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  };
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0,2) + '/' + d.slice(2) : d;
  };

  const detectNetwork = (num: string): 'visa' | 'mastercard' | 'amex' => {
    const n = num.replace(/\s/g, '');
    if (n.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return 'visa';
  };

  const handleAddMethod = async () => {
    setIsAdding(true);
    await new Promise(r => setTimeout(r, 1200));
    if (addType === 'card') {
      const network = detectNetwork(cardForm.number);
      const last4 = cardForm.number.replace(/\s/g, '').slice(-4);
      setMethods(prev => [...prev, {
        id: 'pm' + Date.now(), type: network, label: network.charAt(0).toUpperCase() + network.slice(1),
        last4, expiry: cardForm.expiry, holder: cardForm.holder, isDefault: false
      }]);
    } else {
      setMethods(prev => [...prev, {
        id: 'pm' + Date.now(), type: 'transfer', label: 'Transferência Bancária',
        bank: transferForm.bank, iban: transferForm.iban, isDefault: false
      }]);
    }
    toast.success('Método de pagamento adicionado com sucesso!');
    setShowAddDialog(false);
    setIsAdding(false);
    setCardForm({ number: '', holder: '', expiry: '', cvv: '' });
    setTransferForm({ bank: '', iban: '', swift: '' });
  };

  const inputCls = 'h-11 rounded-xl text-sm text-white placeholder:text-white/20 focus:ring-0 bg-white/5 border border-white/10 focus:border-blue-500/40 px-3 w-full outline-none transition-colors';

  return (
    <div className='space-y-6'>
      {/* header */}
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-black text-white'>Métodos de Pagamento</p>
          <p className='text-[11px] font-medium mt-0.5' style={{ color: W30 }}>
            Gira cartões e contas bancárias para renovações automáticas.
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className='h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white transition-all'
          style={{ background: BLUE }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1448D0')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}
        >
          <Plus className='w-4 h-4' /> Adicionar Método
        </button>
      </div>

      {/* methods list */}
      <div className='space-y-3'>
        <AnimatePresence>
          {methods.length > 0 ? (
            methods.map(m => (
              <PaymentMethodCard key={m.id} method={m}
                onDelete={handleDelete} onSetDefault={handleSetDefault} />
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className='rounded-2xl p-14 flex flex-col items-center gap-4 text-center'
              style={{ background: BG_CARD, border: `1px dashed ${BORDER}` }}>
              <div className='w-14 h-14 rounded-2xl flex items-center justify-center' style={{ background: W10 }}>
                <CreditCard className='w-7 h-7' style={{ color: W30 }} />
              </div>
              <div>
                <p className='font-black text-white'>Nenhum método guardado</p>
                <p className='text-xs font-medium mt-1' style={{ color: W30 }}>Adicione um cartão ou conta bancária.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* security notice */}
      <div className='flex items-start gap-3 p-4 rounded-xl'
        style={{ background: BLUE_DIM, border: `1px solid ${BLUE_BDR}` }}>
        <Lock className='w-4 h-4 shrink-0 mt-0.5' style={{ color: BLUE_MID }} />
        <p className='text-[11px] font-medium' style={{ color: W60 }}>
          Os seus dados de pagamento são encriptados com TLS 256-bit e nunca armazenados nos nossos servidores.
          Processamento seguro via Stripe PCI-DSS nível 1.
        </p>
      </div>

      {/* ── Add method dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className='sm:max-w-[480px]'
          style={{ background: BG_CARD, border: `1px solid ${BLUE_BDR}`, borderRadius: '1.25rem' }}
        >
          <DialogHeader>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0' style={{ background: BLUE_DIM }}>
                <CreditCard className='w-5 h-5' style={{ color: BLUE_MID }} />
              </div>
              <DialogTitle className='text-white font-black text-lg'>Adicionar Método de Pagamento</DialogTitle>
            </div>

            {/* type toggle */}
            <div className='flex gap-2 p-1.5 rounded-xl' style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}>
              {[
                { key: 'card' as const,     label: 'Cartão de Crédito/Débito', icon: CreditCard },
                { key: 'transfer' as const, label: 'Transferência Bancária',    icon: Landmark   },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key}
                  onClick={() => setAddType(key)}
                  className='flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all'
                  style={{
                    background: addType === key ? BLUE : 'transparent',
                    color: addType === key ? WHITE : W30,
                  }}
                >
                  <Icon className='w-3.5 h-3.5' /> {label}
                </button>
              ))}
            </div>
          </DialogHeader>

          <div className='py-4 space-y-4'>
            {addType === 'card' ? (
              <>
                {/* card preview */}
                <div
                  className='relative h-36 rounded-2xl overflow-hidden p-5 flex flex-col justify-between'
                  style={{
                    background: `linear-gradient(135deg, ${CARD_NETWORK_COLORS[detectNetwork(cardForm.number)]}, ${BG_NAVY})`,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div className='absolute inset-0 opacity-10'
                    style={{ background: 'radial-gradient(ellipse at top right, white, transparent 60%)' }} />
                  <div className='flex items-center justify-between relative'>
                    <Wifi className='w-5 h-5 rotate-90' style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <CardLogo type={detectNetwork(cardForm.number)} />
                  </div>
                  <div className='relative'>
                    <p className='font-mono text-white text-lg tracking-widest font-bold'>
                      {cardForm.number || '•••• •••• •••• ••••'}
                    </p>
                    <div className='flex items-center justify-between mt-1'>
                      <span className='text-[11px] uppercase tracking-widest' style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {cardForm.holder || 'NOME DO TITULAR'}
                      </span>
                      <span className='text-[11px] font-mono' style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {cardForm.expiry || 'MM/AA'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* fields */}
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>Número do Cartão</label>
                  <input
                    placeholder='1234 5678 9012 3456'
                    value={cardForm.number}
                    onChange={e => setCardForm(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                    className={inputCls}
                    maxLength={19}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>Nome do Titular</label>
                  <input
                    placeholder='Como no cartão'
                    value={cardForm.holder}
                    onChange={e => setCardForm(p => ({ ...p, holder: e.target.value.toUpperCase() }))}
                    className={inputCls}
                  />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>Validade</label>
                    <input
                      placeholder='MM/AA'
                      value={cardForm.expiry}
                      onChange={e => setCardForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                      className={inputCls}
                      maxLength={5}
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>CVV</label>
                    <div className='relative'>
                      <input
                        type={showCVV ? 'text' : 'password'}
                        placeholder='•••'
                        value={cardForm.cvv}
                        onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                        className={inputCls + ' pr-10'}
                        maxLength={4}
                      />
                      <button type='button'
                        onClick={() => setShowCVV(p => !p)}
                        className='absolute right-3 top-1/2 -translate-y-1/2'
                        style={{ color: W30 }}>
                        {showCVV ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>Nome do Banco</label>
                  <input
                    placeholder='Ex: BAI Angola, BFA, Millennium'
                    value={transferForm.bank}
                    onChange={e => setTransferForm(p => ({ ...p, bank: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>IBAN / Conta</label>
                  <input
                    placeholder='Ex: AO06 0044 0000 6729 5034 1X1'
                    value={transferForm.iban}
                    onChange={e => setTransferForm(p => ({ ...p, iban: e.target.value.toUpperCase() }))}
                    className={inputCls}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase tracking-widest' style={{ color: W30 }}>SWIFT / BIC <span className='normal-case font-normal' style={{ color: 'rgba(255,255,255,0.18)' }}>(opcional)</span></label>
                  <input
                    placeholder='Ex: BAIAAOLUAXXX'
                    value={transferForm.swift}
                    onChange={e => setTransferForm(p => ({ ...p, swift: e.target.value.toUpperCase() }))}
                    className={inputCls}
                  />
                </div>
                {/* transfer info box */}
                <div className='p-4 rounded-xl space-y-2' style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}>
                  <p className='text-[10px] font-black uppercase tracking-widest' style={{ color: BLUE_MID }}>Dados para Transferência AlphaData</p>
                  <div className='space-y-1'>
                    {[
                      ['Banco', 'Standard Bank Angola'],
                      ['Titular', 'AlphaData Technologies Lda'],
                      ['IBAN', 'AO06 0090 0000 1234 5678 9X1'],
                      ['SWIFT', 'STBAAOLUAXXX'],
                      ['Referência', `SUB-${Date.now().toString().slice(-6)}`],
                    ].map(([k, v]) => (
                      <div key={k} className='flex justify-between'>
                        <span className='text-[10px]' style={{ color: W30 }}>{k}</span>
                        <span className='text-[10px] font-mono font-bold text-white'>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className='gap-2'>
            <button onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
              className='h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40'
              style={{ background: W10, color: W60, border: `1px solid ${BORDER}` }}>
              Cancelar
            </button>
            <button
              onClick={handleAddMethod}
              disabled={isAdding || (addType === 'card' ? !cardForm.number || !cardForm.holder || !cardForm.expiry || !cardForm.cvv : !transferForm.bank || !transferForm.iban)}
              className='h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed'
              style={{ background: BLUE }}
              onMouseEnter={e => { if (!isAdding) (e.currentTarget as HTMLElement).style.background = '#1448D0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BLUE; }}
            >
              {isAdding
                ? <><Clock className='w-4 h-4 animate-spin' /> A guardar…</>
                : <><Check className='w-4 h-4' /> Guardar Método</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
const Subscription = () => {
  const { user } = useAuth();
  const [dialogState, setDialogState] = useState<{ type: "upgrade" | "downgrade" | null; planId: string | null }>({
    type: null, planId: null
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlan = useMemo(() => PLANS.find(p => p.id === MOCK_SUB.plan) || PLANS[0], []);
  const targetPlan  = useMemo(() => PLANS.find(p => p.id === dialogState.planId), [dialogState.planId]);

  const handlePlanAction = useCallback((planId: string, type: "upgrade" | "downgrade") => {
    setDialogState({ type, planId });
  }, []);

  const closeDialog = () => setDialogState({ type: null, planId: null });

  const confirmPlanChange = async () => {
    setIsProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success(`Plano ${dialogState.type === "upgrade" ? "atualizado" : "alterado"} com sucesso!`, {
        description: "As alterações entrarão em vigor no próximo ciclo de faturação.",
      });
      closeDialog();
    } catch {
      toast.error("Erro ao alterar o plano. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const TH = "text-[10px] font-black uppercase tracking-widest py-3 px-5 text-left";
  const TD = "py-4 px-5 text-sm";

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: BG_DEEP, color: WHITE }}>
      <Sidebar activeItem="/subscription" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeItem="/subscription" />

        <main className="flex-1 overflow-y-auto p-6 md:p-10"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent` }}>
          <div className="max-w-[1300px] mx-auto space-y-8">

            {/* ── Page header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}
                >
                  <CreditCard className="w-3 h-3" /> Faturação
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Gestão de <span style={{ color: BLUE_MID }}>Subscrição</span>
              </h1>
              <p className="text-sm font-medium mt-1" style={{ color: W30 }}>
                Gira o plano, utilizadores e histórico de faturação da sua organização.
              </p>
            </motion.div>

            {/* ── Hero — current plan ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: BG_CARD, border: `1px solid ${currentPlan.accentBdr}` }}
            >
              {/* top section */}
              <div
                className="relative p-6 md:p-8 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${currentPlan.accentDim}, transparent 60%)` }}
              >
                {/* decorative ring */}
                <div
                  className="absolute -top-16 -right-16 w-64 h-64 rounded-full border opacity-5"
                  style={{ borderColor: currentPlan.accent, borderWidth: 32 }}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: currentPlan.accentDim, border: `1px solid ${currentPlan.accentBdr}` }}>
                      <currentPlan.icon className="w-8 h-8" style={{ color: currentPlan.accent }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-black text-white">Plano {currentPlan.name}</h2>
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                          Ativo
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: W30 }}>
                        {fmt(currentPlan.price)}/ano
                        <span className="mx-2" style={{ color: W10 }}>·</span>
                        Renovação em {format(MOCK_SUB.renewalDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border"
                      style={{ background: W10, color: W60, borderColor: BORDER }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = WHITE; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.color = W60; }}
                    >
                      <FileText className="w-4 h-4" /> Ver Contrato
                    </button>
                    <button
                      className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all text-white"
                      style={{ background: BLUE }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#1448D0")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}
                    >
                      <Zap className="w-4 h-4" /> Atualizar Agora
                    </button>
                  </div>
                </div>
              </div>

              {/* usage metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 border-t" style={{ borderColor: BORDER }}>
                <UsageBar label="Utilizadores"   current={MOCK_SUB.currentUsers}     max={currentPlan.maxUsers}     accent={currentPlan.accent} />
                <UsageBar label="Workspaces"     current={MOCK_SUB.currentWorkspaces} max={currentPlan.maxWorkspaces} accent={currentPlan.accent} />
                <UsageBar label="Uso Geral"      current={MOCK_SUB.usagePercent}      max={100} percent={MOCK_SUB.usagePercent} accent={currentPlan.accent} />
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="plans" className="space-y-6">
              <TabsList
                className="flex gap-1 p-1.5 rounded-2xl h-auto w-fit"
                style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}
              >
                {[["plans","Planos"], ["billing","Faturação"], ["payment","Pagamento"]].map(([v, l]) => (
                  <TabsTrigger key={v} value={v}
                    className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/30 transition-all data-[state=active]:text-black data-[state=active]:shadow-md whitespace-nowrap"
                  >
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ══ PLANS ══ */}
              <TabsContent value="plans" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {PLANS.map((plan, i) => (
                    <PlanCard
                      key={plan.id} plan={plan} index={i}
                      isCurrent={plan.id === MOCK_SUB.plan}
                      onAction={handlePlanAction}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* ══ BILLING ══ */}
              <TabsContent value="billing" className="mt-0">
                <div className="rounded-2xl overflow-hidden" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                  <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="font-black text-white">Faturas Recentes</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: W30 }}>Histórico completo de pagamentos</p>
                    </div>
                    <button
                      className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(26,92,255,0.25)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE_DIM)}
                    >
                      <Download className="w-3.5 h-3.5" /> Exportar Todas
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th className={`${TH}`} style={{ color: W30 }}>Data</th>
                          <th className={`${TH}`} style={{ color: W30 }}>Descrição</th>
                          <th className={`${TH}`} style={{ color: W30 }}>Valor</th>
                          <th className={`${TH}`} style={{ color: W30 }}>Estado</th>
                          <th className={`${TH} text-right`} style={{ color: W30 }}>Fatura</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_BILLING.map((item) => (
                          <tr
                            key={item.id}
                            style={{ borderBottom: `1px solid ${BORDER}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td className={TD} style={{ color: W60 }}>
                              {format(item.date, "dd MMM yyyy", { locale: pt })}
                            </td>
                            <td className={`${TD} font-medium text-white`}>{item.description}</td>
                            <td className={`${TD} font-mono font-black text-white`}>{fmt(item.amount)}</td>
                            <td className={TD}>
                              <span
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                                style={{
                                  background: item.status === "paid" ? "rgba(74,222,128,0.10)" : RED_DIM,
                                  color: item.status === "paid" ? "#4ade80" : RED,
                                }}
                              >
                                {item.status === "paid" ? "Pago" : item.status === "pending" ? "Pendente" : "Falhou"}
                              </span>
                            </td>
                            <td className={`${TD} text-right`}>
                              <button
                                className="h-8 w-8 rounded-lg flex items-center justify-center ml-auto transition-all"
                                style={{ color: W30 }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BLUE_DIM; (e.currentTarget as HTMLElement).style.color = BLUE_MID; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = W30; }}
                                title={`Descarregar ${item.invoice}`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ══ PAYMENT ══ */}
              <TabsContent value="payment" className="mt-0">
                <PaymentTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* ── Plan change dialog ── */}
      <Dialog open={!!dialogState.type} onOpenChange={open => !open && closeDialog()}>
        <DialogContent
          className="sm:max-w-[460px]"
          style={{
            background: BG_CARD,
            border: `1px solid ${dialogState.type === "downgrade" ? RED_BDR : BLUE_BDR}`,
            borderRadius: "1.25rem"
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: dialogState.type === "upgrade" ? BLUE_DIM : RED_DIM,
                }}>
                {dialogState.type === "upgrade"
                  ? <ArrowUpRight className="w-5 h-5" style={{ color: BLUE_MID }} />
                  : <ArrowDownRight className="w-5 h-5" style={{ color: RED }} />}
              </div>
              <DialogTitle className="text-white font-black text-lg">
                {dialogState.type === "upgrade" ? "Upgrade de Plano" : "Alteração de Plano"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* downgrade warning */}
            {dialogState.type === "downgrade" && (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: RED_DIM, border: `1px solid ${RED_BDR}` }}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: RED }} />
                <p className="text-xs font-medium" style={{ color: W60 }}>
                  Verifique que o uso atual ({MOCK_SUB.currentUsers} utilizadores) está dentro dos limites
                  do novo plano ({targetPlan?.maxUsers === -1 ? "ilimitado" : targetPlan?.maxUsers}).
                </p>
              </div>
            )}

            {/* summary */}
            <div className="rounded-xl p-5 space-y-3"
              style={{ background: BG_NAVY, border: `1px solid ${BORDER}` }}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: W30 }}>Plano Atual</span>
                <span className="text-sm font-bold text-white">{currentPlan.name}</span>
              </div>
              <div className="h-px" style={{ background: BORDER }} />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: W30 }}>Novo Plano</span>
                <span className="text-sm font-black" style={{ color: targetPlan?.accent }}>{targetPlan?.name}</span>
              </div>
              <div className="h-px" style={{ background: BORDER }} />
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: W30 }}>Novo Valor</span>
                <span className="text-2xl font-black text-white">{targetPlan ? fmt(targetPlan.price) : "—"}/ano</span>
              </div>
            </div>

            <p className="text-[11px] font-medium" style={{ color: W30 }}>
              {dialogState.type === "upgrade"
                ? `Terá acesso imediato a todas as funcionalidades do plano ${targetPlan?.name}.`
                : `Algumas funcionalidades serão desativadas no próximo ciclo de faturação.`}
            </p>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <button
              onClick={closeDialog}
              disabled={isProcessing}
              className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{ background: W10, color: W60, border: `1px solid ${BORDER}` }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmPlanChange}
              disabled={isProcessing}
              className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-70 text-white min-w-[140px] justify-center"
              style={{ background: dialogState.type === "upgrade" ? BLUE : RED }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background =
                  dialogState.type === "upgrade" ? "#1448D0" : "#C4111F";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background =
                  dialogState.type === "upgrade" ? BLUE : RED;
              }}
            >
              {isProcessing
                ? <><Clock className="w-4 h-4 animate-spin" /> Processando…</>
                : <><Check className="w-4 h-4" /> Confirmar Mudança</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* active tab override */}
      <style>{`
        [role="tab"][data-state="active"] { background: ${BLUE_MID} !important; color: #fff !important; }
      `}</style>
    </div>
  );
};

export default Subscription;