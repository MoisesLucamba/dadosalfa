import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile, useUpdateProfile, useUpdateNotificationSettings, useUserNotificationSettings, useChangePassword, useExportUserData, useDeleteAccount } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Bell, Shield, User, Building2, Key, Smartphone, Globe, Download, Trash2 } from "lucide-react";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { data: notificationSettings } = useUserNotificationSettings();
  const updateProfile = useUpdateProfile();
  const updateNotifications = useUpdateNotificationSettings();
  const changePassword = useChangePassword();
  const exportData = useExportUserData();
  const deleteAccount = useDeleteAccount();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    contact_name: "",
    contact_phone: "",
    contact_role: "",
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    nif: "",
    country: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Load profile data into forms
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

  // Load notification settings
  useEffect(() => {
    if (notificationSettings) {
      const emailSetting = notificationSettings.find(s => s.alert_type === "email_alerts");
      const priceSetting = notificationSettings.find(s => s.alert_type === "price_alerts");
      const weeklySetting = notificationSettings.find(s => s.alert_type === "weekly_reports");
      const whatsappSetting = notificationSettings.find(s => s.alert_type === "whatsapp_alerts");
      
      if (emailSetting) setEmailAlerts(emailSetting.is_enabled ?? true);
      if (priceSetting) setPriceAlerts(priceSetting.is_enabled ?? true);
      if (weeklySetting) setWeeklyReports(weeklySetting.is_enabled ?? false);
      if (whatsappSetting) setWhatsappAlerts(whatsappSetting.is_enabled ?? false);
    }
  }, [notificationSettings]);

  const handleSaveProfile = () => {
    updateProfile.mutate(profileForm);
  };

  const handleSaveCompany = () => {
    updateProfile.mutate(companyForm);
  };

  const handleNotificationChange = (alertType: string, isEnabled: boolean) => {
    updateNotifications.mutate({ 
      alertType, 
      settings: { is_enabled: isEnabled } 
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    changePassword.mutate({ newPassword: passwordForm.newPassword }, {
      onSuccess: () => {
        setPasswordDialogOpen(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    });
  };

  const handleExportData = () => {
    exportData.mutate();
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate();
  };

  if (loadingProfile) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configurações | AlphaData</title>
        <meta name="description" content="Configurações da plataforma AlphaData" />
      </Helmet>

      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeItem="/settings" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header activeItem="/settings" />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8"
              >
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Configurações</h1>
                <p className="text-sm md:text-base text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
              </motion.div>

              {/* Theme Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      Aparência
                    </CardTitle>
                    <CardDescription>Personalize a aparência da plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Modo Escuro</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Alternar entre tema claro e escuro
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-muted-foreground" />
                        <Switch
                          checked={theme === "dark"}
                          onCheckedChange={toggleTheme}
                        />
                        <Moon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Bell className="w-5 h-5" />
                      Notificações
                    </CardTitle>
                    <CardDescription>Configure como deseja receber alertas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Alertas por Email</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Receber notificações importantes por email
                        </p>
                      </div>
                      <Switch 
                        checked={emailAlerts} 
                        onCheckedChange={(checked) => {
                          setEmailAlerts(checked);
                          handleNotificationChange("email_alerts", checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Alertas de Preço</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Notificar sobre mudanças significativas nos preços
                        </p>
                      </div>
                      <Switch 
                        checked={priceAlerts} 
                        onCheckedChange={(checked) => {
                          setPriceAlerts(checked);
                          handleNotificationChange("price_alerts", checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Relatórios Semanais</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Receber resumo semanal por email
                        </p>
                      </div>
                      <Switch 
                        checked={weeklyReports} 
                        onCheckedChange={(checked) => {
                          setWeeklyReports(checked);
                          handleNotificationChange("weekly_reports", checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">WhatsApp Business</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Receber alertas via WhatsApp
                        </p>
                      </div>
                      <Switch 
                        checked={whatsappAlerts} 
                        onCheckedChange={(checked) => {
                          setWhatsappAlerts(checked);
                          handleNotificationChange("whatsapp_alerts", checked);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Profile Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <User className="w-5 h-5" />
                      Perfil
                    </CardTitle>
                    <CardDescription>Informações da sua conta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input 
                            id="name" 
                            placeholder="Seu nome" 
                            value={profileForm.contact_name}
                            onChange={(e) => setProfileForm({ ...profileForm, contact_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input 
                            id="phone" 
                            placeholder="+244 XXX XXX XXX" 
                            value={profileForm.contact_phone}
                            onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Cargo</Label>
                        <Input 
                          id="role" 
                          placeholder="Seu cargo" 
                          value={profileForm.contact_role}
                          onChange={(e) => setProfileForm({ ...profileForm, contact_role: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full sm:w-auto" 
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Company Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Building2 className="w-5 h-5" />
                      Empresa
                    </CardTitle>
                    <CardDescription>Dados da organização</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Nome da Empresa</Label>
                        <Input 
                          id="company" 
                          placeholder="Nome da empresa" 
                          value={companyForm.company_name}
                          onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nif">NIF</Label>
                          <Input 
                            id="nif" 
                            placeholder="Número de Identificação Fiscal" 
                            value={companyForm.nif}
                            onChange={(e) => setCompanyForm({ ...companyForm, nif: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">País</Label>
                          <Input 
                            id="country" 
                            value={companyForm.country}
                            onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full sm:w-auto"
                      onClick={handleSaveCompany}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Dados da Empresa
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Shield className="w-5 h-5" />
                      Segurança
                    </CardTitle>
                    <CardDescription>Configurações de segurança da conta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Alterar Senha
                        </Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Atualizar sua senha de acesso
                        </p>
                      </div>
                      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Alterar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Senha</DialogTitle>
                            <DialogDescription>
                              Digite sua nova senha abaixo.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">Nova Senha</Label>
                              <Input 
                                id="newPassword" 
                                type="password" 
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                              <Input 
                                id="confirmPassword" 
                                type="password" 
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleChangePassword}
                              disabled={changePassword.isPending}
                            >
                              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Salvar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Autenticação em Dois Fatores
                        </Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Adicionar camada extra de segurança
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Em breve
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Sessões Ativas
                        </Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Ver e gerenciar dispositivos conectados
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Em breve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data & Export */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Download className="w-5 h-5" />
                      Dados
                    </CardTitle>
                    <CardDescription>Exportação e gerenciamento de dados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Exportar Dados</Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Baixar todos os seus dados em formato JSON
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleExportData}
                        disabled={exportData.isPending}
                      >
                        {exportData.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Exportar
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-destructive flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Excluir Conta
                        </Label>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Remover permanentemente sua conta e dados
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Excluir</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount}>
                              Excluir Conta
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Settings;
