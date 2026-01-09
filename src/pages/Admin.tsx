import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Database, Bell, MessageSquare, BarChart3, Plus, Check, X, RefreshCw, Send, Edit, Trash2, Shield, Clock, TrendingUp, AlertTriangle, Globe, Eye, Mail, Crown, UserCog, Building2, Settings, Cog } from "lucide-react";
import { useIsAdmin, useIsSuperAdmin, useAllUsers, useAllUsersWithEmail, useUserRequests, useDataUpdates, useUpdateUserApproval, useSendNotification, useRespondToRequest, usePromoteToAdmin, useDemoteFromAdmin, usePendingOrganizations, useUpdateOrganizationApproval } from "@/hooks/useAdmin";
import { useProductionData, usePriceData, useExportData, useAddProductionData, useAddPriceData, useAddExportData, useDeleteProductionData, useDeletePriceData, useDeleteExportData, useUpdateProductionData, useUpdatePriceData, useUpdateExportData, useLogDataUpdate } from "@/hooks/useData";
import { useRiskData, useRiskAlerts, useCountryRisk, useRegulatoryEvents, useAddRiskData, useAddRiskAlert, useAddCountryRisk, useAddRegulatoryEvent, useDeleteRiskData, useDeleteRiskAlert, useDeleteCountryRisk, useDeleteRegulatoryEvent, useUpdateRiskData, useUpdateRiskAlert } from "@/hooks/useRiskData";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/admin" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/admin" />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel Administrativo</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie dados, usuários, riscos e notificações da plataforma</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{users?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Usuários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{users?.filter(u => !u.is_approved).length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Usuários Pend.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{organizations?.filter(o => !o.is_approved).length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Orgs Pend.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{productionData?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Produção</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{priceData?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Preços</p>
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
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{riskAlerts?.filter(a => a.is_active).length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Alertas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{countryRisk?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Países</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-muted/50 flex-wrap h-auto p-1">
              {isSuperAdmin && (
                <TabsTrigger value="system" className="text-xs sm:text-sm"><Cog className="h-4 w-4 mr-1" />Sistema</TabsTrigger>
              )}
              <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
              <TabsTrigger value="organizations" className="text-xs sm:text-sm"><Building2 className="h-4 w-4 mr-1" />Organizações</TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="admins" className="text-xs sm:text-sm"><Crown className="h-4 w-4 mr-1" />Administradores</TabsTrigger>
              )}
              <TabsTrigger value="production" className="text-xs sm:text-sm"><BarChart3 className="h-4 w-4 mr-1" />Produção</TabsTrigger>
              <TabsTrigger value="prices" className="text-xs sm:text-sm"><TrendingUp className="h-4 w-4 mr-1" />Preços</TabsTrigger>
              <TabsTrigger value="exports" className="text-xs sm:text-sm"><Globe className="h-4 w-4 mr-1" />Exportações</TabsTrigger>
              <TabsTrigger value="risks" className="text-xs sm:text-sm"><AlertTriangle className="h-4 w-4 mr-1" />Riscos</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
              <TabsTrigger value="requests" className="text-xs sm:text-sm"><MessageSquare className="h-4 w-4 mr-1" />Solicitações</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs sm:text-sm"><Database className="h-4 w-4 mr-1" />Logs</TabsTrigger>
            </TabsList>

            {/* System Settings Tab - Super Admin Only */}
            {isSuperAdmin && (
              <TabsContent value="system">
                <SystemSettingsPanel />
              </TabsContent>
            )}

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gerenciamento de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>País</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.company_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{user.company_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{user.contact_name}</p>
                                <p className="text-xs text-muted-foreground">{user.contact_role}</p>
                              </div>
                            </TableCell>
                            <TableCell>{user.country}</TableCell>
                            <TableCell>
                              <Badge className={user.is_approved ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>
                                {user.is_approved ? "Aprovado" : "Pendente"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!user.is_approved ? (
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => updateApproval.mutate({ userId: user.id, isApproved: true })}>
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => updateApproval.mutate({ userId: user.id, isApproved: false })}>
                                    <X className="h-4 w-4 text-red-400" />
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" className="h-8" onClick={() => handleSendUserAlert(user.id, user.contact_name)}>
                                  <Bell className="h-4 w-4 text-amber-400" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8">
                                  <Eye className="h-4 w-4 text-blue-400" />
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
            <TabsContent value="organizations">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Gestão de Organizações
                    {organizations?.filter(o => !o.is_approved).length ? (
                      <Badge className="bg-amber-500/20 text-amber-400 ml-2">
                        {organizations?.filter(o => !o.is_approved).length} Pendentes
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Aprove ou rejeite organizações que solicitaram acesso à plataforma.
                    Funcionários só podem fazer login quando a organização estiver aprovada.
                  </p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organização</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead>País</TableHead>
                          <TableHead>NIF</TableHead>
                          <TableHead>Domínio Email</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizations?.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{org.sector}</Badge>
                            </TableCell>
                            <TableCell>{org.country}</TableCell>
                            <TableCell className="font-mono text-sm">{org.nif}</TableCell>
                            <TableCell className="font-mono text-sm">@{org.email_domain}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{org.contact_email}</p>
                                {org.contact_phone && (
                                  <p className="text-xs text-muted-foreground">{org.contact_phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={org.is_approved ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>
                                {org.is_approved ? "Aprovada" : "Pendente"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(org.created_at), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!org.is_approved ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-emerald-400 hover:text-emerald-300" 
                                    onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: true })}
                                    title="Aprovar organização"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-red-400 hover:text-red-300" 
                                    onClick={() => updateOrgApproval.mutate({ organizationId: org.id, isApproved: false })}
                                    title="Revogar aprovação"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8" 
                                  onClick={() => window.open(`mailto:${org.contact_email}`)}
                                  title="Enviar email"
                                >
                                  <Mail className="h-4 w-4 text-blue-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!organizations || organizations.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              Nenhuma organização registada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isSuperAdmin && (
              <TabsContent value="admins">
                <AdminManagementPanel />
              </TabsContent>
            )}

            {/* Production Tab */}
            <TabsContent value="production">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Dados de Produção</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar Dados de Produção</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input placeholder="Operadora" value={productionForm.operator} onChange={(e) => setProductionForm({...productionForm, operator: e.target.value})} />
                          <Input placeholder="Bloco" value={productionForm.block} onChange={(e) => setProductionForm({...productionForm, block: e.target.value})} />
                          <Input placeholder="Campo (opcional)" value={productionForm.field} onChange={(e) => setProductionForm({...productionForm, field: e.target.value})} />
                          <Input type="number" placeholder="Produção Diária (bpd)" value={productionForm.daily_production} onChange={(e) => setProductionForm({...productionForm, daily_production: e.target.value})} />
                          <Input type="number" placeholder="Produção Mensal (bbl)" value={productionForm.monthly_production} onChange={(e) => setProductionForm({...productionForm, monthly_production: e.target.value})} />
                          <Input type="date" value={productionForm.data_date} onChange={(e) => setProductionForm({...productionForm, data_date: e.target.value})} />
                          <Button onClick={handleAddProduction} disabled={addProduction.isPending}>Salvar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operadora</TableHead>
                          <TableHead>Bloco</TableHead>
                          <TableHead>Prod. Diária</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productionData?.slice(0, 15).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.operator}</TableCell>
                            <TableCell>{item.block}</TableCell>
                            <TableCell>{Number(item.daily_production).toLocaleString()} bpd</TableCell>
                            <TableCell>{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => deleteProduction.mutate(item.id)}>
                                  <Trash2 className="h-4 w-4 text-red-400" />
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

            {/* Prices Tab */}
            <TabsContent value="prices">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Dados de Preço</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar Dados de Preço</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Select value={priceForm.crude_type} onValueChange={(value) => setPriceForm({...priceForm, crude_type: value})}>
                            <SelectTrigger><SelectValue placeholder="Tipo de Crude" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Brent">Brent</SelectItem>
                              <SelectItem value="Cabinda">Cabinda</SelectItem>
                              <SelectItem value="Girassol">Girassol</SelectItem>
                              <SelectItem value="Dalia">Dalia</SelectItem>
                              <SelectItem value="Nemba">Nemba</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="Preço (USD)" value={priceForm.price} onChange={(e) => setPriceForm({...priceForm, price: e.target.value})} />
                          <Input type="number" placeholder="Variação (%)" value={priceForm.change_percent} onChange={(e) => setPriceForm({...priceForm, change_percent: e.target.value})} />
                          <Input type="date" value={priceForm.data_date} onChange={(e) => setPriceForm({...priceForm, data_date: e.target.value})} />
                          <Button onClick={handleAddPrice} disabled={addPrice.isPending}>Salvar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Variação</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceData?.slice(0, 15).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.crude_type}</TableCell>
                            <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                            <TableCell className={Number(item.change_percent) >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {Number(item.change_percent) >= 0 ? "+" : ""}{Number(item.change_percent).toFixed(2)}%
                            </TableCell>
                            <TableCell>{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => deletePrice.mutate(item.id)}>
                                <Trash2 className="h-4 w-4 text-red-400" />
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

            {/* Exports Tab */}
            <TabsContent value="exports">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Dados de Exportação</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar Dados de Exportação</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input placeholder="Destino" value={exportForm.destination} onChange={(e) => setExportForm({...exportForm, destination: e.target.value})} />
                          <Input type="number" placeholder="Volume (bbl)" value={exportForm.volume} onChange={(e) => setExportForm({...exportForm, volume: e.target.value})} />
                          <Input type="number" placeholder="Valor (USD)" value={exportForm.value_usd} onChange={(e) => setExportForm({...exportForm, value_usd: e.target.value})} />
                          <Input placeholder="Nome do Navio" value={exportForm.tanker_name} onChange={(e) => setExportForm({...exportForm, tanker_name: e.target.value})} />
                          <Select value={exportForm.status} onValueChange={(value) => setExportForm({...exportForm, status: value})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_transit">Em Trânsito</SelectItem>
                              <SelectItem value="delivered">Entregue</SelectItem>
                              <SelectItem value="loading">Carregando</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="date" value={exportForm.data_date} onChange={(e) => setExportForm({...exportForm, data_date: e.target.value})} />
                          <Button onClick={handleAddExport} disabled={addExport.isPending}>Salvar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Destino</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exportData?.slice(0, 15).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.destination}</TableCell>
                            <TableCell>{Number(item.volume).toLocaleString()} bbl</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.status === "in_transit" ? "Em Trânsito" : item.status === "delivered" ? "Entregue" : "Carregando"}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => deleteExport.mutate(item.id)}>
                                <Trash2 className="h-4 w-4 text-red-400" />
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
            <TabsContent value="risks">
              <div className="grid gap-4">
                {/* Risk Data */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Índices de Risco</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Adicionar Índice de Risco</DialogTitle></DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Select value={riskForm.category} onValueChange={(value) => setRiskForm({...riskForm, category: value})}>
                              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="geopolitical">Geopolítico</SelectItem>
                                <SelectItem value="regulatory">Regulatório</SelectItem>
                                <SelectItem value="fiscal">Fiscal</SelectItem>
                                <SelectItem value="operational">Operacional</SelectItem>
                                <SelectItem value="currency">Cambial</SelectItem>
                                <SelectItem value="environmental">Ambiental</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input type="number" placeholder="Score (0-100)" value={riskForm.score} onChange={(e) => setRiskForm({...riskForm, score: e.target.value})} />
                            <Select value={riskForm.trend} onValueChange={(value) => setRiskForm({...riskForm, trend: value})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="up">Subindo</SelectItem>
                                <SelectItem value="down">Descendo</SelectItem>
                                <SelectItem value="stable">Estável</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea placeholder="Descrição" value={riskForm.description} onChange={(e) => setRiskForm({...riskForm, description: e.target.value})} />
                            <Input type="date" value={riskForm.data_date} onChange={(e) => setRiskForm({...riskForm, data_date: e.target.value})} />
                            <Button onClick={handleAddRisk}>Salvar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Tendência</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {riskData?.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="capitalize">{item.category}</TableCell>
                              <TableCell><Badge className={item.score > 70 ? "bg-red-500/20 text-red-400" : item.score > 40 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}>{item.score}/100</Badge></TableCell>
                              <TableCell>{item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}</TableCell>
                              <TableCell>{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" onClick={() => deleteRisk.mutate(item.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Alerts */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Alertas de Risco</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Adicionar Alerta de Risco</DialogTitle></DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Input placeholder="Título" value={alertForm.title} onChange={(e) => setAlertForm({...alertForm, title: e.target.value})} />
                            <Textarea placeholder="Descrição" value={alertForm.description} onChange={(e) => setAlertForm({...alertForm, description: e.target.value})} />
                            <Input placeholder="Região" value={alertForm.region} onChange={(e) => setAlertForm({...alertForm, region: e.target.value})} />
                            <Select value={alertForm.impact} onValueChange={(value) => setAlertForm({...alertForm, impact: value})}>
                              <SelectTrigger><SelectValue placeholder="Impacto" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">Alto</SelectItem>
                                <SelectItem value="medium">Médio</SelectItem>
                                <SelectItem value="low">Baixo</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={handleAddAlert}>Salvar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {riskAlerts?.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                          <div>
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.region || "Global"} • {alert.impact}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => deleteRiskAlertMutation.mutate(alert.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Enviar Notificação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <Input placeholder="Título da notificação" value={notificationForm.title} onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})} />
                    <Textarea placeholder="Mensagem" rows={4} value={notificationForm.message} onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}>
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Informação</SelectItem>
                          <SelectItem value="warning">Aviso</SelectItem>
                          <SelectItem value="alert">Alerta</SelectItem>
                          <SelectItem value="success">Sucesso</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={notificationForm.isGlobal ? "global" : "specific"} onValueChange={(value) => setNotificationForm({...notificationForm, isGlobal: value === "global"})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Todos os Usuários</SelectItem>
                          <SelectItem value="specific">Usuário Específico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSendNotification} disabled={sendNotification.isPending} className="bg-primary">
                      <Send className="h-4 w-4 mr-2" />Enviar Notificação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Solicitações dos Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests?.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{request.subject}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{format(new Date(request.created_at), "dd/MM/yyyy HH:mm")}</p>
                          </div>
                          <Badge className={request.status === "pending" ? "bg-amber-500/20 text-amber-400" : request.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}>
                            {request.status === "pending" ? "Pendente" : request.status === "resolved" ? "Resolvido" : "Em Análise"}
                          </Badge>
                        </div>
                        {request.admin_response && (
                          <div className="mt-3 p-3 rounded bg-primary/10 border border-primary/20">
                            <p className="text-sm text-foreground">{request.admin_response}</p>
                          </div>
                        )}
                        {request.status === "pending" && (
                          <div className="mt-4 space-y-3">
                            <Textarea placeholder="Digite sua resposta..." value={responseForm.requestId === request.id ? responseForm.response : ""} onChange={(e) => setResponseForm({...responseForm, requestId: request.id, response: e.target.value})} />
                            <Button size="sm" onClick={handleRespondToRequest} disabled={responseForm.requestId !== request.id || !responseForm.response}>
                              <Send className="h-4 w-4 mr-1" />Responder
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!requests || requests.length === 0) && (<p className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</p>)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Log de Atualizações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataUpdates?.map((update) => (
                      <div key={update.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/20"><Database className="h-4 w-4 text-primary" /></div>
                          <div>
                            <p className="font-medium text-foreground capitalize">{update.data_type}</p>
                            <p className="text-xs text-muted-foreground">{update.source}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{update.records_updated} registros</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(update.created_at), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                    {(!dataUpdates || dataUpdates.length === 0) && (<p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Admin;
