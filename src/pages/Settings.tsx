import React, { useState, useEffect, useCallback } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import {
  useUserProfile, useUpdateProfile, useUpdateNotificationSettings,
  useUserNotificationSettings, useChangePassword, useExportUserData, useDeleteAccount
} from "@/hooks/useSettings";
import { toast } from "sonner";
import {
  Loader2, Sun, Moon, Bell, Shield, User,
  Building2, Key, Smartphone, Download,
  Trash2, Save, CheckCircle2, ChevronRight,
  Mail, BarChart3, Lock, Eye, EyeOff, AlertTriangle,
  Terminal, Activity, Radio, Settings as SettingsIcon,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ProfileForm { contact_name: string; contact_phone: string; contact_role: string; }
interface CompanyForm { company_name: string; nif: string; country: string; }

/* ─── Nav Tabs ───────────────────────────────────────────────────────────── */
const NAV_TABS = [
  { id: "appearance",    label: "APARÊNCIA",    sig: "APR", icon: Sun      },
  { id: "notifications", label: "NOTIFICAÇÕES", sig: "NTF", icon: Bell     },
  { id: "profile",       label: "PERFIL",       sig: "PRF", icon: User     },
  { id: "company",       label: "EMPRESA",      sig: "EMP", icon: Building2 },
  { id: "security",      label: "SEGURANÇA",    sig: "SEC", icon: Shield   },
  { id: "data",          label: "DADOS",        sig: "DAT", icon: Download },
];

/* ─── Scanline Overlay ───────────────────────────────────────────────────── */
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]"
    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }}
  />
);

