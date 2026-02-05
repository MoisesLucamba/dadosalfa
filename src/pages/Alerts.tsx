import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, AlertTriangle, TrendingUp, TrendingDown, Ship, Globe, 
  Plus, Settings, Trash2, Check, Info, Mail, Smartphone, 
  Clock, Filter, Search, ChevronRight, Activity
} from "lucide-react";
import { 
  useNotifications, useUserAlerts, useAddUserAlert, 
  useUpdateUserAlert, useDeleteUserAlert, useMarkNotificationRead 
} from "@/hooks/useData";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
      case "production": return <Activity className="h-4 w-4" />;
      case "export": return <Ship className="h-4 w-4" />;
      case "geopolitical": return <Globe className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case "alert": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warning": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "info": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted/50 text-muted-foreground border-border/50";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "price": return "bg-emerald-500/10 text-emerald-500";
      case "production": return "bg-blue-500/10 text-blue-500";
      case "export": return "bg-purple-500/10 text-purple-500";
      case "geopolitical": return "bg-amber-500/10 text-amber-500";
      default: return "bg-muted/50 text-muted-foreground";
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

  const stats = [
    { label: "Não Lidas", value: unreadCount, icon: Bell, color: "text-primary", bg: "bg-primary/10" },
    { label: "Alta Prioridade", value: notifications?.filter(n => n.type === "alert").length || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Gatilhos Ativos", value: activeTriggersCount, icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Gatilhos", value: userAlerts?.length || 0, icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] overflow-hidden font-sans">
      <Sidebar activeItem="/alerts" />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/alerts" />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 uppercase tracking-wider">
                  <Bell className="w-3 h-3" /> Central de Inteligência
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Gestão de <span className="text-primary">Alertas</span></h1>
                <p className="text-muted-foreground text-sm">Configure gatilhos automáticos e monitorize notificações críticas.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-2"><Filter className="w-4 h-4" /> Filtrar</Button>
                <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20"><Check className="w-4 h-4" /> Marcar todas como lidas</Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden group hover:border-primary/30 transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Notifications List */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Notificações Recentes
                  </h2>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Procurar..." className="pl-9 h-8 rounded-lg bg-white dark:bg-white/5 border-border/50 text-xs" />
                  </div>
                </div>

                <div className="space-y-3">
                  {loadingNotifications ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-white dark:bg-white/5 border border-border/50 animate-pulse" />
                      ))}
                    </div>
                  ) : notifications && notifications.length > 0 ? (
                    <AnimatePresence>
                      {notifications.map((notification, i) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`group p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${
                            notification.is_read 
                              ? "bg-white dark:bg-white/5 border-border/50 opacity-70" 
                              : "bg-white dark:bg-primary/5 border-primary/20 shadow-md"
                          }`}
                          onClick={() => !notification.is_read && markRead.mutate(notification.id)}
                        >
                          {!notification.is_read && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          )}
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${getSeverityColor(notification.type || "info")}`}>
                              {notification.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
                                  <Badge className={`rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-widest border-none ${getSeverityColor(notification.type || "info")}`}>
                                    {notification.type === "alert" ? "Crítico" : notification.type === "warning" ? "Aviso" : "Info"}
                                  </Badge>
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {format(new Date(notification.created_at), "dd MMM, HH:mm", { locale: pt })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-medium">{notification.message}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-[2rem] p-12 text-center">
                      <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
                        <Check className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold">Tudo em dia!</h3>
                      <p className="text-sm text-muted-foreground">Não existem novas notificações para apresentar.</p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Sidebar: Triggers & New Form */}
              <div className="space-y-8">
                {/* Alert Triggers */}
                <div className="space-y-4">
                  <h2 className="text-lg font-black flex items-center gap-2 px-2">
                    <Settings className="w-5 h-5 text-primary" /> Gatilhos Ativos
                  </h2>
                  <div className="space-y-3">
                    {loadingAlerts ? (
                      <div className="h-40 rounded-2xl bg-white dark:bg-white/5 border border-border/50 animate-pulse" />
                    ) : userAlerts && userAlerts.length > 0 ? (
                      userAlerts.map((trigger) => (
                        <Card key={trigger.id} className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm hover:border-primary/20 transition-all overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2.5 rounded-xl ${getTypeColor(trigger.alert_type)}`}>
                                  {getIcon(trigger.alert_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-sm text-foreground capitalize">{trigger.alert_type}</h4>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                                    {trigger.threshold_value ? `Limite: ${trigger.threshold_value}` : "Qualquer variação"}
                                  </p>
                                  <div className="flex gap-1.5 mt-2">
                                    {trigger.notify_email && <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest rounded-md py-0 px-1.5 border-border/50"><Mail className="w-2.5 h-2.5 mr-1" /> Email</Badge>}
                                    {trigger.notify_app && <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest rounded-md py-0 px-1.5 border-border/50"><Smartphone className="w-2.5 h-2.5 mr-1" /> App</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <Switch 
                                  checked={trigger.is_enabled}
                                  onCheckedChange={(checked) => updateAlert.mutate({ id: trigger.id, is_enabled: checked })}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => deleteAlert.mutate(trigger.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="p-8 text-center border border-dashed border-border/50 rounded-2xl">
                        <p className="text-xs text-muted-foreground font-medium">Nenhum gatilho configurado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Trigger Form */}
                <Card className="bg-white dark:bg-white/5 border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-border/50 p-6">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" /> Novo Gatilho
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Configure monitorização automática</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Alerta</label>
                      <Select 
                        value={newTrigger.alert_type} 
                        onValueChange={(value) => setNewTrigger({...newTrigger, alert_type: value})}
                      >
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Preço do Crude</SelectItem>
                          <SelectItem value="production">Volume de Produção</SelectItem>
                          <SelectItem value="export">Fluxo de Exportação</SelectItem>
                          <SelectItem value="geopolitical">Risco Geopolítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Limite (Threshold)</label>
                      <Input 
                        type="number" 
                        placeholder="Ex: 85.50" 
                        value={newTrigger.threshold_value}
                        onChange={(e) => setNewTrigger({...newTrigger, threshold_value: e.target.value})}
                        className="rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Canais de Notificação</label>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold">Email</span>
                        </div>
                        <Switch 
                          checked={newTrigger.notify_email}
                          onCheckedChange={(checked) => setNewTrigger({...newTrigger, notify_email: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold">App Push</span>
                        </div>
                        <Switch 
                          checked={newTrigger.notify_app}
                          onCheckedChange={(checked) => setNewTrigger({...newTrigger, notify_app: checked})}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateTrigger} 
                      className="w-full rounded-xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
                      disabled={!newTrigger.alert_type || addAlert.isPending}
                    >
                      {addAlert.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="h-4 h-4" />}
                      Ativar Gatilho
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Alerts;