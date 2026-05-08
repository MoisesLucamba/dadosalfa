import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, ArrowLeft,
  Globe, ShieldCheck, User, ExternalLink,
  Building2, Activity, ChevronRight,
  Terminal, Fingerprint, AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { PersonalSignupForm } from "@/components/auth/PersonalSignupForm";
import { OrganizationSignupForm } from "@/components/auth/OrganizationSignupForm";

/* ─── Design tokens ─────────────────────────────────── */
const T = {
  bg:       "#04080f",
  bg2:      "#070d1a",
  panel:    "#060c18",
  border:   "rgba(20,45,80,0.7)",
  borderR:  "rgba(200,16,46,0.4)",
  red:      "#C8102E",
  redGlow:  "rgba(200,16,46,0.25)",
  blue:     "#002855",
  blueMid:  "#1e3a5f",
  textDim:  "#2d4d6e",
  textMid:  "#4d7aa0",
  textBrt:  "#c8dff0",
  white:    "#e8f0f8",
  mono:     "'IBM Plex Mono', monospace",
  sans:     "'Outfit', sans-serif",
};

/* ─── Validation ─────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email institucional inválido" }),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
});

/* ─── Reusable primitives ────────────────────────────── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    fontFamily: T.mono, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.2em", textTransform: "uppercase",
    color: T.textDim, marginBottom: 8, display: "block",
  }}>
    {children}
  </label>
);

const TextInput = ({ icon: Icon, rightSlot, ...props }: any) => (
  <div className="relative group">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
        style={{ width: 14, height: 14, color: T.textDim }} />
    )}
    <input
      {...props}
      className="w-full outline-none transition-all duration-200"
      style={{
        fontFamily: T.sans, fontSize: 13, fontWeight: 500,
        background: "rgba(8,14,26,0.8)",
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        padding: `11px ${rightSlot ? 44 : 14}px 11px ${Icon ? 40 : 14}px`,
        color: T.white,
        caretColor: T.red,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "rgba(200,16,46,0.5)";
        e.currentTarget.style.boxShadow = `0 0 0 3px rgba(200,16,46,0.08)`;
        e.currentTarget.style.background = "rgba(10,18,32,0.9)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "rgba(8,14,26,0.8)";
      }}
    />
    {rightSlot && (
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
    )}
  </div>
);

const PrimaryBtn = ({ children, loading, ...props }: any) => (
  <button
    {...props}
    className="w-full relative overflow-hidden group transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
    style={{
      fontFamily: T.mono, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.2em", textTransform: "uppercase",
      padding: "14px 24px",
      background: `linear-gradient(135deg, ${T.red} 0%, #a00d24 100%)`,
      border: `1px solid rgba(200,16,46,0.6)`,
      borderRadius: 6,
      color: "white",
      boxShadow: `0 4px 24px rgba(200,16,46,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
      cursor: props.disabled ? "not-allowed" : "pointer",
    }}
  >
    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 100%)" }} />
    <span className="relative flex items-center justify-center gap-2">
      {loading
        ? <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>PROCESSANDO...</span></>
        : children
      }
    </span>
  </button>
);

const GhostBtn = ({ children, ...props }: any) => (
  <button
    {...props}
    className="w-full transition-all duration-200 group"
    style={{
      fontFamily: T.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.2em", textTransform: "uppercase",
      padding: "12px 24px", borderRadius: 6,
      background: "rgba(8,14,26,0.5)",
      border: `1px solid ${T.border}`,
      color: T.textMid,
      cursor: "pointer",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,95,0.9)";
      (e.currentTarget as HTMLElement).style.color = T.textBrt;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.borderColor = T.border;
      (e.currentTarget as HTMLElement).style.color = T.textMid;
    }}
  >
    {children}
  </button>
);

/* ─── Animated counter ───────────────────────────────── */
const LiveStat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col gap-1">
    <span style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: T.white, letterSpacing: "-0.02em" }}>
      {value}
    </span>
    <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 500, color: T.textDim, letterSpacing: "0.16em", textTransform: "uppercase" }}>
      {label}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
