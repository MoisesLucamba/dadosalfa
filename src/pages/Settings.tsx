import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { 
  useUserProfile, 
  useUpdateProfile, 
  useUpdateNotificationSettings, 
  useUserNotificationSettings, 
  useChangePassword, 
  useExportUserData, 
  useDeleteAccount 
} from "@/hooks/useSettings";
import { toast } from "sonner";
import { 
  Loader2, Sun, Moon, Bell, Shield, User, 
  Building2, Key, Smartphone, Globe, Download, 
  Trash2, Save, CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

interface ProfileForm {
  contact_name: string;
  contact_phone: string;
  contact_role: string;
}

interface CompanyForm {
  company_name: string;
  nif: string;
  country: string;
}

// --- Sub-components ---

const SettingsSection = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  delay = 0 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

const FormField = ({ label, id, description, children }: { label: string; id: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    {children}
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

const ToggleSetting = ({ 
  label, 
  description, 
  checked, 
  onCheckedChange, 
  icon: Icon 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  icon?: any;
}) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <Label className="text-sm font-medium cursor-pointer" onClick={() => onCheckedChange(!checked)}>
          {label}
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

// --- Main Component ---

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  // Queries & Mutations
  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { data: notificationSettings } = useUserNotificationSettings();
  const updateProfile = useUpdateProfile();
  const updateNotifications = useUpdateNotificationSettings();
  const changePassword = useChangePassword();
  const exportData = useExportUserData();
  const deleteAccount = useDeleteAccount();

  // Form States
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    contact_name: "",
    contact_phone: "",
    contact_role: "",
  });

  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    company_name: "",
    nif: "",
    country: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Sync profile data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        contact_name: profile.contact_name || "",
        contact_phone: profile.contact_phone || "",
        contact_role: profile.contact_role || "",
      });
      setCompanyForm({
        company_name: profile.company_name || "",
        nif: profile.nif || "",
        country: profile.country || "",
      });
    }
  }, [profile]);

  // Notification Handlers
  const handleNotificationToggle = useCallback((alertType: string, isEnabled: boolean) => {
    updateNotifications.mutate({ 
      alertType, 
      settings: { is_enabled: isEnabled } 
    });
  }, [updateNotifications]);

  const getNotificationStatus = (type: string) => {
    return notificationSettings?.find(s => s.alert_type === type)?.is_enabled ?? false;
  };

  // Action Handlers
  const handleSaveProfile = () => updateProfile.mutate(profileForm);
  const handleSaveCompany = () => updateProfile.mutate(companyForm);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error("A senha deve ter pelo menos 8 caracteres para maior segurança");
    }
    
    changePassword.mutate({ newPassword: passwordForm.newPassword }, {
      onSuccess: () => {
        setIsPasswordDialogOpen(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    });
  };

  if (loadingProfile) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando suas configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configurações | AlphaData</title>
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/settings" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/settings" />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Page Header */}
              <header className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as preferências da sua conta e da sua organização.</p>
              </header>

              <div className="grid gap-8">
                {/* Appearance */}
                <SettingsSection 
                  title="Aparência" 
                  description="Personalize como a plataforma AlphaData aparece para você."
                  icon={theme === "dark" ? Moon : Sun}
                  delay={0.1}
                >
                  <ToggleSetting 
                    label="Modo Escuro"
                    description="Alternar entre o tema claro e escuro para melhor conforto visual."
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection 
                  title="Notificações" 
                  description="Escolha quais alertas você deseja receber e por quais canais."
                  icon={Bell}
                  delay={0.15}
                >
                  <div className="space-y-4">
                    <ToggleSetting 
                      label="Alertas por Email"
                      description="Receba notificações críticas e atualizações importantes no seu email."
                      checked={getNotificationStatus("email_alerts")}
                      onCheckedChange={(v) => handleNotificationToggle("email_alerts", v)}
                    />
                    <Separator className="opacity-50" />
                    <ToggleSetting 
                      label="Alertas de Preço"
                      description="Seja notificado instantaneamente sobre mudanças significativas no mercado."
                      checked={getNotificationStatus("price_alerts")}
                      onCheckedChange={(v) => handleNotificationToggle("price_alerts", v)}
                    />
                    <Separator className="opacity-50" />
                    <ToggleSetting 
                      label="Relatórios Semanais"
                      description="Receba um resumo executivo de toda a atividade da semana."
                      checked={getNotificationStatus("weekly_reports")}
                      onCheckedChange={(v) => handleNotificationToggle("weekly_reports", v)}
                    />
                    <Separator className="opacity-50" />
                    <ToggleSetting 
                      label="Alertas via WhatsApp"
                      description="Receba alertas urgentes diretamente no seu telemóvel."
                      checked={getNotificationStatus("whatsapp_alerts")}
                      onCheckedChange={(v) => handleNotificationToggle("whatsapp_alerts", v)}
                      icon={Smartphone}
                    />
                  </div>
                </SettingsSection>

                {/* Profile Information */}
                <SettingsSection 
                  title="Perfil Pessoal" 
                  description="Suas informações de contato e cargo na organização."
                  icon={User}
                  delay={0.2}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nome de Contato" id="contact_name">
                      <Input 
                        id="contact_name"
                        value={profileForm.contact_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contact_name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </FormField>
                    <FormField label="Telefone" id="contact_phone">
                      <Input 
                        id="contact_phone"
                        value={profileForm.contact_phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="+244 ..."
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <FormField label="Cargo / Função" id="contact_role">
                        <Input 
                          id="contact_role"
                          value={profileForm.contact_role}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, contact_role: e.target.value }))}
                          placeholder="Ex: Gestor de Operações"
                        />
                      </FormField>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={updateProfile.isPending}
                      className="gap-2"
                    >
                      {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </SettingsSection>

                {/* Company Information */}
                <SettingsSection 
                  title="Dados da Empresa" 
                  description="Informações fiscais e de localização da sua organização."
                  icon={Building2}
                  delay={0.25}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField label="Nome da Empresa" id="company_name">
                        <Input 
                          id="company_name"
                          value={companyForm.company_name}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, company_name: e.target.value }))}
                        />
                      </FormField>
                    </div>
                    <FormField label="NIF" id="nif">
                      <Input 
                        id="nif"
                        value={companyForm.nif}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, nif: e.target.value }))}
                      />
                    </FormField>
                    <FormField label="País" id="country">
                      <Input 
                        id="country"
                        value={companyForm.country}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, country: e.target.value }))}
                      />
                    </FormField>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleSaveCompany} 
                      disabled={updateProfile.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Atualizar Empresa
                    </Button>
                  </div>
                </SettingsSection>

                {/* Security */}
                <SettingsSection 
                  title="Segurança" 
                  description="Proteja sua conta alterando sua senha regularmente."
                  icon={Shield}
                  delay={0.3}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Senha de Acesso</p>
                      <p className="text-xs text-muted-foreground">Recomendamos uma senha forte com pelo menos 8 caracteres.</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="gap-2">
                      <Key className="w-4 h-4" />
                      Alterar Senha
                    </Button>
                  </div>
                </SettingsSection>

                {/* Data Management */}
                <SettingsSection 
                  title="Gestão de Dados" 
                  description="Controle suas informações e a permanência da sua conta."
                  icon={Download}
                  delay={0.35}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Exportar Meus Dados</p>
                        <p className="text-xs text-muted-foreground">Baixe uma cópia completa de todos os seus dados em formato JSON.</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => exportData.mutate()}
                        disabled={exportData.isPending}
                        className="gap-2"
                      >
                        {exportData.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportar
                      </Button>
                    </div>
                    
                    <Separator className="opacity-50" />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">Zona de Perigo</p>
                        <p className="text-xs text-muted-foreground">Excluir sua conta é uma ação permanente e irreversível.</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Excluir Conta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteAccount.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, Excluir Permanentemente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </SettingsSection>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>Digite sua nova senha abaixo para atualizar o acesso.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Atualizar Senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;