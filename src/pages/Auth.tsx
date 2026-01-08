import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Shield,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  BarChart3,
  Globe,
  Zap,
  MapPin
} from "lucide-react";
import alphadataLogo from "@/assets/alphadata-logo.png";
import { z } from "zod";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AccountTypeSelector } from "@/components/auth/AccountTypeSelector";
import { PersonalSignupForm } from "@/components/auth/PersonalSignupForm";
import { OrganizationSignupForm } from "@/components/auth/OrganizationSignupForm";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Password deve ter pelo menos 6 caracteres" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
});

type AuthView = "login" | "signup" | "forgot-password";
type AccountType = "personal" | "organization";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      {/* Top Bar - Home Link & Language Selector */}
      <div className="fixed top-4 left-4 z-50">
        <Link 
          to="/landing" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
        >
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>
      </div>
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

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
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  {t('auth.poweredByAI')}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  {t('auth.panAfricanCoverage')}
                </div>
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
                {t('auth.heroTitle')}
                <br />
                <span className="text-gradient-primary">{t('auth.heroSubtitle')}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-4">
                {t('auth.heroDescription')}
              </p>
              
              {/* African Countries Stats */}
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">25+</div>
                  <div className="text-xs text-muted-foreground">{t('auth.countriesCovered')}</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">7.5M</div>
                  <div className="text-xs text-muted-foreground">{t('auth.barrelsPerDay')}</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[hsl(var(--success))]">$200B+</div>
                  <div className="text-xs text-muted-foreground">{t('auth.annualVolume')}</div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* African Focus Badge */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('auth.mainRegions')}</span>
              <span className="text-sm text-muted-foreground">{t('auth.westAfrica')} • {t('auth.opecAfrica')} • {t('auth.northAfrica')}</span>
            </div>
            
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{t('auth.panAfricanCoverageTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('auth.panAfricanCoverageDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{t('auth.aiAnalysisTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('auth.aiAnalysisDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            
            <div className="group flex items-center gap-4 p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 cursor-default">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 text-[hsl(var(--success))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{t('auth.realTimeDataTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('auth.realTimeDataDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--success))] transition-colors" />
            </div>
          </motion.div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p className="text-lg font-medium text-foreground italic">
              "{t('auth.quote')}"
            </p>
            <p className="text-sm text-muted-foreground">
              {t('auth.copyright')}
            </p>
          </motion.div>
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
            <p className="text-sm text-muted-foreground">{t('auth.mobileSubtitle')}</p>
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
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t('auth.welcomeBack')}</h2>
                    <p className="text-muted-foreground">{t('auth.enterAccount')}</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground font-medium">{t('common.email')}</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-12 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-foreground font-medium">{t('common.password')}</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('auth.passwordPlaceholder')}
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
                        {t('auth.forgotPassword')}
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
                          {t('auth.loggingIn')}
                        </span>
                      ) : (
                        t('auth.loginButton')
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-center text-muted-foreground">
                      {t('auth.noAccount')}{" "}
                      <button
                        onClick={() => switchView("signup")}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        {t('auth.registerCompany')}
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
                    <span className="text-sm font-medium">{t('auth.backToLogin')}</span>
                  </button>

                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t('auth.recoverPassword')}</h2>
                    <p className="text-muted-foreground">{t('auth.recoverDescription')}</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-foreground font-medium">{t('common.email')}</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
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
                          {t('auth.sending')}
                        </span>
                      ) : (
                        t('auth.sendRecoveryEmail')
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-center text-muted-foreground">
                      {t('auth.rememberPassword')}{" "}
                      <button
                        onClick={() => switchView("login")}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        {t('auth.backToLogin')}
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
                    <span className="text-sm font-medium">{t('auth.backToLogin')}</span>
                  </button>

                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t('auth.createAccount')}</h2>
                    <p className="text-muted-foreground">{t('auth.completeForm')}</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 scrollbar-thin">
                    {/* Company Section */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{t('auth.companyData')}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name" className="text-sm">{t('auth.companyName')}</Label>
                        <Input
                          id="company-name"
                          placeholder={t('auth.companyNamePlaceholder')}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="company-type" className="text-sm">{t('auth.companyType')}</Label>
                          <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)}>
                            <SelectTrigger className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background">
                              <SelectValue placeholder={t('auth.selectCompanyType')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operadora">{t('auth.oilOperator')}</SelectItem>
                              <SelectItem value="banco">{t('auth.bank')}</SelectItem>
                              <SelectItem value="trader">{t('auth.trader')}</SelectItem>
                              <SelectItem value="consultora">{t('auth.consultant')}</SelectItem>
                              <SelectItem value="governo">{t('auth.government')}</SelectItem>
                              <SelectItem value="prestadora_servicos">{t('auth.serviceProvider')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="nif" className="text-sm">{t('auth.taxId')}</Label>
                          <Input
                            id="nif"
                            placeholder={t('auth.taxIdPlaceholder')}
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
                      <h3 className="font-semibold text-foreground">{t('auth.contactData')}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name" className="text-sm">{t('auth.contactName')}</Label>
                        <Input
                          id="contact-name"
                          placeholder={t('auth.contactNamePlaceholder')}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact-role" className="text-sm">{t('auth.contactRole')}</Label>
                        <div className="relative group">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contact-role"
                            placeholder={t('auth.contactRolePlaceholder')}
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-sm">{t('auth.contactPhone')}</Label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contact-phone"
                            placeholder={t('auth.contactPhonePlaceholder')}
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm">{t('auth.corporateEmail')}</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder={t('auth.corporateEmailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:bg-background focus:border-primary transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm">{t('auth.createPassword')}</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('auth.passwordMin')}
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
                          {t('auth.acceptTerms')}
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
                          {t('auth.acceptNda')}
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
                          {t('auth.submitting')}
                        </span>
                      ) : (
                        t('auth.submitRequest')
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground pb-2">
                      {t('auth.hasAccount')}{" "}
                      <button
                        type="button"
                        onClick={() => switchView("login")}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        {t('auth.loginHere')}
                      </button>
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('auth.enterpriseEncryption')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
