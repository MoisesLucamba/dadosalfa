import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Eye, 
  EyeOff, 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Briefcase, 
  FileText, 
  Shield,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  BarChart3,
  TrendingUp
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Password deve ter pelo menos 6 caracteres" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Email corporativo inválido" }),
  password: z.string().min(8, { message: "Password deve ter pelo menos 8 caracteres" }),
  companyName: z.string().trim().min(2, { message: "Nome da empresa é obrigatório" }),
  companyType: z.enum(["operadora", "banco", "trader", "consultora", "governo", "prestadora_servicos"], {
    required_error: "Selecione o tipo de empresa",
  }),
  nif: z.string().trim().min(5, { message: "NIF inválido" }),
  contactName: z.string().trim().min(2, { message: "Nome do responsável é obrigatório" }),
  contactRole: z.string().trim().min(2, { message: "Cargo é obrigatório" }),
  contactPhone: z.string().optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "Deve aceitar os termos de uso" }) }),
  acceptedNda: z.literal(true, { errorMap: () => ({ message: "Deve aceitar o NDA" }) }),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
});

type CompanyType = "operadora" | "banco" | "trader" | "consultora" | "governo" | "prestadora_servicos";
type AuthView = "login" | "signup" | "forgot-password";

const companyTypeLabels: Record<CompanyType, string> = {
  operadora: "Operadora Petrolífera",
  banco: "Banco / Instituição Financeira",
  trader: "Trader de Petróleo",
  consultora: "Consultora Estratégica",
  governo: "Órgão Regulador / Governo",
  prestadora_servicos: "Prestadora de Serviços",
};

export default function Auth() {
  const navigate = useNavigate();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup fields
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType | "">("");
  const [nif, setNif] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedNda, setAcceptedNda] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou password incorretos");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Login efetuado com sucesso!");
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({
      email,
      password,
      companyName,
      companyType,
      nif,
      contactName,
      contactRole,
      contactPhone,
      acceptedTerms,
      acceptedNda,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        toast.error("Este email já está registado");
      } else {
        toast.error(authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        company_name: companyName.trim(),
        company_type: companyType as CompanyType,
        nif: nif.trim(),
        contact_name: contactName.trim(),
        contact_role: contactRole.trim(),
        contact_phone: contactPhone.trim() || null,
        accepted_terms: acceptedTerms,
        accepted_nda: acceptedNda,
      });

      if (profileError) {
        toast.error("Erro ao criar perfil: " + profileError.message);
      } else {
        toast.success("Conta criada com sucesso! A sua conta aguarda aprovação.");
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado! Verifique a sua caixa de entrada.");
      setAuthView("login");
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setCompanyName("");
    setCompanyType("");
    setNif("");
    setContactName("");
    setContactRole("");
    setContactPhone("");
    setAcceptedTerms(false);
    setAcceptedNda(false);
  };

  const switchView = (view: AuthView) => {
    resetForm();
    setAuthView(view);
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        </div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={alphadataLogo} alt="AlphaData" className="h-12 w-auto mb-12" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Powered by AI
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Market Intelligence
                <br />
                <span className="text-gradient-primary">para o Setor Petrolífero</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Plataforma de análise avançada com inteligência artificial para decisões estratégicas no mercado de petróleo angolano.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Dados em Tempo Real</h3>
                <p className="text-sm text-muted-foreground">Produção, preços e exportações atualizados</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Análise Preditiva</h3>
                <p className="text-sm text-muted-foreground">Previsões com machine learning avançado</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 text-[hsl(var(--success))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Segurança Enterprise</h3>
                <p className="text-sm text-muted-foreground">Encriptação e controlo de acessos avançado</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--success))] transition-colors" />
            </div>
          </motion.div>

          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            © 2024 AlphaData. Todos os direitos reservados.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="lg:hidden mb-8 text-center">
            <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Market Intelligence Platform</p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-[var(--shadow-elevated)]">
            <AnimatePresence mode="wait">
              {authView === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
                    <p className="text-muted-foreground">Entre na sua conta para continuar</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground font-medium">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="email@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-12 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-foreground font-medium">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 h-12 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchView("forgot-password")}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          A entrar...
                        </span>
                      ) : (
                        "Entrar na Plataforma"
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-center text-muted-foreground">
                      Não tem uma conta?{" "}
                      <button
                        onClick={() => switchView("signup")}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Registar Empresa
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {authView === "forgot-password" && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => switchView("login")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Voltar ao login</span>
                  </button>

                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Recuperar senha</h2>
                    <p className="text-muted-foreground">Enviaremos um link para redefinir a sua senha</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-foreground font-medium">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="email@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-12 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          A enviar...
                        </span>
                      ) : (
                        "Enviar link de recuperação"
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-center text-muted-foreground">
                      Lembrou-se da senha?{" "}
                      <button
                        onClick={() => switchView("login")}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Voltar ao login
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {authView === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => switchView("login")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Voltar ao login</span>
                  </button>

                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Registar Empresa</h2>
                    <p className="text-muted-foreground">Crie uma conta para a sua organização</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 scrollbar-thin">
                    {/* Company Section */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name" className="text-sm">Nome da Empresa</Label>
                        <Input
                          id="company-name"
                          placeholder="Sonangol, S.A."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="company-type" className="text-sm">Tipo</Label>
                          <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)}>
                            <SelectTrigger className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background">
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(companyTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="nif" className="text-sm">NIF</Label>
                          <Input
                            id="nif"
                            placeholder="5417268501"
                            value={nif}
                            onChange={(e) => setNif(e.target.value)}
                            className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border my-4" />
                    
                    {/* Contact Section */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground">Responsável da Conta</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name" className="text-sm">Nome</Label>
                        <Input
                          id="contact-name"
                          placeholder="João Silva"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact-role" className="text-sm">Cargo</Label>
                        <div className="relative group">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contact-role"
                            placeholder="Diretor"
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-sm">Telefone</Label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contact-phone"
                            placeholder="+244 923 456 789"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="email@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-border my-4" />

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                        <Checkbox
                          id="terms"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                          Li e aceito os{" "}
                          <span className="text-primary hover:underline font-medium">Termos de Uso</span> e a{" "}
                          <span className="text-primary hover:underline font-medium">Política de Privacidade</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                        <Checkbox
                          id="nda"
                          checked={acceptedNda}
                          onCheckedChange={(checked) => setAcceptedNda(checked === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="nda" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                          Aceito o{" "}
                          <span className="text-primary hover:underline font-medium">Acordo de Confidencialidade (NDA)</span>
                        </Label>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all mt-4" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          A criar conta...
                        </span>
                      ) : (
                        "Registar Empresa"
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground pb-2">
                      A sua conta será analisada pela equipa AlphaData antes da aprovação.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Protegido por encriptação de nível enterprise
          </p>
        </motion.div>
      </div>
    </div>
  );
}
