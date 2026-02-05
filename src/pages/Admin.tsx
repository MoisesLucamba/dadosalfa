import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, Database, Bell, MessageSquare, BarChart3, Plus, Check, X, 
  RefreshCw, Send, Edit, Trash2, Shield, Clock, TrendingUp, 
  AlertTriangle, Globe, Eye, Mail, Crown, UserCog, Building2, 
  Settings, Cog, ChevronRight, Search, Filter, Download, Activity
} from "lucide-react";
import { 
  useIsAdmin, useIsSuperAdmin, useAllUsers, useAllUsersWithEmail, 
  useUserRequests, useDataUpdates, useUpdateUserApproval, 
  useSendNotification, useRespondToRequest, usePromoteToAdmin, 
  useDemoteFromAdmin, usePendingOrganizations, useUpdateOrganizationApproval 
} from "@/hooks/useAdmin";
import { 
  useProductionData, usePriceData, useExportData, useAddProductionData, 
  useAddPriceData, useAddExportData, useDeleteProductionData, 
  useDeletePriceData, useDeleteExportData, useUpdateProductionData, 
  useUpdatePriceData, useUpdateExportData, useLogDataUpdate 
} from "@/hooks/useData";
import { 
  useRiskData, useRiskAlerts, useCountryRisk, useRegulatoryEvents, 
  useAddRiskData, useAddRiskAlert, useAddCountryRisk, useAddRegulatoryEvent, 
  useDeleteRiskData, useDeleteRiskAlert, useDeleteCountryRisk, 
  useDeleteRegulatoryEvent, useUpdateRiskData, useUpdateRiskAlert 
} from "@/hooks/useRiskData";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { AdminManagementPanel } from "@/components/admin/AdminManagementPanel";

