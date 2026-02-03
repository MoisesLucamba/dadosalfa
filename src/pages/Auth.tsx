import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Home, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Globe,
  ShieldCheck,
  Building2,
  User,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

// Integrations & UI
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AccountTypeSelector } from "@/components/auth/AccountTypeSelector";
import { PersonalSignupForm } from "@/components/auth/PersonalSignupForm";
import { OrganizationSignupForm } from "@/components/auth/OrganizationSignupForm";
import alphadataLogo from "@/assets/alphadata-logo.png";

/**
 * SCHEMAS: Validation
 */
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email institucional inválido" }),
  password: z.string().min(6, { message: "A senha deve conter no mínimo 6 caracteres" }),
});

/**
 * COMPONENT: Auth
 * Institutional-grade authentication portal
 */
export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // View States
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot-password">("login");
  const [accountType, setAccountType] = useState<"personal" | "organization">("personal");
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auth Session Management
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate("/");
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /**
   * HANDLER: Login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_approved, account_type, organization_id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile && !profile.is_approved) {
          await supabase.auth.signOut();
          toast.error("Acesso Pendente", {
            description: "Sua conta está em processo de revisão pela nossa equipe de conformidade."
          });
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

  const switchView = (view: typeof authView) => {
    setEmail("");
    setPassword("");
    setAuthView(view);
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans selection:bg-primary/10">
      
      {/* Navigation Overlays */}
      <nav className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
        <Link 
          to="/landing" 
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Portal</span>
        </Link>
        <div className="pointer-events-auto scale-90 origin-right">
          <LanguageSelector />
        </div>
      </nav>

      {/* LEFT PANEL: Institutional Branding & Trust */}
      <section className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-[#0F172A] relative overflow-hidden border-r border-white/5">
        {/* Abstract Data Pattern */}
        <div className="absolute inset-0 opacity-20" 
          style={{ backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`, backgroundSize: '32px 32px' }} 
        />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <header>
            <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto brightness-0 invert opacity-90" />
          </header>

          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary-foreground/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3 w-3" />
                Enterprise Intelligence
              </div>
              <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-[1.1] tracking-tight">
                Decisões baseadas em <span className="text-primary">dados reais</span> para o setor de energia.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Acesse a plataforma líder em inteligência de mercado para o setor petrolífero africano.
              </p>
            </motion.div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Globe, title: "Cobertura Pan-Africana", desc: "Dados consolidados de mais de 25 nações." },
                { icon: BarChart3, title: "Análise Preditiva", desc: "Modelos de IA treinados no mercado local." },
                { icon: CheckCircle2, title: "Conformidade Regulatória", desc: "Processos auditados e seguros." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <item.icon className="h-6 w-6 text-primary mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-white font-medium text-sm">{item.title}</h3>
                    <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <footer className="flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            <span>© 2026 ALPHADATA INTEL</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
            </div>
          </footer>
        </div>
      </section>

      {/* RIGHT PANEL: Authentication Form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <motion.div 
          className="w-full max-w-[440px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <img src={alphadataLogo} alt="AlphaData" className="h-8 w-auto mx-auto" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <AnimatePresence mode="wait">
              {authView === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <header className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Acesso ao Portal</h2>
                    <p className="text-slate-500 text-sm">Insira suas credenciais corporativas para continuar.</p>
                  </header>

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail Profissional</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="exemplo@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 border-slate-200 rounded-lg focus:ring-primary/20 focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha</Label>
                          <button 
                            type="button" 
                            onClick={() => switchView("forgot-password")}
                            className="text-[11px] font-bold text-primary hover:underline uppercase tracking-tighter"
                          >
                            Esqueceu a senha?
                          </button>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 border-slate-200 rounded-lg focus:ring-primary/20 focus:border-primary transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-slate-200"
                      disabled={loading}
                    >
                      {loading ? "Verificando..." : "Entrar no Sistema"}
                    </Button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                      <span className="bg-white px-4 text-slate-400">Novo por aqui?</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg"
                    onClick={() => switchView("signup")}
                  >
                    Solicitar Acesso Institucional
                  </Button>
                </motion.div>
              ) : authView === "signup" ? (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <header className="space-y-2">
                    <button 
                      onClick={() => switchView("login")}
                      className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest hover:gap-2 transition-all"
                    >
                      <ArrowLeft className="h-3 w-3" /> Voltar ao Login
                    </button>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Registro de Conta</h2>
                    <p className="text-slate-500 text-sm">Selecione o perfil que melhor descreve sua atuação.</p>
                  </header>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setAccountType("personal")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${accountType === "personal" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <User className={`h-5 w-5 mb-2 ${accountType === "personal" ? "text-primary" : "text-slate-400"}`} />
                        <span className="block text-sm font-bold text-slate-900">Individual</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Consultores e analistas independentes.</span>
                      </button>
                      <button 
                        onClick={() => setAccountType("organization")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${accountType === "organization" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <Building2 className={`h-5 w-5 mb-2 ${accountType === "organization" ? "text-primary" : "text-slate-400"}`} />
                        <span className="block text-sm font-bold text-slate-900">Corporativo</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Empresas, ONGs e órgãos governamentais.</span>
                      </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                      {accountType === "personal" ? (
                        <PersonalSignupForm onSuccess={() => switchView("login")} />
                      ) : (
                        <OrganizationSignupForm onSuccess={() => switchView("login")} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <header className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Recuperar Senha</h2>
                    <p className="text-slate-500 text-sm">Enviaremos instruções para o seu e-mail cadastrado.</p>
                  </header>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail de Recuperação</Label>
                      <Input placeholder="seu@email.com" className="h-11 border-slate-200" />
                    </div>
                    <Button className="w-full h-11 bg-primary text-white font-semibold">Enviar Link de Redefinição</Button>
                    <Button variant="ghost" className="w-full text-slate-500 text-xs" onClick={() => switchView("login")}>Cancelar e Voltar</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* External Links */}
          <div className="mt-8 flex justify-center gap-6">
            <a href="#" className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              Suporte Técnico <ExternalLink className="h-3 w-3" />
            </a>
            <a href="#" className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
              Documentação <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}