export default function Auth() {
  const navigate = useNavigate();
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot-password">("login");
  const [accountType, setAccountType] = useState<"personal" | "organization">("personal");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tick, setTick] = useState(0);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = loginSchema.safeParse({ email, password });
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (authData.user) {
        const { data: profile } = await supabase.from("profiles").select("is_approved").eq("id", authData.user.id).maybeSingle();
        if (profile && !profile.is_approved) {
          await supabase.auth.signOut();
          toast.error("Acesso Pendente", { description: "Conta em processo de revisão." });
          setLoading(false);
          return;
        }
        toast.success("Acesso autorizado", { description: "Bem-vindo ao AlphaData Intelligence." });
      }
    } catch (err: any) {
      toast.error("Falha na autenticação", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSignup = async (data: any) => {
    setSignupLoading(true); setSignupError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (authError) throw authError;
      if (authData.user) {
        const sectorMap: Record<string, string> = { oil_gas:"operadora", bank:"banco", trader:"trader", consultant:"consultora", regulator:"governo", other:"prestadora_servicos" };
        const { data: co } = await supabase.from("predefined_companies").select("sector").eq("id", data.companyId).maybeSingle();
        const type = co?.sector ? (sectorMap[co.sector] || "consultora") : "consultora";
        const { error: pErr } = await supabase.from("profiles").insert({ id: authData.user.id, company_name: data.companyName, company_type: type as any, contact_name: data.contactName, contact_role: data.jobTitle, contact_phone: data.phone, job_title: data.jobTitle, nif: "N/A", account_type: "personal", accepted_terms: data.acceptTerms, accepted_nda: data.acceptNda });
        if (pErr) throw pErr;
        toast.success("Conta criada!", { description: "Verifique o seu email para confirmar." });
        setAuthView("login");
      }
    } catch (err: any) { setSignupError(err.message); toast.error("Erro no registo", { description: err.message }); }
    finally { setSignupLoading(false); }
  };

  const handleOrganizationSignup = async (data: any) => {
    setSignupLoading(true); setSignupError(null);
    try {
      const sectorMap: Record<string, string> = { oil_gas:"operadora", bank:"banco", trader:"trader", consultant:"consultora", regulator:"governo", other:"prestadora_servicos" };
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: data.contactEmail, password: data.password });
      if (authError) throw authError;
      if (authData.user) {
        const { data: orgData, error: orgErr } = await supabase.from("organizations").insert({ name: data.companyName, nif: data.nif, sector: data.sector, email_domain: data.emailDomain, country: data.country, contact_email: data.contactEmail, contact_phone: data.contactPhone }).select().single();
        if (orgErr) throw orgErr;
        const { error: pErr } = await supabase.from("profiles").insert({ id: authData.user.id, company_name: data.companyName, company_type: (sectorMap[data.sector] || "operadora") as any, contact_name: data.contactName, contact_role: data.contactRole, contact_phone: data.contactPhone, nif: data.nif, organization_id: orgData.id, account_type: "organization", accepted_terms: data.acceptTerms, accepted_nda: data.acceptNda });
        if (pErr) throw pErr;
        toast.success("Organização registada!", { description: "O registo será analisado pela nossa equipa." });
        setAuthView("login");
      }
    } catch (err: any) { setSignupError(err.message); toast.error("Erro no registo", { description: err.message }); }
    finally { setSignupLoading(false); }
  };

  const switchView = (v: typeof authView) => { setEmail(""); setPassword(""); setAuthView(v); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

        .auth-root { font-family: '${T.sans}'; }

        .auth-root input::placeholder { color: ${T.textDim}; opacity: 1; }
        .auth-root input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #070d1a inset !important;
          -webkit-text-fill-color: ${T.white} !important;
        }

        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scanline {
          position: absolute; left: 0; right: 0; height: 120px; pointer-events: none;
          background: linear-gradient(transparent 0%, rgba(200,16,46,0.015) 50%, transparent 100%);
          animation: scanline 8s linear infinite;
          z-index: 1;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        .blink { animation: cursor-blink 1s step-start infinite; }

        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(200,16,46,0.5); }
          50%       { box-shadow: 0 0 12px 4px rgba(200,16,46,0.25); }
        }
        .pulse-r { animation: pulse-red 2.5s ease-in-out infinite; }

        .grid-bg {
          background-image:
            repeating-linear-gradient(0deg, rgba(20,45,80,0.18) 0px, transparent 1px, transparent 40px, rgba(20,45,80,0.18) 41px),
            repeating-linear-gradient(90deg, rgba(20,45,80,0.18) 0px, transparent 1px, transparent 40px, rgba(20,45,80,0.18) 41px);
          background-size: 41px 41px;
        }

        .form-scroll::-webkit-scrollbar { width: 3px; }
        .form-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
      `}</style>

      <div className="auth-root min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: T.bg }}>

        {/* ══════════════════════════════════════════════════
            LEFT — Intelligence Panel
            ══════════════════════════════════════════════════ */}
        <aside className="lg:w-[42%] relative flex flex-col overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(160deg, #050d1e 0%, #04080f 60%, #08040a 100%)`, borderRight: `1px solid ${T.border}` }}>

          {/* Grid texture */}
          <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />

          {/* Scanline */}
          <div className="scanline" />

          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{
            background: "radial-gradient(circle at top right, rgba(0,40,85,0.35) 0%, transparent 70%)"
          }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none" style={{
            background: "radial-gradient(circle at bottom left, rgba(200,16,46,0.08) 0%, transparent 70%)"
          }} />

          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{
            background: `linear-gradient(90deg, transparent 0%, ${T.red} 40%, ${T.blueMid} 70%, transparent 100%)`
          }} />

          <div className="relative z-10 flex flex-col h-full p-10 lg:p-14">

            {/* Header */}
            <div className="flex items-center justify-between mb-14">
              <Link to="/" className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-lg flex items-center justify-center pulse-r"
                  style={{ background: "linear-gradient(135deg, #0d1b30 0%, #1a0508 100%)", border: `1px solid ${T.borderR}` }}>
                  <Activity style={{ width: 15, height: 15, color: T.red }} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-r" style={{ background: T.red }} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: T.white }}>ALPHA</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: T.red }}>DATA</span>
                    <span className="blink" style={{ fontFamily: T.mono, fontSize: 12, color: T.red }}>_</span>
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 7, letterSpacing: "0.25em", color: T.textDim, textTransform: "uppercase" }}>
                    intelligence platform
                  </div>
                </div>
              </Link>

              <Link to="/landing" className="flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 600, letterSpacing: "0.16em", color: T.textDim, textTransform: "uppercase" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textMid}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
              >
                Página Inicial <ExternalLink style={{ width: 10, height: 10 }} />
              </Link>
            </div>

            {/* Hero text */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} className="space-y-6 mb-14">
              {/* Red rule */}
              <div className="flex items-center gap-3">
                <div className="h-px w-8" style={{ background: T.red }} />
                <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.red, letterSpacing: "0.25em", textTransform: "uppercase" }}>
                  Terminal de Acesso Seguro
                </span>
              </div>

              <h1 style={{ fontFamily: T.sans, fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 1.05, color: T.white, letterSpacing: "-0.02em" }}>
                Inteligência<br />
                <span style={{ color: T.red }}>Auditável</span>{" "}
                <span style={{ color: T.textDim }}>para o</span><br />
                Setor Energético
              </h1>

              <p style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 400, color: T.textMid, lineHeight: 1.7, maxWidth: 340 }}>
                Plataforma institucional de monitorização regulatória para operadores, traders e governos do sector energético africano.
              </p>
            </motion.div>

            {/* Feature pills */}
            <div className="space-y-3 mb-14">
              {[
                { icon: Globe, label: "Cobertura Continental", desc: "25+ jurisdições africanas em tempo real" },
                { icon: ShieldCheck, label: "Conformidade Total", desc: "Segurança nível governamental · ISO 27001" },
                { icon: Terminal, label: "API Institucional", desc: "Integração direta com sistemas ERP" },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-4 rounded-lg px-4 py-3"
                  style={{ background: "rgba(8,14,26,0.6)", border: `1px solid ${T.border}` }}
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(200,16,46,0.1)", border: `1px solid ${T.borderR}` }}>
                    <item.icon style={{ width: 13, height: 13, color: T.red }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.textBrt, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.textDim, marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-8 mt-auto"
              style={{ borderTop: `1px solid ${T.border}` }}>
              <LiveStat value="25+" label="Países" />
              <LiveStat value="480+" label="Operadoras" />
              <LiveStat value="99.9%" label="Uptime" />
            </div>

            {/* Live clock */}
            <div className="mt-6 flex items-center justify-between">
              <span style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, letterSpacing: "0.14em" }}>
                © 2026 ALPHADATA · CONFIDENCIAL
              </span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                <span style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, letterSpacing: "0.1em" }}>
                  {timeStr} · {dateStr}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════
            RIGHT — Auth Form
            ══════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center p-6 lg:p-16 relative overflow-y-auto form-scroll"
          style={{ background: T.bg2 }}>

          {/* Subtle vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(4,8,15,0.6) 100%)"
          }} />

          <div className="relative z-10 w-full max-w-[420px]">

            {/* Corner decorations */}
            <div className="absolute -top-3 -left-3 w-6 h-6 pointer-events-none" style={{
              borderTop: `2px solid ${T.red}`, borderLeft: `2px solid ${T.red}`
            }} />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 pointer-events-none" style={{
              borderBottom: `2px solid ${T.blueMid}`, borderRight: `2px solid ${T.blueMid}`
            }} />

            <AnimatePresence mode="wait">

              {/* ── LOGIN ─────────────────────────────────── */}
              {authView === "login" && (
                <motion.div key="login"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8 p-8 rounded-2xl"
                  style={{ background: "rgba(6,12,24,0.8)", border: `1px solid ${T.border}`, backdropFilter: "blur(10px)" }}
                >
                  {/* Auth header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Fingerprint style={{ width: 14, height: 14, color: T.red }} />
                      <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                        Autenticação Segura · TLS 1.3
                      </span>
                    </div>
                    <h2 style={{ fontFamily: T.sans, fontSize: 26, fontWeight: 900, color: T.white, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                      Portal do Cliente
                    </h2>
                    <div className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "rgba(200,16,46,0.05)", border: `1px solid rgba(200,16,46,0.15)` }}>
                      <AlertCircle style={{ width: 13, height: 13, color: T.red, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontFamily: T.sans, fontSize: 11, color: T.textMid, lineHeight: 1.55 }}>
                        Acesso restrito a utilizadores autorizados. Todas as sessões são registadas e auditadas.
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <FieldLabel>E-mail Institucional</FieldLabel>
                      <TextInput icon={Mail} type="email" placeholder="utilizador@empresa.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Senha de Acesso</FieldLabel>
                        <button type="button" onClick={() => switchView("forgot-password")}
                          style={{ fontFamily: T.mono, fontSize: 8, color: T.red, letterSpacing: "0.14em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.white}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.red}
                        >
                          Esqueceu?
                        </button>
                      </div>
                      <TextInput icon={Lock} type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)}
                        required
                        rightSlot={
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, display: "flex" }}>
                            {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                          </button>
                        }
                      />
                    </div>

                    <div className="pt-2">
                      <PrimaryBtn type="submit" loading={loading} disabled={loading}>
                        <ShieldCheck style={{ width: 13, height: 13 }} />
                        Entrar no Terminal
                        <ChevronRight style={{ width: 13, height: 13 }} />
                      </PrimaryBtn>
                    </div>
                  </form>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.border}, transparent)` }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, letterSpacing: "0.2em", background: T.bg2, padding: "0 12px", textTransform: "uppercase" }}>
                        Sem Acesso?
                      </span>
                    </div>
                  </div>

                  <GhostBtn onClick={() => switchView("signup")}>
                    Solicitar Acesso Institucional →
                  </GhostBtn>
                </motion.div>
              )}

              {/* ── SIGNUP ────────────────────────────────── */}
              {authView === "signup" && (
                <motion.div key="signup"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-7 p-8 rounded-2xl"
                  style={{ background: "rgba(6,12,24,0.8)", border: `1px solid ${T.border}`, backdropFilter: "blur(10px)" }}
                >
                  <div className="space-y-3">
                    <button onClick={() => switchView("login")} className="flex items-center gap-1.5 transition-colors"
                      style={{ fontFamily: T.mono, fontSize: 8, color: T.red, letterSpacing: "0.16em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.white}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.red}
                    >
                      <ArrowLeft style={{ width: 11, height: 11 }} /> Voltar ao Login
                    </button>
                    <h2 style={{ fontFamily: T.sans, fontSize: 24, fontWeight: 900, color: T.white, letterSpacing: "-0.02em" }}>
                      Solicitar Acesso
                    </h2>
                    <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
                      Selecione o perfil institucional para iniciar o processo de revisão de conformidade.
                    </p>
                  </div>

                  {/* Type selector */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "personal", icon: User, label: "Individual", desc: "Consultores e analistas" },
                      { key: "organization", icon: Building2, label: "Corporativo", desc: "Empresas e governos" },
                    ] as const).map(opt => (
                      <button key={opt.key} onClick={() => setAccountType(opt.key)}
                        className="p-4 rounded-xl text-left transition-all duration-200 flex flex-col gap-3"
                        style={{
                          background: accountType === opt.key ? "rgba(200,16,46,0.08)" : "rgba(8,14,26,0.6)",
                          border: `1px solid ${accountType === opt.key ? T.borderR : T.border}`,
                          cursor: "pointer",
                        }}
                      >
                        <opt.icon style={{ width: 14, height: 14, color: accountType === opt.key ? T.red : T.textDim }} />
                        <div>
                          <div style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: accountType === opt.key ? T.white : T.textMid, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                            {opt.label}
                          </div>
                          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.textDim, marginTop: 3 }}>
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    {accountType === "personal"
                      ? <PersonalSignupForm onSubmit={handlePersonalSignup} isLoading={signupLoading} error={signupError} />
                      : <OrganizationSignupForm onSubmit={handleOrganizationSignup} isLoading={signupLoading} error={signupError} />
                    }
                  </div>
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD ───────────────────────── */}
              {authView === "forgot-password" && (
                <motion.div key="forgot"
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-8 p-8 rounded-2xl"
                  style={{ background: "rgba(6,12,24,0.8)", border: `1px solid ${T.border}`, backdropFilter: "blur(10px)" }}
                >
                  <div className="space-y-3">
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      Recuperação de Credencial
                    </div>
                    <h2 style={{ fontFamily: T.sans, fontSize: 24, fontWeight: 900, color: T.white, letterSpacing: "-0.02em" }}>
                      Redefinir Senha
                    </h2>
                    <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
                      Enviaremos um link de redefinição para o seu e-mail institucional cadastrado.
                    </p>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!forgotEmail) { toast.error("Insira o seu email"); return; }
                    setForgotLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/auth` });
                      if (error) throw error;
                      toast.success("Email enviado!", { description: "Verifique a sua caixa de entrada." });
                      switchView("login");
                    } catch (err: any) {
                      toast.error("Erro ao enviar email", { description: err.message });
                    } finally {
                      setForgotLoading(false); }
                  }} className="space-y-5">
                    <div>
                      <FieldLabel>E-mail de Recuperação</FieldLabel>
                      <TextInput icon={Mail} type="email" placeholder="seu@email.com" value={forgotEmail} onChange={(e: any) => setForgotEmail(e.target.value)} required />
                    </div>
                    <PrimaryBtn type="submit" loading={forgotLoading} disabled={forgotLoading}>
                      Enviar Link de Redefinição
                    </PrimaryBtn>
                    <GhostBtn onClick={() => switchView("login")}>
                      Cancelar e Voltar
                    </GhostBtn>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer links */}
            <div className="mt-6 flex items-center justify-center gap-8">
              {["Suporte", "Documentação", "Privacidade"].map(l => (
                <a key={l} href="#" className="flex items-center gap-1 transition-colors"
                  style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, letterSpacing: "0.14em", textTransform: "uppercase" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textMid}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
                >
                  {l} <ExternalLink style={{ width: 9, height: 9 }} />
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}