import { useState } from "react";
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
import { 
  Users, Database, Bell, MessageSquare, BarChart3, Plus, Check, X, 
  RefreshCw, Send, Eye, Edit, Trash2, Shield, Clock, TrendingUp
} from "lucide-react";
import { useIsAdmin, useAllUsers, useUserRequests, useDataUpdates, useUpdateUserApproval, useSendNotification, useRespondToRequest } from "@/hooks/useAdmin";
import { useProductionData, usePriceData, useExportData, useAddProductionData, useAddPriceData, useAddExportData, useDeleteProductionData, useDeletePriceData, useDeleteExportData, useLogDataUpdate } from "@/hooks/useData";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { format } from "date-fns";

const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  
  const { data: users, isLoading: loadingUsers } = useAllUsers();
  const { data: requests, isLoading: loadingRequests } = useUserRequests();
  const { data: dataUpdates } = useDataUpdates();
  const { data: productionData } = useProductionData();
  const { data: priceData } = usePriceData();
  const { data: exportData } = useExportData();
  
  const updateApproval = useUpdateUserApproval();
  const sendNotification = useSendNotification();
  const respondToRequest = useRespondToRequest();
  const addProduction = useAddProductionData();
  const addPrice = useAddPriceData();
  const addExport = useAddExportData();
  const deleteProduction = useDeleteProductionData();
  const deletePrice = useDeletePriceData();
  const deleteExport = useDeleteExportData();
  const logUpdate = useLogDataUpdate();
  
  // Form states
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", type: "info", isGlobal: true });
  const [productionForm, setProductionForm] = useState({ operator: "", block: "", field: "", daily_production: "", monthly_production: "", decline_rate: "", data_date: new Date().toISOString().split("T")[0] });
  const [priceForm, setPriceForm] = useState({ crude_type: "", price: "", change_percent: "", data_date: new Date().toISOString().split("T")[0] });
  const [exportForm, setExportForm] = useState({ destination: "", volume: "", value_usd: "", tanker_name: "", status: "in_transit", data_date: new Date().toISOString().split("T")[0] });
  const [responseForm, setResponseForm] = useState({ requestId: "", response: "", status: "resolved" });
  
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
    });
    setNotificationForm({ title: "", message: "", type: "info", isGlobal: true });
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

  const handleRespondToRequest = () => {
    if (!responseForm.requestId || !responseForm.response) return;
    respondToRequest.mutate({
      requestId: responseForm.requestId,
      response: responseForm.response,
      status: responseForm.status,
    });
    setResponseForm({ requestId: "", response: "", status: "resolved" });
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
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie dados, usuários e notificações da plataforma AlphaData</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{requests?.filter(r => r.status === "pending").length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Solicitações</p>
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
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Prod. Registros</p>
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
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Preço Registros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-muted/50 flex-wrap h-auto p-1">
              <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="h-4 w-4 mr-1 sm:mr-2" />Usuários</TabsTrigger>
              <TabsTrigger value="data" className="text-xs sm:text-sm"><Database className="h-4 w-4 mr-1 sm:mr-2" />Dados</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="h-4 w-4 mr-1 sm:mr-2" />Notificações</TabsTrigger>
              <TabsTrigger value="requests" className="text-xs sm:text-sm"><MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />Solicitações</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs sm:text-sm"><BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />Logs</TabsTrigger>
            </TabsList>

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
                              <div className="flex gap-2">
                                {!user.is_approved && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8"
                                    onClick={() => updateApproval.mutate({ userId: user.id, isApproved: true })}
                                  >
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  </Button>
                                )}
                                {user.is_approved && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8"
                                    onClick={() => updateApproval.mutate({ userId: user.id, isApproved: false })}
                                  >
                                    <X className="h-4 w-4 text-red-400" />
                                  </Button>
                                )}
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

            {/* Data Tab */}
            <TabsContent value="data">
              <div className="space-y-4">
                {/* Production Data */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dados de Produção</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary">
                            <Plus className="h-4 w-4 mr-1" />Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Dados de Produção</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Input placeholder="Operadora" value={productionForm.operator} onChange={(e) => setProductionForm({...productionForm, operator: e.target.value})} />
                            <Input placeholder="Bloco" value={productionForm.block} onChange={(e) => setProductionForm({...productionForm, block: e.target.value})} />
                            <Input placeholder="Campo (opcional)" value={productionForm.field} onChange={(e) => setProductionForm({...productionForm, field: e.target.value})} />
                            <Input type="number" placeholder="Produção Diária (bpd)" value={productionForm.daily_production} onChange={(e) => setProductionForm({...productionForm, daily_production: e.target.value})} />
                            <Input type="number" placeholder="Produção Mensal (bbl)" value={productionForm.monthly_production} onChange={(e) => setProductionForm({...productionForm, monthly_production: e.target.value})} />
                            <Input type="number" placeholder="Taxa de Declínio (%)" value={productionForm.decline_rate} onChange={(e) => setProductionForm({...productionForm, decline_rate: e.target.value})} />
                            <Input type="date" value={productionForm.data_date} onChange={(e) => setProductionForm({...productionForm, data_date: e.target.value})} />
                            <Button onClick={handleAddProduction} disabled={addProduction.isPending}>Salvar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[300px]">
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
                          {productionData?.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.operator}</TableCell>
                              <TableCell>{item.block}</TableCell>
                              <TableCell>{Number(item.daily_production).toLocaleString()} bpd</TableCell>
                              <TableCell>{format(new Date(item.data_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" onClick={() => deleteProduction.mutate(item.id)}>
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

                {/* Price Data */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dados de Preço</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary">
                            <Plus className="h-4 w-4 mr-1" />Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Dados de Preço</DialogTitle>
                          </DialogHeader>
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
                    <div className="overflow-x-auto max-h-[300px]">
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
                          {priceData?.slice(0, 10).map((item) => (
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

                {/* Export Data */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dados de Exportação</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary">
                            <Plus className="h-4 w-4 mr-1" />Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Dados de Exportação</DialogTitle>
                          </DialogHeader>
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
                    <div className="overflow-x-auto max-h-[300px]">
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
                          {exportData?.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.destination}</TableCell>
                              <TableCell>{Number(item.volume).toLocaleString()} bbl</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.status === "in_transit" ? "Em Trânsito" : item.status === "delivered" ? "Entregue" : "Carregando"}
                                </Badge>
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
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Enviar Notificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <Input 
                      placeholder="Título da notificação" 
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Mensagem" 
                      rows={4}
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    />
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
                    <Button 
                      onClick={handleSendNotification} 
                      disabled={sendNotification.isPending}
                      className="bg-primary"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Notificação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Solicitações dos Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests?.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{request.subject}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(request.created_at), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge className={
                            request.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                            request.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" :
                            "bg-blue-500/20 text-blue-400"
                          }>
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
                            <Textarea 
                              placeholder="Digite sua resposta..."
                              value={responseForm.requestId === request.id ? responseForm.response : ""}
                              onChange={(e) => setResponseForm({...responseForm, requestId: request.id, response: e.target.value})}
                            />
                            <Button 
                              size="sm" 
                              onClick={handleRespondToRequest}
                              disabled={responseForm.requestId !== request.id || !responseForm.response}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Responder
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!requests || requests.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Log de Atualizações de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataUpdates?.map((update) => (
                      <div key={update.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Database className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground capitalize">{update.data_type}</p>
                            <p className="text-xs text-muted-foreground">{update.source}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{update.records_updated} registros</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(update.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!dataUpdates || dataUpdates.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                    )}
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