/* ─── Radar Pulse ────────────────────────────────────────────────────────── */
const RadarPulse = ({ active }: { active: boolean }) => (
  <span className="relative inline-flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full rounded-full ${active ? "bg-red-500 animate-ping opacity-75" : "bg-slate-600"}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-red-500" : "bg-slate-600"}`} />
  </span>
);

/* ─── Section ────────────────────────────────────────────────────────────── */
const Section = ({
  id, title, sig, desc, icon: Icon, children, accentColor = "rgba(220,38,38,0.8)", delay = 0
}: {
  id?: string; title: string; sig: string; desc: string; icon: any;
  children: React.ReactNode; accentColor?: string; delay?: number;
}) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="relative rounded overflow-hidden group"
    style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)" }}
  >
    {/* Corner sig tag */}
    <div
      className="absolute top-0 right-0 text-[8px] font-bold px-2.5 py-1 tracking-widest"
      style={{ background: `${accentColor}18`, color: accentColor, borderBottomLeftRadius: "4px" }}
    >
      {sig}
    </div>

    {/* Bottom accent on hover */}
    <div
      className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
      style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
    />

    {/* Header */}
    <div
      className="px-6 py-4 flex items-center gap-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
    >
      <div
        className="w-8 h-8 flex items-center justify-center rounded shrink-0"
        style={{ background: `${accentColor}15` }}
      >
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[11px] font-bold tracking-[0.15em]" style={{ color: "hsl(var(--foreground))" }}>{title}</p>
        </div>
        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
      </div>
    </div>

    <div className="px-6 py-5 space-y-4">{children}</div>
  </motion.div>
);

/* ─── Field ──────────────────────────────────────────────────────────────── */
const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
      {label}
    </label>
    {children}
    {hint && <p className="text-[9px] pl-0.5" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>{hint}</p>}
  </div>
);

/* ─── Input style ────────────────────────────────────────────────────────── */
const inpStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "hsl(var(--foreground))",
  fontFamily: "'IBM Plex Mono', monospace",
  height: "44px",
  borderRadius: "4px",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "0.05em",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

const TermInput = ({
  value, onChange, placeholder, type = "text", rightSlot
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; rightSlot?: React.ReactNode;
}) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inpStyle, paddingRight: rightSlot ? "40px" : "12px" }}
      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(220,38,38,0.4)"}
      onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
    />
    {rightSlot && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
    )}
  </div>
);

/* ─── Toggle Row ─────────────────────────────────────────────────────────── */
const ToggleRow = ({
  label, desc, checked, onChange, icon: Icon, accentColor = "rgba(220,38,38,0.8)", accentHex = "#dc2626"
}: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
  icon?: any; accentColor?: string; accentHex?: string;
}) => (
  <div
    className="flex items-center justify-between gap-4 p-4 rounded cursor-pointer group transition-all"
    style={{
      background: checked ? `${accentHex}08` : "rgba(255,255,255,0.02)",
      border: `1px solid ${checked ? `${accentHex}22` : "rgba(255,255,255,0.06)"}`,
    }}
    onClick={() => onChange(!checked)}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <div
          className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: checked ? `${accentHex}18` : "rgba(255,255,255,0.04)" }}
        >
          <Icon className="w-4 h-4" style={{ color: checked ? accentHex : "hsl(var(--muted-foreground))" }} />
        </div>
      )}
      <div>
        <p className="text-[11px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>{label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
      </div>
    </div>

    {/* Custom toggle */}
    <div
      className="w-10 h-5 rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? accentHex : "rgba(255,255,255,0.1)" }}
      onClick={e => { e.stopPropagation(); onChange(!checked); }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </div>
  </div>
);

/* ─── Action Row ─────────────────────────────────────────────────────────── */
const ActionRow = ({
  label, desc, children, danger = false
}: {
  label: string; desc: string; children: React.ReactNode; danger?: boolean;
}) => (
  <div
    className="flex items-center justify-between gap-4 p-4 rounded"
    style={{
      background: danger ? "rgba(220,38,38,0.05)" : "rgba(255,255,255,0.02)",
      border: danger ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <div>
      <p
        className="text-[11px] font-bold tracking-wider"
        style={{ color: danger ? "#f87171" : "hsl(var(--foreground))" }}
      >{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
    </div>
    {children}
  </div>
);

/* ─── Save Button ────────────────────────────────────────────────────────── */
const SaveBtn = ({
  onClick, pending, label = "GUARDAR ALTERAÇÕES", icon: Icon = Save
}: {
  onClick: () => void; pending: boolean; label?: string; icon?: any;
}) => (
  <div className="flex justify-end pt-2">
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
      style={{
        background: "linear-gradient(135deg, #dc2626, #991b1b)",
        color: "white",
        boxShadow: "0 0 16px rgba(220,38,38,0.25)",
        border: "1px solid rgba(220,38,38,0.4)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {pending ? "GUARDANDO…" : label}
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { data: notificationSettings } = useUserNotificationSettings();
  const updateProfile       = useUpdateProfile();
  const updateNotifications = useUpdateNotificationSettings();
  const changePassword      = useChangePassword();
  const exportData          = useExportUserData();
  const deleteAccount       = useDeleteAccount();

  const [profileForm, setProfileForm] = useState<ProfileForm>({ contact_name: "", contact_phone: "", contact_role: "" });
  const [companyForm, setCompanyForm] = useState<CompanyForm>({ company_name: "", nif: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isPwDialogOpen, setIsPwDialogOpen] = useState(false);
  const [activeTab, setActiveTab]         = useState("appearance");
  const [bootDone, setBootDone]           = useState(false);
  const [now, setNow]                     = useState(new Date());

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { setTimeout(() => setBootDone(true), 1200); }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        contact_name:  profile.contact_name  || "",
        contact_phone: profile.contact_phone || "",
        contact_role:  profile.contact_role  || "",
      });
      setCompanyForm({
        company_name: profile.company_name || "",
        nif:          profile.nif          || "",
        country:      profile.country      || "",
      });
    }
  }, [profile]);

  const getNotif = (type: string) =>
    notificationSettings?.find(s => s.alert_type === type)?.is_enabled ?? false;

  const handleNotifToggle = useCallback((alertType: string, isEnabled: boolean) => {
    updateNotifications.mutate({ alertType, settings: { is_enabled: isEnabled } });
  }, [updateNotifications]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return toast.error("ERRO // SENHAS NÃO COINCIDEM");
    if (passwordForm.newPassword.length < 8)
      return toast.error("ERRO // MÍNIMO 8 CARACTERES");
    changePassword.mutate({ newPassword: passwordForm.newPassword }, {
      onSuccess: () => {
        setIsPwDialogOpen(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    });
  };

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pwStrength = passwordForm.newPassword.length >= 12 ? 4
    : passwordForm.newPassword.length >= 10 ? 3
    : passwordForm.newPassword.length >= 8  ? 2
    : passwordForm.newPassword.length > 0   ? 1 : 0;

  const pwColor   = pwStrength <= 1 ? "#f87171" : pwStrength === 2 ? "#fb923c" : pwStrength === 3 ? "#fbbf24" : "#4ade80";
  const pwLabel   = pwStrength <= 1 ? "FRACO" : pwStrength === 2 ? "MÉDIO" : pwStrength === 3 ? "FORTE" : "MÁXIMO";

  // Loading
  if (loadingProfile) return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 flex items-center justify-center rounded"
          style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#dc2626" }} />
        </div>
        <p className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          CARREGANDO CONFIGURAÇÕES…
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ background: "hsl(var(--background))", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <Helmet>
        <title>ALPHADAT-OS // CONFIGURAÇÕES</title>
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
              <p className="opacity-70">LOADING CONFIG MODULE.................... OK</p>
              <p className="opacity-70">MOUNTING USER PREFERENCES................ OK</p>
              <p className="opacity-70">VALIDATING SESSION PERMISSIONS........... OK</p>
              <p className="text-red-500 animate-pulse">INITIALIZING SETTINGS PANEL.............. ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="/settings" />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-[50%] h-[35%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.04) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[40%] h-[30%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.03) 0%, transparent 70%)" }} />

          <Header activeItem="/settings" />

          {/* System Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -8 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-6 py-2 border-b"
            style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.04)" }}
          >
            <div className="flex items-center gap-4 text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="flex items-center gap-1.5 text-red-500">
                <RadarPulse active={true} />
                SISTEMA ONLINE
              </span>
              <span className="opacity-40">|</span>
              <span>OPERATOR: {user?.email?.split("@")[0].toUpperCase() ?? "ANON"}</span>
              <span className="opacity-40">|</span>
              <span>SESSÃO: ACTIVA</span>
              <span className="opacity-40">|</span>
              <span>CLASSIFICAÇÃO: RESTRITO</span>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span style={{ color: "hsl(var(--foreground))" }}>{now.toLocaleTimeString("pt-BR", { hour12: false })}</span>
              <span className="ml-3 opacity-50">{now.toLocaleDateString("pt-BR")}</span>
            </div>
          </motion.div>

          <div className="flex-1 flex overflow-hidden">

            {/* ── Left Nav (Terminal sidebar) ── */}
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: bootDone ? 1 : 0, x: bootDone ? 0 : -16 }}
              transition={{ delay: 0.25 }}
              className="hidden lg:flex flex-col w-56 shrink-0 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "hsl(var(--card))" }}
            >
              {/* Sidebar header */}
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  CONFIG // MÓDULOS
                </span>
              </div>

              <div className="p-3 space-y-1 flex-1">
                {NAV_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded text-[11px] font-bold tracking-wider transition-all duration-150"
                      style={isActive ? {
                        background: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.05))",
                        color: "#f87171",
                        border: "1px solid rgba(220,38,38,0.2)",
                      } : {
                        background: "transparent",
                        color: "hsl(var(--muted-foreground))",
                        border: "1px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </div>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded tabular-nums"
                        style={{
                          background: isActive ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.05)",
                          color: isActive ? "#f87171" : "hsl(var(--muted-foreground))",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {tab.sig}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* User info */}
              <div
                className="p-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="rounded p-3 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}
                  >
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-wider truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {profileForm.contact_name.toUpperCase() || "UTILIZADOR"}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{user?.email}</p>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-2xl mx-auto space-y-6">

                {/* Page header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: bootDone ? 1 : 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-2 mb-8"
                >
                  <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Terminal className="w-3 h-3 text-red-500" />
                    <span>ALPHADAT-OS</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span>SISTEMA</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    <span style={{ color: "hsl(var(--foreground))" }}>CONFIGURAÇÕES</span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: "rgba(220,38,38,0.8)" }}>
                    MÓDULO-08 // PREFERÊNCIAS & SISTEMA
                  </div>
                  <h1
                    className="font-bold leading-none"
                    style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}
                  >
                    CONFIGURAÇÕES
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-[1px] w-12 bg-red-600" />
                    <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                      GERIR PREFERÊNCIAS, PERFIL E SEGURANÇA DA CONTA
                    </p>
                  </div>
                </motion.div>

                {/* ── APPEARANCE ── */}
                <Section
                  id="appearance" sig="APR"
                  title="APARÊNCIA" desc="TEMA VISUAL DA PLATAFORMA ALPHADAT"
                  icon={theme === "dark" ? Moon : Sun}
                  accentColor="rgba(56,189,248,0.9)"
                  delay={0.05}
                >
                  <ToggleRow
                    label="MODO ESCURO"
                    desc="Alterna entre tema claro e escuro para maior conforto visual."
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    icon={Moon}
                    accentHex="#38bdf8"
                    accentColor="rgba(56,189,248,0.9)"
                  />
                </Section>

                {/* ── NOTIFICATIONS ── */}
                <Section
                  id="notifications" sig="NTF"
                  title="NOTIFICAÇÕES" desc="CONFIGURAR ALERTAS E CANAIS DE COMUNICAÇÃO"
                  icon={Bell}
                  accentColor="rgba(167,139,250,0.9)"
                  delay={0.1}
                >
                  <div className="space-y-2">
                    <ToggleRow label="ALERTAS POR EMAIL"     desc="Notificações críticas e atualizações no email."         checked={getNotif("email_alerts")}   onChange={v => handleNotifToggle("email_alerts", v)}   icon={Mail}       accentHex="#a78bfa" accentColor="rgba(167,139,250,0.9)" />
                    <ToggleRow label="ALERTAS DE PREÇO"      desc="Notificado sobre mudanças significativas no mercado."   checked={getNotif("price_alerts")}   onChange={v => handleNotifToggle("price_alerts", v)}   icon={BarChart3}  accentHex="#a78bfa" accentColor="rgba(167,139,250,0.9)" />
                    <ToggleRow label="RELATÓRIOS SEMANAIS"   desc="Resumo executivo da atividade semanal."                 checked={getNotif("weekly_reports")} onChange={v => handleNotifToggle("weekly_reports", v)} icon={Download}   accentHex="#a78bfa" accentColor="rgba(167,139,250,0.9)" />
                    <ToggleRow label="ALERTAS VIA WHATSAPP"  desc="Alertas urgentes diretamente no seu telemóvel."         checked={getNotif("whatsapp_alerts")}onChange={v => handleNotifToggle("whatsapp_alerts", v)} icon={Smartphone} accentHex="#a78bfa" accentColor="rgba(167,139,250,0.9)" />
                  </div>
                </Section>

                {/* ── PROFILE ── */}
                <Section
                  id="profile" sig="PRF"
                  title="PERFIL PESSOAL" desc="INFORMAÇÕES DE CONTACTO E CARGO"
                  icon={User}
                  accentColor="rgba(74,222,128,0.9)"
                  delay={0.15}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="NOME DE CONTACTO">
                      <TermInput
                        value={profileForm.contact_name}
                        onChange={v => setProfileForm(p => ({ ...p, contact_name: v }))}
                        placeholder="NOME COMPLETO"
                      />
                    </Field>
                    <Field label="TELEFONE">
                      <TermInput
                        value={profileForm.contact_phone}
                        onChange={v => setProfileForm(p => ({ ...p, contact_phone: v }))}
                        placeholder="+244 …"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="CARGO / FUNÇÃO">
                        <TermInput
                          value={profileForm.contact_role}
                          onChange={v => setProfileForm(p => ({ ...p, contact_role: v }))}
                          placeholder="EX: GESTOR DE OPERAÇÕES"
                        />
                      </Field>
                    </div>
                  </div>
                  <SaveBtn onClick={() => updateProfile.mutate(profileForm)} pending={updateProfile.isPending} />
                </Section>

                {/* ── COMPANY ── */}
                <Section
                  id="company" sig="EMP"
                  title="DADOS DA EMPRESA" desc="INFORMAÇÕES FISCAIS E DE LOCALIZAÇÃO"
                  icon={Building2}
                  accentColor="rgba(251,191,36,0.9)"
                  delay={0.2}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="NOME DA EMPRESA">
                        <TermInput
                          value={companyForm.company_name}
                          onChange={v => setCompanyForm(p => ({ ...p, company_name: v }))}
                          placeholder="NOME DA ORGANIZAÇÃO"
                        />
                      </Field>
                    </div>
                    <Field label="NIF">
                      <TermInput
                        value={companyForm.nif}
                        onChange={v => setCompanyForm(p => ({ ...p, nif: v }))}
                        placeholder="000000000"
                      />
                    </Field>
                    <Field label="PAÍS">
                      <TermInput
                        value={companyForm.country}
                        onChange={v => setCompanyForm(p => ({ ...p, country: v }))}
                        placeholder="EX: ANGOLA"
                      />
                    </Field>
                  </div>
                  <SaveBtn
                    onClick={() => updateProfile.mutate(companyForm)}
                    pending={updateProfile.isPending}
                    label="ACTUALIZAR EMPRESA"
                    icon={CheckCircle2}
                  />
                </Section>

                {/* ── SECURITY ── */}
                <Section
                  id="security" sig="SEC"
                  title="SEGURANÇA" desc="PROTEGER A CONTA COM CREDENCIAIS FORTES"
                  icon={Shield}
                  accentColor="rgba(220,38,38,0.9)"
                  delay={0.25}
                >
                  <ActionRow label="SENHA DE ACESSO" desc="Recomendamos senha forte com mínimo 8 caracteres.">
                    <button
                      onClick={() => setIsPwDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", background: "transparent" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(220,38,38,0.3)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--foreground))"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color="hsl(var(--muted-foreground))"; }}
                    >
                      <Key className="w-3 h-3" /> ALTERAR SENHA
                    </button>
                  </ActionRow>

                  <ActionRow label="AUTENTICAÇÃO DE 2 FACTORES (TOTP)" desc="Adicione uma camada extra com Google Authenticator, Authy ou 1Password.">
                    <div className="w-full sm:w-auto sm:min-w-[280px]">
                      <TwoFactorSetup />
                    </div>
                  </ActionRow>
                </Section>

                {/* ── DATA ── */}
                <Section
                  id="data" sig="DAT"
                  title="GESTÃO DE DADOS" desc="CONTROLAR INFORMAÇÕES E INTEGRIDADE DA CONTA"
                  icon={Download}
                  accentColor="rgba(251,146,60,0.9)"
                  delay={0.3}
                >
                  <div className="space-y-2">
                    <ActionRow label="EXPORTAR DADOS" desc="Cópia completa dos seus dados em formato JSON.">
                      <button
                        onClick={() => exportData.mutate()}
                        disabled={exportData.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all shrink-0"
                        style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#fb923c", opacity: exportData.isPending ? 0.5 : 1 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(251,146,60,0.18)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(251,146,60,0.1)"; }}
                      >
                        {exportData.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3" />}
                        EXPORTAR
                      </button>
                    </ActionRow>

                    <ActionRow label="ZONA DE PERIGO // ELIMINAR CONTA" desc="Acção permanente e irreversível. Todos os dados serão apagados." danger>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-all shrink-0"
                            style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.25)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(220,38,38,0.15)"; }}
                          >
                            <Trash2 className="w-3 h-3" /> ELIMINAR CONTA
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          <AlertDialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                              <Terminal className="w-4 h-4 text-red-500" />
                              <span className="text-[9px] font-bold tracking-[0.3em] text-red-500">ALERTA CRÍTICO // CONFIRMAÇÃO</span>
                            </div>
                            <AlertDialogTitle
                              className="text-[14px] font-bold tracking-wider"
                              style={{ color: "hsl(var(--foreground))" }}
                            >
                              CONFIRMAR ELIMINAÇÃO DE CONTA
                            </AlertDialogTitle>
                            <AlertDialogDescription
                              className="text-[11px] leading-relaxed mt-2"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              ESTA ACÇÃO NÃO PODE SER DESFEITA. A SUA CONTA E TODOS OS DADOS ASSOCIADOS SERÃO ELIMINADOS PERMANENTEMENTE DOS SERVIDORES ALPHADAT.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel
                              className="px-4 py-2 rounded text-[10px] font-bold tracking-widest"
                              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              CANCELAR
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAccount.mutate()}
                              className="flex items-center gap-2 px-5 py-2 rounded text-[10px] font-bold tracking-widest"
                              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", border: "1px solid rgba(220,38,38,0.4)", fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              <Trash2 className="w-3 h-3" /> SIM, ELIMINAR PERMANENTEMENTE
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </ActionRow>
                  </div>
                </Section>

              </div>
            </main>
          </div>
        </div>
      </div>

      {/* ── Password Dialog ── */}
      <Dialog open={isPwDialogOpen} onOpenChange={setIsPwDialogOpen}>
        <DialogContent
          className="sm:max-w-[400px]"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-4 h-4 text-red-500" />
                <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: "rgba(220,38,38,0.8)" }}>
                  SEGURANÇA // ACTUALIZAR CREDENCIAIS
                </span>
              </div>
              <DialogTitle className="text-[14px] font-bold tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                ALTERAR SENHA
              </DialogTitle>
              <DialogDescription className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                INTRODUZA A NOVA SENHA DE ACESSO AO SISTEMA.
              </DialogDescription>
            </DialogHeader>

            <div className="py-5 space-y-4">
              <Field label="NOVA SENHA">
                <TermInput
                  type={showNewPw ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={v => setPasswordForm(p => ({ ...p, newPassword: v }))}
                  placeholder="MÍNIMO 8 CARACTERES"
                  rightSlot={
                    <button type="button" onClick={() => setShowNewPw(p => !p)} style={{ color: "hsl(var(--muted-foreground))" }}>
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                />
                {pwStrength > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-[3px] flex-1 rounded-full transition-all"
                          style={{ background: i < pwStrength ? pwColor : "rgba(255,255,255,0.08)" }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold tracking-widest" style={{ color: pwColor }}>{pwLabel}</span>
                  </div>
                )}
              </Field>

              <Field label="CONFIRMAR NOVA SENHA">
                <TermInput
                  type={showConfirmPw ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={v => setPasswordForm(p => ({ ...p, confirmPassword: v }))}
                  placeholder="REPETIR NOVA SENHA"
                  rightSlot={
                    <button type="button" onClick={() => setShowConfirmPw(p => !p)} style={{ color: "hsl(var(--muted-foreground))" }}>
                      {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                />
                {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                  <p className="text-[9px] font-bold mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                    <AlertTriangle className="w-3 h-3" /> SENHAS NÃO COINCIDEM
                  </p>
                )}
                {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && passwordForm.newPassword.length >= 8 && (
                  <p className="text-[9px] font-bold mt-1.5 flex items-center gap-1.5" style={{ color: "#4ade80" }}>
                    <CheckCircle2 className="w-3 h-3" /> SENHAS COINCIDEM
                  </p>
                )}
              </Field>
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setIsPwDialogOpen(false)}
                className="px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={changePassword.isPending || passwordForm.newPassword !== passwordForm.confirmPassword || passwordForm.newPassword.length < 8}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-[10px] font-bold tracking-widest transition-all"
                style={{
                  background: "linear-gradient(135deg, #dc2626, #991b1b)",
                  color: "white",
                  boxShadow: "0 0 16px rgba(220,38,38,0.25)",
                  opacity: (changePassword.isPending || passwordForm.newPassword !== passwordForm.confirmPassword || passwordForm.newPassword.length < 8) ? 0.5 : 1,
                }}
              >
                {changePassword.isPending
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> ACTUALIZANDO…</>
                  : <><Lock className="w-3 h-3" /> ACTUALIZAR SENHA</>}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default Settings;