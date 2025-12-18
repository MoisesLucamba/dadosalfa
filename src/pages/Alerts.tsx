import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, AlertTriangle, TrendingUp, TrendingDown, Ship, Globe, Plus, Settings, Trash2, Check } from "lucide-react";
import { useNotifications, useUserAlerts, useAddUserAlert, useUpdateUserAlert, useDeleteUserAlert, useMarkNotificationRead } from "@/hooks/useData";
import { format } from "date-fns";

const Alerts = () => {
  const { data: notifications, isLoading: loadingNotifications } = useNotifications();
  const { data: userAlerts, isLoading: loadingAlerts } = useUserAlerts();
  const addAlert = useAddUserAlert();
  const updateAlert = useUpdateUserAlert();
  const deleteAlert = useDeleteUserAlert();
  const markRead = useMarkNotificationRead();

  const [newTrigger, setNewTrigger] = useState({
    alert_type: "",
    threshold_value: "",
    notify_email: true,
    notify_app: true,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "price": return <TrendingUp className="h-4 w-4" />;
      case "production": return <TrendingDown className="h-4 w-4" />;
      case "export": return <Ship className="h-4 w-4" />;
      case "geopolitical": return <Globe className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case "alert": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "info": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "price": return "bg-emerald-500/20 text-emerald-400";
      case "production": return "bg-blue-500/20 text-blue-400";
      case "export": return "bg-purple-500/20 text-purple-400";
      case "geopolitical": return "bg-amber-500/20 text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCreateTrigger = () => {
    if (!newTrigger.alert_type) return;
    addAlert.mutate({
      alert_type: newTrigger.alert_type,
      threshold_value: parseFloat(newTrigger.threshold_value) || undefined,
      notify_email: newTrigger.notify_email,
      notify_app: newTrigger.notify_app,
    });
    setNewTrigger({ alert_type: "", threshold_value: "", notify_email: true, notify_app: true });
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const activeTriggersCount = userAlerts?.filter(a => a.is_enabled).length || 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/alerts" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/alerts" />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Central de Alertas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie notificações e configure gatilhos de alerta</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{unreadCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Não lidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      {notifications?.filter(n => n.type === "alert").length || 0}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Alta prioridade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{activeTriggersCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Gatilhos ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{userAlerts?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total gatilhos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Notifications */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Notificações Recentes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {loadingNotifications ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
                        notification.is_read 
                          ? "bg-muted/30 border-border" 
                          : "bg-primary/5 border-primary/30"
                      }`}
                      onClick={() => !notification.is_read && markRead.mutate(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(notification.type || "info")}`}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-sm text-foreground truncate">{notification.title}</h4>
                            <Badge className={`text-[10px] w-fit ${getSeverityColor(notification.type || "info")}`}>
                              {notification.type === "alert" ? "Alta" : notification.type === "warning" ? "Média" : "Info"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma notificação</p>
                )}
              </CardContent>
            </Card>

            {/* Alert Triggers */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Gatilhos de Alerta
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {loadingAlerts ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : userAlerts && userAlerts.length > 0 ? (
                  userAlerts.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${getTypeColor(trigger.alert_type)}`}>
                            {getIcon(trigger.alert_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground truncate capitalize">{trigger.alert_type}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {trigger.threshold_value ? `Valor: ${trigger.threshold_value}` : "Qualquer alteração"}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {trigger.notify_email && (
                                <Badge variant="outline" className="text-[10px] capitalize">email</Badge>
                              )}
                              {trigger.notify_app && (
                                <Badge variant="outline" className="text-[10px] capitalize">app</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={trigger.is_enabled || false}
                            onCheckedChange={(checked) => updateAlert.mutate({ id: trigger.id, is_enabled: checked })}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteAlert.mutate(trigger.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum gatilho configurado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* New Trigger Form */}
          <Card className="bg-card border-border mt-4 sm:mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-foreground">Criar Novo Gatilho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Alerta</label>
                  <Select 
                    value={newTrigger.alert_type} 
                    onValueChange={(value) => setNewTrigger({...newTrigger, alert_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Preço</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                      <SelectItem value="export">Exportação</SelectItem>
                      <SelectItem value="geopolitical">Geopolítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Valor Limite</label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 70" 
                    value={newTrigger.threshold_value}
                    onChange={(e) => setNewTrigger({...newTrigger, threshold_value: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Notificar por</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Switch 
                        checked={newTrigger.notify_email}
                        onCheckedChange={(checked) => setNewTrigger({...newTrigger, notify_email: checked})}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch 
                        checked={newTrigger.notify_app}
                        onCheckedChange={(checked) => setNewTrigger({...newTrigger, notify_app: checked})}
                      />
                      <span className="text-sm">App</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateTrigger} 
                    className="bg-primary hover:bg-primary/90 w-full"
                    disabled={!newTrigger.alert_type || addAlert.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Gatilho
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