const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  
  const { data: users } = useAllUsers();
  const { data: usersWithRoles } = useAllUsersWithEmail();
  const { data: requests } = useUserRequests();
  const { data: dataUpdates } = useDataUpdates();
  const { data: productionData } = useProductionData();
  const { data: priceData } = usePriceData();
  const { data: exportData } = useExportData();
  const { data: riskData } = useRiskData();
  const { data: riskAlerts } = useRiskAlerts();
  const { data: countryRisk } = useCountryRisk();
  const { data: regulatoryEvents } = useRegulatoryEvents();
  const { data: organizations } = usePendingOrganizations();
  
  const updateApproval = useUpdateUserApproval();
  const updateOrgApproval = useUpdateOrganizationApproval();
  const sendNotification = useSendNotification();
  const respondToRequest = useRespondToRequest();
  const promoteToAdmin = usePromoteToAdmin();
  const demoteFromAdmin = useDemoteFromAdmin();
  const addProduction = useAddProductionData();
  const addPrice = useAddPriceData();
  const addExport = useAddExportData();
  const deleteProduction = useDeleteProductionData();
  const deletePrice = useDeletePriceData();
  const deleteExport = useDeleteExportData();
  const updateProduction = useUpdateProductionData();
  const updatePrice = useUpdatePriceData();
  const updateExport = useUpdateExportData();
  const logUpdate = useLogDataUpdate();
  const addRisk = useAddRiskData();
  const addRiskAlert = useAddRiskAlert();
  const addCountry = useAddCountryRisk();
  const addRegulatory = useAddRegulatoryEvent();
  const deleteRisk = useDeleteRiskData();
  const deleteRiskAlertMutation = useDeleteRiskAlert();
  const deleteCountry = useDeleteCountryRisk();
  const deleteRegulatory = useDeleteRegulatoryEvent();
  
  // Form states
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  const [productionForm, setProductionForm] = useState({ operator: "", block: "", field: "", daily_production: "", monthly_production: "", decline_rate: "", data_date: new Date().toISOString().split("T")[0] });
  const [priceForm, setPriceForm] = useState({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  const [exportForm, setExportForm] = useState({ destination: "", volume: "", value_usd: "", tanker_name: "", status: "in_transit", data_date: new Date().toISOString().split("T")[0] });
  const [riskForm, setRiskForm] = useState({ category: "", score: "", trend: "stable", description: "", source: "", data_date: new Date().toISOString().split("T")[0] });
  const [alertForm, setAlertForm] = useState({ title: "", description: "", alert_type: "geopolitical", region: "", impact: "medium" });
  const [countryForm, setCountryForm] = useState({ country: "", score: "", trend: "stable", data_date: new Date().toISOString().split("T")[0] });
  const [regulatoryForm, setRegulatoryForm] = useState({ title: "", description: "", event_date: "", status: "upcoming", impact_level: "medium" });
  const [responseForm, setResponseForm] = useState({ requestId: "", response: "", status: "resolved" });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editDialog, setEditDialog] = useState(false);
  
  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      navigate("/");
    }
  }, [checkingAdmin, isAdmin, navigate]);
  
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">A carregar painel...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) return null;

  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) return;
    sendNotification.mutate({
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type,
      isGlobal: notificationForm.isGlobal,
      userId: notificationForm.isGlobal ? undefined : notificationForm.userId,
    });
    setNotificationForm({ title: "", message: "", type: "info", isGlobal: true, userId: "" });
  };

  const handleAddProduction = () => {
    if (!productionForm.operator || !productionForm.block) return;
    addProduction.mutate({
      operator: productionForm.operator,
      block: productionForm.block,
      field: productionForm.field || undefined,
      daily_production: parseFloat(productionForm.daily_production) || 0,
      monthly_production: parseFloat(productionForm.monthly_production) || 0,
      decline_rate: parseFloat(productionForm.decline_rate) || 0,
      data_date: productionForm.data_date,
    });
    logUpdate.mutate({ data_type: "production", source: "Admin Manual Entry", records_updated: 1 });
    setProductionForm({ operator: "", block: "", field: "", daily_production: "", monthly_production: "", decline_rate: "", data_date: new Date().toISOString().split("T")[0] });
  };

  const handleAddPrice = () => {
    if (!priceForm.crude_type || !priceForm.price) return;
    addPrice.mutate({
      crude_type: priceForm.crude_type,
      price: parseFloat(priceForm.price),
      change_percent: parseFloat(priceForm.change_percent) || 0,
      data_date: priceForm.data_date,
    });
    logUpdate.mutate({ data_type: "price", source: "Admin Manual Entry", records_updated: 1 });
    setPriceForm({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  };

  const handleAddExport = () => {
    if (!exportForm.destination || !exportForm.volume) return;
    addExport.mutate({
      destination: exportForm.destination,
      volume: parseFloat(exportForm.volume),
      value_usd: parseFloat(exportForm.value_usd) || 0,
      tanker_name: exportForm.tanker_name || undefined,
      status: exportForm.status,
      data_date: exportForm.data_date,
    });
    logUpdate.mutate({ data_type: "export", source: "Admin Manual Entry", records_updated: 1 });
    setExportForm({ destination: "", volume: "", value_usd: "", tanker_name: "", status: "in_transit", data_date: new Date().toISOString().split("T")[0] });
  };

  const handleAddRisk = () => {
    if (!riskForm.category || !riskForm.score) return;
    addRisk.mutate({
      category: riskForm.category,
      score: parseInt(riskForm.score),
      trend: riskForm.trend,
      description: riskForm.description,
      source: riskForm.source,
      data_date: riskForm.data_date,
    });
    logUpdate.mutate({ data_type: "risk", source: "Admin Manual Entry", records_updated: 1 });
    setRiskForm({ category: "", score: "", trend: "stable", description: "", source: "", data_date: new Date().toISOString().split("T")[0] });
  };

  const handleAddAlert = () => {
    if (!alertForm.title || !alertForm.description) return;
    addRiskAlert.mutate(alertForm);
    setAlertForm({ title: "", description: "", alert_type: "geopolitical", region: "", impact: "medium" });
  };

  const handleAddCountry = () => {
    if (!countryForm.country || !countryForm.score) return;
    addCountry.mutate({
      country: countryForm.country,
      score: parseInt(countryForm.score),
      trend: countryForm.trend,
      data_date: countryForm.data_date,
    });
    setCountryForm({ country: "", score: "", trend: "stable", data_date: new Date().toISOString().split("T")[0] });
  };

  const handleAddRegulatory = () => {
    if (!regulatoryForm.title) return;
    addRegulatory.mutate(regulatoryForm);
    setRegulatoryForm({ title: "", description: "", event_date: "", status: "upcoming", impact_level: "medium" });
  };

  const handleRespondToRequest = () => {
    if (!responseForm.requestId || !responseForm.response) return;
    respondToRequest.mutate({
      requestId: responseForm.requestId,
      response: responseForm.response,
      status: responseForm.status,
    });
    setResponseForm({ requestId: "", response: "", status: "resolved" });
  };

  const handleSendUserAlert = (userId: string, userName: string) => {
    sendNotification.mutate({
      userId,
      title: "Alerta do Administrador",
      message: `Prezado(a) ${userName}, o administrador enviou um alerta para sua conta.`,
      type: "warning",
      isGlobal: false,
    });
  };

  const stats = [
    { label: "Usuários Ativos", value: users?.length || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Solicitações", value: requests?.filter(r => r.status === 'pending').length || 0, icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Alertas de Risco", value: riskAlerts?.length || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Orgs. Pendentes", value: organizations?.length || 0, icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] overflow-hidden font-sans">
      <Sidebar activeItem="/admin" />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/admin" />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 uppercase tracking-wider">
                  <Shield className="w-3 h-3" /> Painel de Administração
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Gestão do <span className="text-primary">Sistema</span></h1>
                <p className="text-muted-foreground text-sm">Controle de usuários, dados energéticos e configurações globais.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-2"><Download className="w-4 h-4" /> Exportar Logs</Button>
                <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> Novo Registro</Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden group hover:border-primary/30 transition-all">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="users" className="space-y-6">
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                <TabsList className="bg-white dark:bg-white/5 border border-border/50 p-1 rounded-2xl h-auto">
                  <TabsTrigger value="users" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Usuários</TabsTrigger>
                  <TabsTrigger value="orgs" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Organizações</TabsTrigger>
                  <TabsTrigger value="production" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Produção</TabsTrigger>
                  <TabsTrigger value="prices" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Preços</TabsTrigger>
                  <TabsTrigger value="exports" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Exportação</TabsTrigger>
                  <TabsTrigger value="risks" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Riscos</TabsTrigger>
                  <TabsTrigger value="notifications" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Notificações</TabsTrigger>
                  <TabsTrigger value="requests" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Solicitações</TabsTrigger>
                  <TabsTrigger value="logs" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Logs</TabsTrigger>
                  {isSuperAdmin && <TabsTrigger value="admins" className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-widest">Admins</TabsTrigger>}
                </TabsList>
              </div>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-black">Gestão de Usuários</CardTitle>
                        <CardDescription>Aprovação e controle de acesso à plataforma.</CardDescription>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Procurar usuário..." className="pl-9 rounded-xl bg-white dark:bg-black/20 border-border/50" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Usuário</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Status</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Função</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Data Registro</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersWithRoles?.map((user) => (
                            <TableRow key={user.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">{user.full_name?.charAt(0) || user.email?.charAt(0)}</div>
                                  <div>
                                    <p className="font-bold text-sm">{user.full_name || "Sem nome"}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border-none ${
                                  user.is_approved ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                }`}>
                                  {user.is_approved ? "Aprovado" : "Pendente"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                  {user.role === 'admin' ? <Shield className="w-3 h-3 text-primary" /> : <UserCog className="w-3 h-3 text-muted-foreground" />}
                                  <span className="capitalize">{user.role || 'User'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "N/A"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {!user.is_approved && (
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10" onClick={() => updateApproval.mutate({ userId: user.id, approved: true })}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10" onClick={() => handleSendUserAlert(user.id, user.full_name || user.email)}>
                                    <Bell className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Organizations Tab */}
              <TabsContent value="orgs" className="space-y-4">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-black">Organizações Pendentes</CardTitle>
                    <CardDescription>Validar novas entidades que solicitam acesso à plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Organização</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">NIF / Reg.</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Tipo</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Data Solicitação</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {organizations?.map((org) => (
                            <TableRow key={org.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Building2 className="w-5 h-5" /></div>
                                  <div>
                                    <p className="font-bold text-sm">{org.name}</p>
                                    <p className="text-xs text-muted-foreground">{org.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-mono">{org.registration_number || "N/A"}</TableCell>
                              <TableCell><Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-widest font-black">{org.type || "Empresa"}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{format(new Date(org.created_at), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 gap-1.5 text-xs font-bold" onClick={() => updateOrgApproval.mutate({ orgId: org.id, approved: true })}>
                                    <Check className="w-3 h-3" /> Aprovar
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 rounded-xl text-red-500 hover:bg-red-500/10 gap-1.5 text-xs font-bold" onClick={() => updateOrgApproval.mutate({ orgId: org.id, approved: false })}>
                                    <X className="w-3 h-3" /> Rejeitar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!organizations || organizations.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                <div className="flex flex-col items-center gap-2">
                                  <Building2 className="w-8 h-8 opacity-20" />
                                  <p className="text-sm font-medium">Nenhuma organização pendente de aprovação.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Production Tab */}
              <TabsContent value="production" className="space-y-4">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-black">Dados de Produção</CardTitle>
                        <CardDescription>Histórico de extração por operadora e bloco.</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" /> Adicionar Dados</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-black">Nova Produção</DialogTitle>
                            <CardDescription>Insira os dados de produção diária e mensal.</CardDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operadora</label>
                                <Input placeholder="Ex: TotalEnergies" value={productionForm.operator} onChange={(e) => setProductionForm({...productionForm, operator: e.target.value})} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bloco</label>
                                <Input placeholder="Ex: Bloco 17" value={productionForm.block} onChange={(e) => setProductionForm({...productionForm, block: e.target.value})} className="rounded-xl" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Campo (Opcional)</label>
                              <Input placeholder="Ex: Dalia" value={productionForm.field} onChange={(e) => setProductionForm({...productionForm, field: e.target.value})} className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prod. Diária (bpd)</label>
                                <Input type="number" placeholder="0" value={productionForm.daily_production} onChange={(e) => setProductionForm({...productionForm, daily_production: e.target.value})} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</label>
                                <Input type="date" value={productionForm.data_date} onChange={(e) => setProductionForm({...productionForm, data_date: e.target.value})} className="rounded-xl" />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddProduction} disabled={addProduction.isPending} className="w-full rounded-xl font-black uppercase tracking-widest py-6">Salvar Registro</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Operadora</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Bloco / Campo</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Produção Diária</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Data</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productionData?.slice(0, 15).map((item) => (
                            <TableRow key={item.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                              <TableCell className="font-bold text-sm">{item.operator}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{item.block}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.field || "N/A"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-3 h-3 text-primary" />
                                  <span className="font-mono font-bold">{Number(item.daily_production).toLocaleString()}</span>
                                  <span className="text-[10px] text-muted-foreground">bpd</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" onClick={() => deleteProduction.mutate(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prices Tab */}
              <TabsContent value="prices" className="space-y-4">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-black">Dados de Preço</CardTitle>
                        <CardDescription>Monitoramento de cotações do mercado petrolífero.</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" /> Adicionar Preço</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-black">Novo Preço</DialogTitle>
                            <CardDescription>Atualize a cotação de um tipo de crude.</CardDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Crude</label>
                              <Select value={priceForm.crude_type} onValueChange={(value) => setPriceForm({...priceForm, crude_type: value})}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Brent">Brent</SelectItem>
                                  <SelectItem value="Cabinda">Cabinda</SelectItem>
                                  <SelectItem value="Girassol">Girassol</SelectItem>
                                  <SelectItem value="Dalia">Dalia</SelectItem>
                                  <SelectItem value="Nemba">Nemba</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preço (USD)</label>
                                <Input type="number" placeholder="0.00" value={priceForm.price} onChange={(e) => setPriceForm({...priceForm, price: e.target.value})} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Variação (%)</label>
                                <Input type="number" placeholder="0.00" value={priceForm.change_percent} onChange={(e) => setPriceForm({...priceForm, change_percent: e.target.value})} className="rounded-xl" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</label>
                              <Input type="date" value={priceForm.data_date} onChange={(e) => setPriceForm({...priceForm, data_date: e.target.value})} className="rounded-xl" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddPrice} disabled={addPrice.isPending} className="w-full rounded-xl font-black uppercase tracking-widest py-6">Atualizar Cotação</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Tipo de Crude</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Preço Atual</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Variação</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Data</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {priceData?.slice(0, 15).map((item) => (
                            <TableRow key={item.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                              <TableCell className="font-bold text-sm">{item.crude_type}</TableCell>
                              <TableCell className="font-mono font-black text-lg">${Number(item.price).toFixed(2)}</TableCell>
                              <TableCell>
                                <div className={`flex items-center gap-1 font-bold text-xs ${Number(item.change_percent) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                  {Number(item.change_percent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                  {Number(item.change_percent) >= 0 ? "+" : ""}{Number(item.change_percent).toFixed(2)}%
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" onClick={() => deletePrice.mutate(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risks Tab */}
              <TabsContent value="risks" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk Indices */}
                  <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-black">Índices de Risco</CardTitle>
                        <Button size="sm" variant="outline" className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest"><Plus className="w-3 h-3 mr-1" /> Novo Índice</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50">
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3">Categoria</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3">Score</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3">Tendência</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {riskData?.slice(0, 10).map((item) => (
                            <TableRow key={item.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                              <TableCell className="capitalize text-sm font-medium">{item.category}</TableCell>
                              <TableCell>
                                <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-black border-none ${
                                  item.score > 70 ? "bg-red-500/10 text-red-500" : item.score > 40 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                                }`}>
                                  {item.score}/100
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-muted/50">
                                  {item.trend === "up" ? <TrendingUp className="w-3 h-3 text-red-500" /> : item.trend === "down" ? <TrendingUp className="w-3 h-3 text-emerald-500 rotate-180" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10" onClick={() => deleteRisk.mutate(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Risk Alerts */}
                  <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-black">Alertas Ativos</CardTitle>
                        <Button size="sm" variant="outline" className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest"><Plus className="w-3 h-3 mr-1" /> Novo Alerta</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {riskAlerts?.slice(0, 5).map((alert) => (
                          <div key={alert.id} className="flex items-start justify-between p-4 rounded-2xl border border-border/50 bg-muted/20 group hover:border-primary/30 transition-all">
                            <div className="flex gap-3">
                              <div className={`p-2 rounded-xl ${alert.impact === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{alert.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{alert.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="rounded-full text-[9px] uppercase tracking-widest font-black py-0 px-2">{alert.region || "Global"}</Badge>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{alert.impact} Impacto</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteRiskAlertMutation.mutate(alert.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="max-w-2xl mx-auto">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-2xl rounded-[2rem] overflow-hidden">
                  <CardHeader className="p-8 bg-primary/5 border-b border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Bell className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black">Enviar Notificação</CardTitle>
                        <CardDescription>Comunique-se com todos os usuários ou indivíduos específicos.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título da Mensagem</label>
                      <Input placeholder="Ex: Manutenção do Sistema" value={notificationForm.title} onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})} className="rounded-xl py-6" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conteúdo</label>
                      <Textarea placeholder="Digite a mensagem detalhada aqui..." rows={4} value={notificationForm.message} onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})} className="rounded-2xl resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Alerta</label>
                        <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}>
                          <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Informação</SelectItem>
                            <SelectItem value="warning">Aviso</SelectItem>
                            <SelectItem value="alert">Crítico</SelectItem>
                            <SelectItem value="success">Sucesso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destinatários</label>
                        <Select value={notificationForm.isGlobal ? "global" : "specific"} onValueChange={(value) => setNotificationForm({...notificationForm, isGlobal: value === "global"})}>
                          <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Todos os Usuários</SelectItem>
                            <SelectItem value="specific">Usuário Específico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleSendNotification} disabled={sendNotification.isPending} className="w-full rounded-xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2">
                      <Send className="h-4 w-4" /> Disparar Notificação
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests?.map((request) => (
                    <Card key={request.id} className="bg-white dark:bg-white/5 border-border/50 shadow-sm hover:border-primary/30 transition-all overflow-hidden flex flex-col">
                      <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className={`rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-widest border-none ${
                            request.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {request.status === 'pending' ? 'Pendente' : 'Resolvido'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(request.created_at), "dd/MM HH:mm")}</span>
                        </div>
                        <CardTitle className="text-sm font-bold mt-3 line-clamp-1">{request.subject}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 flex-1">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{request.message}</p>
                        {request.admin_response && (
                          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Resposta Admin</p>
                            <p className="text-xs text-foreground italic">"{request.admin_response}"</p>
                          </div>
                        )}
                      </CardContent>
                      {request.status === "pending" && (
                        <div className="p-5 pt-0 mt-auto">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="w-full rounded-xl text-xs font-bold gap-2">Responder <ChevronRight className="w-3 h-3" /></Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f]">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-black">Responder Solicitação</DialogTitle>
                                <CardDescription>Assunto: {request.subject}</CardDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                  <p className="text-xs text-foreground">{request.message}</p>
                                </div>
                                <Textarea 
                                  placeholder="Digite sua resposta oficial..." 
                                  className="rounded-2xl min-h-[120px]"
                                  value={responseForm.requestId === request.id ? responseForm.response : ""} 
                                  onChange={(e) => setResponseForm({...responseForm, requestId: request.id, response: e.target.value})} 
                                />
                              </div>
                              <DialogFooter>
                                <Button onClick={handleRespondToRequest} disabled={!responseForm.response} className="w-full rounded-xl py-6 font-black uppercase tracking-widest">Enviar Resposta</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </Card>
                  ))}
                  {(!requests || requests.length === 0) && (
                    <div className="col-span-full py-20 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto opacity-10 mb-4" />
                      <p className="text-muted-foreground font-medium">Nenhuma solicitação de suporte encontrada.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-4">
                <Card className="bg-white dark:bg-white/5 border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-black">Histórico de Atividade</CardTitle>
                    <CardDescription>Rastreamento de todas as alterações de dados no sistema.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {dataUpdates?.map((update) => (
                        <div key={update.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Database className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold capitalize">{update.data_type} <span className="text-muted-foreground font-normal">atualizado</span></p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{update.source}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="rounded-full text-[10px] font-black px-2 py-0 mb-1">+{update.records_updated} registros</Badge>
                            <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(update.created_at), "dd/MM/yyyy HH:mm")}</p>
                          </div>
                        </div>
                      ))}
                      {(!dataUpdates || dataUpdates.length === 0) && (
                        <div className="py-12 text-center text-muted-foreground">Nenhum log de atividade registrado.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

export default Admin;