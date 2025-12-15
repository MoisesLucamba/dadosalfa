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
import { Eye, EyeOff, Building2, Mail, Lock, User, Phone, Briefcase, FileText, Shield } from "lucide-react";
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

type CompanyType = "operadora" | "banco" | "trader" | "consultora" | "governo" | "prestadora_servicos";

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
  const [isLogin, setIsLogin] = useState(true);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <img src={alphadataLogo} alt="AlphaData" className="h-10 w-auto mb-8" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Market Intelligence
              <br />
              <span className="text-primary">para o Setor Petrolífero</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Plataforma de análise avançada com IA para decisões estratégicas no mercado de petróleo angolano.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Dados Seguros</h3>
                <p className="text-sm text-muted-foreground">Encriptação e controlo de acessos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Relatórios Inteligentes</h3>
                <p className="text-sm text-muted-foreground">Insights automáticos com IA</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 AlphaData. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img src={alphadataLogo} alt="AlphaData" className="h-8 w-auto mx-auto mb-4" />
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-secondary/50 rounded-lg">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registar Empresa
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground">Email Corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-secondary/50 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-secondary/50 border-border"
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "A entrar..." : "Entrar na Plataforma"}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSignup}
                  className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
                >
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dados da Empresa
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        placeholder="Sonangol, S.A."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-secondary/50 border-border"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company-type">Tipo de Empresa</Label>
                      <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)}>
                        <SelectTrigger className="bg-secondary/50 border-border">
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
                      <Label htmlFor="nif">NIF</Label>
                      <Input
                        id="nif"
                        placeholder="5417268501"
                        value={nif}
                        onChange={(e) => setNif(e.target.value)}
                        className="bg-secondary/50 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-border my-4" />
                  
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Responsável da Conta
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Nome Completo</Label>
                      <Input
                        id="contact-name"
                        placeholder="João Silva"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="bg-secondary/50 border-border"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-role">Cargo</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact-role"
                          placeholder="Diretor Financeiro"
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value)}
                          className="pl-10 bg-secondary/50 border-border"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Telefone (opcional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact-phone"
                          placeholder="+244 923 456 789"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="pl-10 bg-secondary/50 border-border"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email Corporativo</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="email@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-secondary/50 border-border"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-secondary/50 border-border"
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

                  <div className="border-t border-border my-4" />

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        Li e aceito os{" "}
                        <span className="text-primary hover:underline">Termos de Uso</span> e a{" "}
                        <span className="text-primary hover:underline">Política de Privacidade</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="nda"
                        checked={acceptedNda}
                        onCheckedChange={(checked) => setAcceptedNda(checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="nda" className="text-sm text-muted-foreground cursor-pointer">
                        Aceito o{" "}
                        <span className="text-primary hover:underline">Acordo de Confidencialidade (NDA)</span>{" "}
                        para acesso aos dados da plataforma
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={loading}>
                    {loading ? "A criar conta..." : "Registar Empresa"}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    A sua conta será analisada pela equipa AlphaData antes da aprovação.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
