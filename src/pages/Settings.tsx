import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
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
  Mail, BarChart3, Lock, Eye, EyeOff, AlertTriangle
} from "lucide-react";

/* ─────────────────────────────────────────────────
   PALETTE  (consistent with Admin + Alerts pages)
───────────────────────────────────────────────── */
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

/* ─── Types ─────────────────────────────────────── */
interface ProfileForm  { contact_name: string; contact_phone: string; contact_role: string; }
interface CompanyForm  { company_name: string; nif: string; country: string; }

/* ─── Nav tabs ───────────────────────────────────── */
const NAV_TABS = [
  { id: "appearance",    label: "Aparência",     icon: Sun    },
  { id: "notifications", label: "Notificações",  icon: Bell   },
  { id: "profile",       label: "Perfil",        icon: User   },
  { id: "company",       label: "Empresa",       icon: Building2 },
  { id: "security",      label: "Segurança",     icon: Shield },
  { id: "data",          label: "Dados",         icon: Download },
];

/* ─── Section wrapper ────────────────────────────── */
const Section = ({
  id, title, desc, icon: Icon, children, delay = 0, accent = BLUE_MID
}: {
  id?: string; title: string; desc: string; icon: any;
  children: React.ReactNode; delay?: number; accent?: string;
}) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="rounded-2xl overflow-hidden"
    style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
  >
    {/* section header */}
    <div className="px-6 py-5 flex items-center gap-4 border-b relative overflow-hidden"
      style={{ borderColor: BORDER }}>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at left, ${accent}, transparent 60%)` }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
        style={{ background: `${accent}18` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="font-black text-white text-sm">{title}</p>
        <p className="text-[11px] font-medium mt-0.5" style={{ color: W30 }}>{desc}</p>
      </div>
    </div>
    <div className="px-6 py-6 space-y-5">{children}</div>
  </motion.div>
);

/* ─── Field wrapper ──────────────────────────────── */
const Field = ({
  label, id, hint, children
}: {
  label: string; id?: string; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[10px] font-black uppercase tracking-widest" style={{ color: W30 }}>
      {label}
    </label>
    {children}
    {hint && <p className="text-[10px] pl-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>{hint}</p>}
  </div>
);

/* ─── Shared input class ─────────────────────────── */
const inputCls = "h-11 rounded-xl text-sm text-white placeholder:text-white/20 focus:ring-0 bg-white/5 border border-white/10 focus:border-blue-500/40";

/* ─── Toggle row ─────────────────────────────────── */
const ToggleRow = ({
  label, desc, checked, onChange, icon: Icon, accent = BLUE_MID
}: {
  label: string; desc: string; checked: boolean;
  onChange: (v: boolean) => void; icon?: any; accent?: string;
}) => (
  <div
    className="flex items-center justify-between gap-4 p-4 rounded-xl transition-colors cursor-pointer group"
    style={{ background: checked ? `${accent}0A` : "transparent", border: `1px solid ${checked ? accent + "20" : BORDER}` }}
    onClick={() => onChange(!checked)}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: checked ? `${accent}18` : W10 }}>
          <Icon className="w-4 h-4" style={{ color: checked ? accent : W30 }} />
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[11px] font-medium mt-0.5" style={{ color: W30 }}>{desc}</p>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      onClick={e => e.stopPropagation()}
    />
  </div>
);

/* ─── Action row ─────────────────────────────────── */
const ActionRow = ({
  label, desc, children, danger = false
}: {
  label: string; desc: string; children: React.ReactNode; danger?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-xl"
    style={{ background: danger ? RED_DIM : W10, border: `1px solid ${danger ? RED_BDR : BORDER}` }}>
    <div>
      <p className="text-sm font-bold" style={{ color: danger ? RED : WHITE }}>{label}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: W30 }}>{desc}</p>
    </div>
    {children}
  </div>
);

/* ─── Save button ────────────────────────────────── */
const SaveBtn = ({
  onClick, pending, label = "Guardar Alterações", icon: Icon = Save
}: {
  onClick: () => void; pending: boolean; label?: string; icon?: any;
}) => (
  <div className="flex justify-end pt-2">
    <button
      onClick={onClick}
      disabled={pending}
      className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-40 text-white"
      style={{ background: BLUE }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#1448D0")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}
    >
      {pending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Icon className="w-4 h-4" />}
      {label}
    </button>
  </div>
);

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { data: notificationSettings } = useUserNotificationSettings();
  const updateProfile      = useUpdateProfile();
  const updateNotifications = useUpdateNotificationSettings();
  const changePassword     = useChangePassword();
  const exportData         = useExportUserData();
  const deleteAccount      = useDeleteAccount();

  const [profileForm, setProfileForm] = useState<ProfileForm>({ contact_name: "", contact_phone: "", contact_role: "" });
  const [companyForm, setCompanyForm] = useState<CompanyForm>({ company_name: "", nif: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPw, setShowNewPw]       = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isPwDialogOpen, setIsPwDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");

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
      return toast.error("As senhas não coincidem");
    if (passwordForm.newPassword.length < 8)
      return toast.error("A senha deve ter pelo menos 8 caracteres");
    changePassword.mutate({ newPassword: passwordForm.newPassword }, {
      onSuccess: () => {
        setIsPwDialogOpen(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    });
  };

  /* scroll to section on tab click */
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loadingProfile) return (
    <div className="flex h-screen items-center justify-center" style={{ background: BG_DEEP }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: BLUE_DIM }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: BLUE_MID }} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: W30 }}>
          A carregar configurações…
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Configurações | AlphaData</title></Helmet>

      <div className="flex h-screen overflow-hidden font-sans" style={{ background: BG_DEEP, color: WHITE }}>
        <Sidebar activeItem="/settings" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/settings" />

          <div className="flex-1 flex overflow-hidden">

            {/* ── Left nav ── */}
            <aside
              className="hidden lg:flex flex-col w-56 shrink-0 border-r p-4 gap-1 overflow-y-auto"
              style={{ background: BG_NAVY, borderColor: BORDER }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest mb-3 px-3" style={{ color: W30 }}>
                Configurações
              </p>
              {NAV_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left"
                    style={{
                      background: isActive ? BLUE_DIM : "transparent",
                      color: isActive ? BLUE_MID : W30,
                      border: `1px solid ${isActive ? BLUE_BDR : "transparent"}`,
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </button>
                );
              })}

              {/* user info at bottom */}
              <div className="mt-auto pt-4 border-t" style={{ borderColor: BORDER }}>
                <div className="px-3 py-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black mb-2"
                    style={{ background: BLUE_DIM, color: BLUE_MID }}>
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <p className="text-[11px] font-bold text-white truncate">{profileForm.contact_name || "Utilizador"}</p>
                  <p className="text-[10px] truncate" style={{ color: W30 }}>{user?.email}</p>
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent` }}>
              <div className="max-w-2xl mx-auto space-y-6">

                {/* Page title */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 mb-8">
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    Configurações
                  </h1>
                  <p className="text-sm font-medium" style={{ color: W30 }}>
                    Gira as preferências da sua conta e organização.
                  </p>
                </motion.div>

                {/* ── APPEARANCE ── */}
                <Section id="appearance" title="Aparência" desc="Tema visual da plataforma AlphaData."
                  icon={theme === "dark" ? Moon : Sun} delay={0.05}>
                  <ToggleRow
                    label="Modo Escuro"
                    desc="Alterna entre tema claro e escuro para maior conforto visual."
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    icon={Moon}
                  />
                </Section>

                {/* ── NOTIFICATIONS ── */}
                <Section id="notifications" title="Notificações" desc="Escolha os alertas e canais de comunicação."
                  icon={Bell} delay={0.1}>
                  <div className="space-y-3">
                    <ToggleRow
                      label="Alertas por Email"
                      desc="Notificações críticas e atualizações importantes no email."
                      checked={getNotif("email_alerts")}
                      onChange={v => handleNotifToggle("email_alerts", v)}
                      icon={Mail}
                    />
                    <ToggleRow
                      label="Alertas de Preço"
                      desc="Seja notificado sobre mudanças significativas no mercado."
                      checked={getNotif("price_alerts")}
                      onChange={v => handleNotifToggle("price_alerts", v)}
                      icon={BarChart3}
                    />
                    <ToggleRow
                      label="Relatórios Semanais"
                      desc="Resumo executivo de toda a atividade semanal."
                      checked={getNotif("weekly_reports")}
                      onChange={v => handleNotifToggle("weekly_reports", v)}
                      icon={Download}
                    />
                    <ToggleRow
                      label="Alertas via WhatsApp"
                      desc="Alertas urgentes diretamente no seu telemóvel."
                      checked={getNotif("whatsapp_alerts")}
                      onChange={v => handleNotifToggle("whatsapp_alerts", v)}
                      icon={Smartphone}
                    />
                  </div>
                </Section>

                {/* ── PROFILE ── */}
                <Section id="profile" title="Perfil Pessoal" desc="Informações de contato e cargo na organização."
                  icon={User} delay={0.15}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nome de Contato" id="contact_name">
                      <Input
                        id="contact_name"
                        value={profileForm.contact_name}
                        onChange={e => setProfileForm(p => ({ ...p, contact_name: e.target.value }))}
                        placeholder="Nome completo"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Telefone" id="contact_phone">
                      <Input
                        id="contact_phone"
                        value={profileForm.contact_phone}
                        onChange={e => setProfileForm(p => ({ ...p, contact_phone: e.target.value }))}
                        placeholder="+244 …"
                        className={inputCls}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Cargo / Função" id="contact_role">
                        <Input
                          id="contact_role"
                          value={profileForm.contact_role}
                          onChange={e => setProfileForm(p => ({ ...p, contact_role: e.target.value }))}
                          placeholder="Ex: Gestor de Operações"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                  <SaveBtn onClick={() => updateProfile.mutate(profileForm)} pending={updateProfile.isPending} />
                </Section>

                {/* ── COMPANY ── */}
                <Section id="company" title="Dados da Empresa" desc="Informações fiscais e de localização da organização."
                  icon={Building2} delay={0.2}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Nome da Empresa" id="company_name">
                        <Input
                          id="company_name"
                          value={companyForm.company_name}
                          onChange={e => setCompanyForm(p => ({ ...p, company_name: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <Field label="NIF" id="nif">
                      <Input
                        id="nif"
                        value={companyForm.nif}
                        onChange={e => setCompanyForm(p => ({ ...p, nif: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="País" id="country">
                      <Input
                        id="country"
                        value={companyForm.country}
                        onChange={e => setCompanyForm(p => ({ ...p, country: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <SaveBtn
                    onClick={() => updateProfile.mutate(companyForm)}
                    pending={updateProfile.isPending}
                    label="Atualizar Empresa"
                    icon={CheckCircle2}
                  />
                </Section>

                {/* ── SECURITY ── */}
                <Section id="security" title="Segurança" desc="Mantenha a sua conta protegida com uma senha forte."
                  icon={Shield} delay={0.25}>
                  <ActionRow
                    label="Senha de Acesso"
                    desc="Recomendamos uma senha forte com pelo menos 8 caracteres."
                  >
                    <button
                      onClick={() => setIsPwDialogOpen(true)}
                      className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shrink-0"
                      style={{ background: W10, color: W60, border: `1px solid ${BORDER}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BLUE_DIM; (e.currentTarget as HTMLElement).style.color = BLUE_MID; (e.currentTarget as HTMLElement).style.borderColor = BLUE_BDR; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = W10; (e.currentTarget as HTMLElement).style.color = W60; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                    >
                      <Key className="w-3.5 h-3.5" /> Alterar Senha
                    </button>
                  </ActionRow>
                </Section>

                {/* ── DATA ── */}
                <Section id="data" title="Gestão de Dados" desc="Controle as suas informações e a sua conta."
                  icon={Download} delay={0.3}>
                  <div className="space-y-3">
                    {/* export */}
                    <ActionRow label="Exportar Meus Dados" desc="Cópia completa dos seus dados em formato JSON.">
                      <button
                        onClick={() => exportData.mutate()}
                        disabled={exportData.isPending}
                        className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-40"
                        style={{ background: BLUE_DIM, color: BLUE_MID, border: `1px solid ${BLUE_BDR}` }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(26,92,255,0.25)")}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE_DIM)}
                      >
                        {exportData.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Download className="w-3.5 h-3.5" />}
                        Exportar
                      </button>
                    </ActionRow>

                    {/* danger zone */}
                    <ActionRow
                      label="Zona de Perigo"
                      desc="Eliminar a sua conta é uma ação permanente e irreversível."
                      danger
                    >
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shrink-0 text-white"
                            style={{ background: RED }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#C4111F")}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = RED)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar Conta
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          style={{ background: BG_CARD, border: `1px solid ${RED_BDR}`, borderRadius: "1.25rem" }}>
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: RED_DIM }}>
                                <AlertTriangle className="w-5 h-5" style={{ color: RED }} />
                              </div>
                              <AlertDialogTitle className="text-white text-lg font-black">
                                Tem certeza absoluta?
                              </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription style={{ color: W30 }}>
                              Esta ação não pode ser desfeita. A sua conta e todos os dados associados serão eliminados permanentemente dos nossos servidores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel
                              className="rounded-xl text-xs font-black uppercase tracking-widest h-10"
                              style={{ background: W10, color: W60, border: `1px solid ${BORDER}` }}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAccount.mutate()}
                              className="rounded-xl text-xs font-black uppercase tracking-widest h-10 text-white"
                              style={{ background: RED }}>
                              Sim, Eliminar Permanentemente
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
          style={{ background: BG_CARD, border: `1px solid ${BLUE_BDR}`, borderRadius: "1.25rem" }}
          className="sm:max-w-[400px]"
        >
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: BLUE_DIM }}>
                  <Lock className="w-5 h-5" style={{ color: BLUE_MID }} />
                </div>
                <div>
                  <DialogTitle className="text-white font-black">Alterar Senha</DialogTitle>
                  <DialogDescription style={{ color: W30 }} className="text-xs mt-0.5">
                    Digite a nova senha abaixo para atualizar o acesso.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-5 space-y-4">
              {/* new password */}
              <Field label="Nova Senha" id="new-password">
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPw ? "text" : "password"}
                    required
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    className={`${inputCls} pr-10`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: W30 }}
                    onClick={() => setShowNewPw(p => !p)}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* strength indicator */}
                {passwordForm.newPassword.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {[...Array(4)].map((_, i) => {
                      const strength = passwordForm.newPassword.length >= 12 ? 4
                        : passwordForm.newPassword.length >= 10 ? 3
                        : passwordForm.newPassword.length >= 8  ? 2 : 1;
                      const filled = i < strength;
                      const col = strength <= 1 ? RED : strength === 2 ? "#FF6B1A" : strength === 3 ? "#fbbf24" : "#4ade80";
                      return (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ background: filled ? col : W10 }} />
                      );
                    })}
                    <span className="text-[9px] font-black ml-1" style={{
                      color: passwordForm.newPassword.length >= 12 ? "#4ade80"
                        : passwordForm.newPassword.length >= 8 ? "#fbbf24" : RED
                    }}>
                      {passwordForm.newPassword.length >= 12 ? "Forte" : passwordForm.newPassword.length >= 8 ? "Médio" : "Fraco"}
                    </span>
                  </div>
                )}
              </Field>

              {/* confirm password */}
              <Field label="Confirmar Nova Senha" id="confirm-password">
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`${inputCls} pr-10`}
                    placeholder="Repita a nova senha"
                    style={{
                      borderColor: passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                        ? RED_BDR : undefined
                    }}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: W30 }} onClick={() => setShowConfirmPw(p => !p)}>
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                  <p className="text-[10px] font-bold mt-1" style={{ color: RED }}>As senhas não coincidem.</p>
                )}
              </Field>
            </div>

            <DialogFooter className="gap-2">
              <button type="button"
                onClick={() => setIsPwDialogOpen(false)}
                className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest"
                style={{ background: W10, color: W60, border: `1px solid ${BORDER}` }}>
                Cancelar
              </button>
              <button type="submit"
                disabled={changePassword.isPending || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-40 text-white"
                style={{ background: BLUE }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#1448D0")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BLUE)}
              >
                {changePassword.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Lock className="w-4 h-4" />}
                Atualizar Senha
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        [data-state="checked"] { background: ${BLUE} !important; }
      `}</style>
    </>
  );
};

export default Settings;