import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Globe, 
  Bell, 
  RefreshCw, 
  Power,
  Clock,
  Shield,
  Zap,
  Server
} from "lucide-react";
import { useSystemSettings, useUpdateSystemSetting, useTriggerSync, useCronJobs } from "@/hooks/useSystemSettings";
import { useState } from "react";
import { toast } from "sonner";

export function SystemSettingsPanel() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const triggerSync = useTriggerSync();
  const { data: cronJobs } = useCronJobs();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleToggleApi = (apiKey: string, enabled: boolean) => {
    if (!settings?.api_config) return;

    const newConfig = {
      ...settings.api_config,
      [apiKey]: {
        ...settings.api_config[apiKey as keyof typeof settings.api_config],
        enabled,
      },
    };

    updateSetting.mutate({
      settingKey: "api_config",
      settingValue: newConfig,
    });
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    if (!settings?.api_config) return;

    const newConfig = {
      ...settings.api_config,
      auto_sync: {
        ...settings.api_config.auto_sync,
        enabled,
      },
    };

    updateSetting.mutate({
      settingKey: "api_config",
      settingValue: newConfig,
    });
  };

  const handleTogglePlatformSetting = (key: string, value: boolean) => {
    if (!settings?.platform_config) return;

    const newConfig = {
      ...settings.platform_config,
      [key]: value,
    };

    updateSetting.mutate({
      settingKey: "platform_config",
      settingValue: newConfig,
    });
  };

  const handleToggleNotificationSetting = (key: string, value: boolean) => {
    if (!settings?.notification_config) return;

    const newConfig = {
      ...settings.notification_config,
      [key]: value,
    };

    updateSetting.mutate({
      settingKey: "notification_config",
      settingValue: newConfig,
    });
  };

  const handleManualSync = async (syncType: 'all' | 'prices' | 'production' | 'exports' | 'risks') => {
    setSyncing(syncType);
    try {
      await triggerSync.mutateAsync(syncType);
    } finally {
      setSyncing(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const apiConfig = settings?.api_config;
  const platformConfig = settings?.platform_config;
  const notificationConfig = settings?.notification_config;

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Configuração de APIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Oil Price API */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Zap className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium">Oil Price API</p>
                <p className="text-xs text-muted-foreground">Preços em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={apiConfig?.oil_price_api?.enabled ? "default" : "secondary"}>
                {apiConfig?.oil_price_api?.enabled ? "Activo" : "Inactivo"}
              </Badge>
              <Switch
                checked={apiConfig?.oil_price_api?.enabled ?? true}
                onCheckedChange={(checked) => handleToggleApi("oil_price_api", checked)}
              />
            </div>
          </div>

          {/* EIA API */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Globe className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium">EIA API</p>
                <p className="text-xs text-muted-foreground">U.S. Energy Information Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={apiConfig?.eia_api?.enabled ? "default" : "secondary"}>
                {apiConfig?.eia_api?.enabled ? "Activo" : "Inactivo"}
              </Badge>
              <Switch
                checked={apiConfig?.eia_api?.enabled ?? true}
                onCheckedChange={(checked) => handleToggleApi("eia_api", checked)}
              />
            </div>
          </div>

          {/* FRED API */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Server className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="font-medium">FRED API</p>
                <p className="text-xs text-muted-foreground">Federal Reserve Economic Data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={apiConfig?.fred_api?.enabled ? "default" : "secondary"}>
                {apiConfig?.fred_api?.enabled ? "Activo" : "Inactivo"}
              </Badge>
              <Switch
                checked={apiConfig?.fred_api?.enabled ?? true}
                onCheckedChange={(checked) => handleToggleApi("fred_api", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Auto Sync */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Sincronização Automática</p>
                <p className="text-xs text-muted-foreground">Diariamente às 6:00 UTC</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={apiConfig?.auto_sync?.enabled ? "default" : "secondary"}>
                {apiConfig?.auto_sync?.enabled ? "Activo" : "Inactivo"}
              </Badge>
              <Switch
                checked={apiConfig?.auto_sync?.enabled ?? true}
                onCheckedChange={handleToggleAutoSync}
              />
            </div>
          </div>

          {/* Manual Sync Buttons */}
          <div className="pt-2">
            <p className="text-sm font-medium mb-3">Sincronização Manual</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualSync('all')}
                disabled={syncing !== null}
              >
                {syncing === 'all' ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Todos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualSync('prices')}
                disabled={syncing !== null}
              >
                {syncing === 'prices' ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : null}
                Preços
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualSync('production')}
                disabled={syncing !== null}
              >
                {syncing === 'production' ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : null}
                Produção
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualSync('exports')}
                disabled={syncing !== null}
              >
                {syncing === 'exports' ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : null}
                Exportações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Modo de Manutenção</p>
              <p className="text-xs text-muted-foreground">Desativa o acesso de utilizadores</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={platformConfig?.maintenance_mode ? "destructive" : "secondary"}>
                {platformConfig?.maintenance_mode ? "Activo" : "Inactivo"}
              </Badge>
              <Switch
                checked={platformConfig?.maintenance_mode ?? false}
                onCheckedChange={(checked) => handleTogglePlatformSetting("maintenance_mode", checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Permitir Registos</p>
              <p className="text-xs text-muted-foreground">Novos utilizadores podem criar conta</p>
            </div>
            <Switch
              checked={platformConfig?.allow_signups ?? true}
              onCheckedChange={(checked) => handleTogglePlatformSetting("allow_signups", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Aprovação Obrigatória</p>
              <p className="text-xs text-muted-foreground">Novos utilizadores precisam de aprovação</p>
            </div>
            <Switch
              checked={platformConfig?.require_approval ?? true}
              onCheckedChange={(checked) => handleTogglePlatformSetting("require_approval", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Configurações de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-xs text-muted-foreground">Enviar emails de notificação</p>
            </div>
            <Switch
              checked={notificationConfig?.email_notifications ?? true}
              onCheckedChange={(checked) => handleToggleNotificationSetting("email_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Alertas de Sincronização</p>
              <p className="text-xs text-muted-foreground">Notificar sobre falhas de sync</p>
            </div>
            <Switch
              checked={notificationConfig?.sync_alerts ?? true}
              onCheckedChange={(checked) => handleToggleNotificationSetting("sync_alerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Alertas de Preços</p>
              <p className="text-xs text-muted-foreground">Notificar sobre variações significativas</p>
            </div>
            <Switch
              checked={notificationConfig?.price_alerts ?? true}
              onCheckedChange={(checked) => handleToggleNotificationSetting("price_alerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cron Jobs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Tarefas Agendadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cronJobs?.map((job) => (
            <div key={job.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">{job.name}</p>
                <p className="text-xs text-muted-foreground">{job.description}</p>
                <p className="text-xs text-primary font-mono mt-1">{job.schedule}</p>
              </div>
              <Badge variant={job.active ? "default" : "secondary"}>
                {job.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
