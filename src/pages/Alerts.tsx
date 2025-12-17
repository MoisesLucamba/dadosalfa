import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, AlertTriangle, TrendingUp, TrendingDown, Ship, Globe, Plus, Settings, Trash2, Check, X } from "lucide-react";

const Alerts = () => {

  const notifications = [
    { id: 1, type: "price", title: "Brent abaixo de $70", message: "O preço do Brent caiu para $69.45, abaixo do limite configurado de $70.", time: "Há 2 horas", read: false, severity: "high" },
    { id: 2, type: "production", title: "Queda na produção do Bloco 17", message: "Produção do Bloco 17 reduziu 15% em relação ao mês anterior.", time: "Há 5 horas", read: false, severity: "medium" },
    { id: 3, type: "export", title: "Atraso no embarque", message: "Navio MT Angola Star com atraso de 48h no Terminal de Soyo.", time: "Há 1 dia", read: true, severity: "low" },
    { id: 4, type: "geopolitical", title: "Decisão OPEP+", message: "OPEP+ anuncia corte adicional de 500k barris/dia a partir de janeiro.", time: "Há 2 dias", read: true, severity: "high" },
    { id: 5, type: "price", title: "Spread Cabinda-Brent", message: "Spread atingiu $2.50, maior valor em 6 meses.", time: "Há 3 dias", read: true, severity: "medium" },
  ];

  const alertTriggers = [
    { id: 1, name: "Preço Brent < $70", type: "price", condition: "menor que", value: "70", unit: "USD", enabled: true, channel: ["email", "app"] },
    { id: 2, name: "Preço Brent > $85", type: "price", condition: "maior que", value: "85", unit: "USD", enabled: true, channel: ["email"] },
    { id: 3, name: "Variação Produção > 10%", type: "production", condition: "variação maior que", value: "10", unit: "%", enabled: true, channel: ["app"] },
    { id: 4, name: "Atraso Embarque > 24h", type: "export", condition: "atraso maior que", value: "24", unit: "horas", enabled: false, channel: ["email", "whatsapp"] },
    { id: 5, name: "Novo comunicado OPEP+", type: "geopolitical", condition: "qualquer", value: "-", unit: "-", enabled: true, channel: ["email", "app", "whatsapp"] },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "price": return <TrendingUp className="h-4 w-4" />;
      case "production": return <TrendingDown className="h-4 w-4" />;
      case "export": return <Ship className="h-4 w-4" />;
      case "geopolitical": return <Globe className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
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
                    <p className="text-lg sm:text-2xl font-bold text-foreground">12</p>
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
                    <p className="text-lg sm:text-2xl font-bold text-foreground">3</p>
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
                    <p className="text-lg sm:text-2xl font-bold text-foreground">5</p>
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
                    <p className="text-lg sm:text-2xl font-bold text-foreground">8</p>
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
                  <Button variant="outline" size="sm" className="text-xs">
                    Marcar todas como lidas
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all ${
                      notification.read 
                        ? "bg-muted/30 border-border" 
                        : "bg-primary/5 border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h4 className="font-medium text-sm text-foreground truncate">{notification.title}</h4>
                          <Badge className={`text-[10px] w-fit ${getSeverityColor(notification.severity)}`}>
                            {notification.severity === "high" ? "Alta" : notification.severity === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
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
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Novo Gatilho
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {alertTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${getTypeColor(trigger.type)}`}>
                          {getIcon(trigger.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">{trigger.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {trigger.condition} {trigger.value !== "-" && `${trigger.value} ${trigger.unit}`}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {trigger.channel.map((ch) => (
                              <Badge key={ch} variant="outline" className="text-[10px] capitalize">
                                {ch}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={trigger.enabled} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <Select>
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
                  <label className="text-xs font-medium text-muted-foreground">Condição</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater">Maior que</SelectItem>
                      <SelectItem value="less">Menor que</SelectItem>
                      <SelectItem value="change">Variação maior que</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Valor</label>
                  <Input type="number" placeholder="Ex: 70" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Canal de Notificação</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">App</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Gatilho
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
