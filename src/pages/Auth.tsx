import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft,
  BarChart3,
  Globe,
  ShieldCheck,
  Building2,
  User,
  ExternalLink
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

// Integrations & UI
import { supabase } from "@/integrations/supabase/client";
import alphadataLogo from "@/assets/alphadata-logo.png";

// Importação dos componentes de formulário solicitados
import { PersonalSignupForm } from "@/components/auth/PersonalSignupForm";
import { OrganizationSignupForm } from "@/components/auth/OrganizationSignupForm";

// --- Institutional UI Components ---
const Button = ({ children, className, variant, onClick, disabled, type, ...props }: any) => {
  const baseStyles = "px-6 py-3 font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs";
  const variants: any = {
    primary: "bg-[#002855] hover:bg-black text-white shadow-lg hover:shadow-black/20",
    secondary: "bg-[#C8102E] hover:bg-[#a30d25] text-white shadow-lg hover:shadow-[#C8102E]/20",
    outline: "border-2 border-[#002855] text-[#002855] hover:bg-[#002855] hover:text-white",
    ghost: "text-[#002855] hover:bg-gray-50",
    link: "text-[#002855] hover:text-black p-0 h-auto font-bold underline-offset-4 hover:underline"
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant || 'primary']} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className, ...props }: any) => (
  <input 
    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#002855] focus:bg-white outline-none transition-all font-medium text-black placeholder:text-gray-400 text-sm ${className}`}
    {...props}
  />
);

const Label = ({ children, className, ...props }: any) => (
  <label className={`text-[11px] font-bold uppercase tracking-widest text-black mb-2 block ${className}`} {...props}>
    {children}
  </label>
);

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email institucional inválido" }),
  password: z.string().min(6, { message: "A senha deve conter no mínimo 6 caracteres" }),
});

export default function Auth() {
  const navigate = useNavigate();
  
  // View States
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot-password">("login");
  const [accountType, setAccountType] = useState<"personal" | "organization">("personal");
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  
  // Form States
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

  const handlePersonalSignup = async (data: any) => {
    setSignupLoading(true);
    setSignupError(null);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            company_name: data.companyName,
            company_type: 'consultora',
            contact_name: data.contactName,
            contact_role: data.jobTitle,
            contact_phone: data.phone,
            job_title: data.jobTitle,
            nif: 'N/A',
            account_type: 'personal',
            accepted_terms: data.acceptTerms,
            accepted_nda: data.acceptNda,
          });
          
        if (profileError) throw profileError;
        
        toast.success("Conta criada com sucesso!", { 
          description: "Por favor, verifique o seu email para confirmar o registo." 
        });
        setAuthView("login");
      }
    } catch (err: any) {
      setSignupError(err.message || "Erro ao criar conta");
      toast.error("Erro no registo", { description: err.message });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleOrganizationSignup = async (data: any) => {
    setSignupLoading(true);
    setSignupError(null);
    try {
      // Create organization first
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.companyName,
          nif: data.nif,
          sector: data.sector,
          email_domain: data.emailDomain,
          country: data.country,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
        })
        .select()
        .single();
        
      if (orgError) throw orgError;
      
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.contactEmail,
        password: data.password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            company_name: data.companyName,
            company_type: data.sector || 'operadora',
            contact_name: data.contactName,
            contact_role: data.contactRole,
            contact_phone: data.contactPhone,
            nif: data.nif,
            organization_id: orgData.id,
            account_type: 'organization',
            accepted_terms: data.acceptTerms,
            accepted_nda: data.acceptNda,
          });
          
        if (profileError) throw profileError;
        
        toast.success("Organização registada!", { 
          description: "O registo será analisado pela nossa equipa." 
        });
        setAuthView("login");
      }
    } catch (err: any) {
      setSignupError(err.message || "Erro ao registar organização");
      toast.error("Erro no registo", { description: err.message });
    } finally {
      setSignupLoading(false);
    }
  };

  const switchView = (view: typeof authView) => {
    setEmail("");
    setPassword("");
    setAuthView(view);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-[#002855]/10">
      
      {/* LEFT PANEL: Institutional Branding */}
      <section className="lg:w-[45%] bg-[#002855] flex flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
        />
        
        <div className="relative z-10">
          {/* Logo and Back to Landing */}
          <div className="flex items-center justify-between mb-16">
            <Link to="/" className="inline-block">
              <img 
                src={alphadataLogo} 
                alt="AlphaData" 
                className="h-12 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <Link 
              to="/landing"
              className="flex items-center gap-2 px-4 py-2 border border-white/30 text-white/80 hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              <ExternalLink className="h-3 w-3" />
              Página Inicial
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="h-1.5 w-16 bg-[#C8102E]" />
            <h1 className="text-4xl xl:text-6xl font-black text-white leading-tight tracking-tight uppercase">
              Inteligência <br />
              <span className="text-[#C8102E]">Auditável</span>
            </h1>
            <p className="text-blue-100/60 text-xl leading-relaxed max-w-md font-light">
              Plataforma institucional de monitorização e análise regulatória para o setor energético africano.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 mt-12">
          {[
            { icon: Globe, title: "Cobertura Continental", desc: "Dados de 25+ jurisdições africanas." },
            { icon: ShieldCheck, title: "Conformidade Total", desc: "Segurança de nível governamental." }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-5">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center text-[#C8102E] bg-white/5">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xs uppercase tracking-widest">{item.title}</h3>
                <p className="text-blue-200/40 text-[11px] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="relative z-10 pt-12 flex items-center justify-between text-[10px] text-blue-300/30 font-bold uppercase tracking-[0.3em]">
          <span>© 2026 ALPHADATA</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
          </div>
        </footer>
      </section>

      {/* RIGHT PANEL: Authentication Form */}
      <section className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-[440px]">
          <AnimatePresence mode="wait">
            {authView === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <header className="space-y-4">
                  <h2 className="text-4xl font-black text-black tracking-tighter uppercase">Portal do Cliente</h2>
                  <p className="text-gray-400 text-sm font-medium border-l-4 border-[#C8102E] pl-4">
                    Insira suas credenciais corporativas para aceder ao terminal de inteligência.
                  </p>
                </header>

                <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail Profissional</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-[#002855] transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="exemplo@empresa.com"
                          value={email}
                          onChange={(e: any) => setEmail(e.target.value)}
                          className="pl-12 border-gray-100"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Senha de Acesso</Label>
                        <button 
                          type="button" 
                          onClick={() => switchView("forgot-password")}
                          className="text-[10px] font-bold text-[#C8102E] hover:text-black uppercase tracking-widest transition-colors"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-[#002855] transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e: any) => setPassword(e.target.value)}
                          className="pl-12 pr-12 border-gray-100"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-4 text-sm"
                    disabled={loading}
                  >
                    {loading ? "VERIFICANDO..." : "ENTRAR NO SISTEMA"}
                  </Button>
                </form>

                <div className="pt-8 border-t border-gray-100">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
                      <span className="bg-white px-6 text-gray-400">Novo Utilizador?</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full py-4"
                    onClick={() => switchView("signup")}
                  >
                    SOLICITAR ACESSO INSTITUCIONAL
                  </Button>
                </div>
              </motion.div>
            ) : authView === "signup" ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="space-y-4">
                  <button 
                    onClick={() => switchView("login")}
                    className="flex items-center gap-2 text-[10px] font-bold text-[#C8102E] uppercase tracking-widest hover:text-black transition-all"
                  >
                    <ArrowLeft className="h-3 w-3" /> Voltar ao Login
                  </button>
                  <h2 className="text-4xl font-black text-black tracking-tighter uppercase">Solicitar Acesso</h2>
                  <p className="text-gray-400 text-sm font-medium border-l-4 border-[#C8102E] pl-4">
                    Selecione o perfil institucional para iniciar o processo de revisão.
                  </p>
                </header>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setAccountType("personal")}
                      className={`p-6 border text-left transition-all flex flex-col gap-4 ${accountType === "personal" ? "border-[#002855] bg-[#002855]/5" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <User className={`h-5 w-5 ${accountType === "personal" ? "text-[#002855]" : "text-gray-300"}`} />
                      <div>
                        <span className="block text-[10px] font-black text-black uppercase tracking-widest">Individual</span>
                        <span className="text-[9px] text-gray-400 font-medium leading-tight mt-1 block">Consultores independentes.</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setAccountType("organization")}
                      className={`p-6 border text-left transition-all flex flex-col gap-4 ${accountType === "organization" ? "border-[#002855] bg-[#002855]/5" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <Building2 className={`h-5 w-5 ${accountType === "organization" ? "text-[#002855]" : "text-gray-300"}`} />
                      <div>
                        <span className="block text-[10px] font-black text-black uppercase tracking-widest">Corporativo</span>
                        <span className="text-[9px] text-gray-400 font-medium leading-tight mt-1 block">Empresas e governos.</span>
                      </div>
                    </button>
                  </div>

                  {/* Renderização condicional dos componentes solicitados */}
                  <div className="pt-4">
                    {accountType === "personal" ? (
                      <PersonalSignupForm onSubmit={handlePersonalSignup} isLoading={signupLoading} error={signupError} />
                    ) : (
                      <OrganizationSignupForm onSubmit={handleOrganizationSignup} isLoading={signupLoading} error={signupError} />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-10"
              >
                <header className="space-y-4">
                  <h2 className="text-4xl font-black text-black tracking-tighter uppercase">Recuperar Senha</h2>
                  <p className="text-gray-400 text-sm font-medium border-l-4 border-[#C8102E] pl-4">
                    Enviaremos instruções de redefinição para o seu e-mail institucional cadastrado.
                  </p>
                </header>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>E-mail de Recuperação</Label>
                    <Input placeholder="seu@email.com" className="border-gray-100" />
                  </div>
                  <Button className="w-full py-4">ENVIAR LINK DE REDEFINIÇÃO</Button>
                  <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest" onClick={() => switchView("login")}>Cancelar e Voltar</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Support Links */}
          <div className="mt-16 flex justify-center gap-10 border-t border-gray-50 pt-8">
            <a href="#" className="flex items-center gap-2 text-[10px] font-bold text-gray-300 hover:text-black transition-colors uppercase tracking-widest">
              Suporte <ExternalLink className="h-3 w-3" />
            </a>
            <a href="#" className="flex items-center gap-2 text-[10px] font-bold text-gray-300 hover:text-black transition-colors uppercase tracking-widest">
              Documentação <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}