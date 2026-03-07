import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Plus, Users, FileText, Activity, ChevronRight, Sparkles, Search,
  LayoutGrid, List, ArrowUpRight, Clock, MoreVertical, ShieldCheck, UserPlus,
  Settings, Archive, Trash2, Star, TrendingUp, MessageSquare, Bell, Filter,
  Download, Share2, Eye, Edit, Copy, CheckCircle2, BarChart3
} from "lucide-react";
import { useWorkspaces, useWorkspaceMembers, useWorkspaceActivity, useWorkspaceReports, useWorkspaceInvitations } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceGroupChat } from "@/components/workspace/WorkspaceGroupChat";
import { WorkspacePrivateChat } from "@/components/workspace/WorkspacePrivateChat";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Workspace = () => {
  const { user } = useAuth();
  const { workspaces, isLoading, createWorkspace, deleteWorkspace, updateWorkspace } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteMembersOpen, setIsInviteMembersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [settingsName, setSettingsName] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");

  // Dynamic data hooks for selected workspace
  const { members } = useWorkspaceMembers(selectedWorkspaceId);
  const { activities } = useWorkspaceActivity(selectedWorkspaceId);
  const { sharedReports } = useWorkspaceReports(selectedWorkspaceId);
  const { invitations, sendInvitation } = useWorkspaceInvitations(selectedWorkspaceId);

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);
  const currentMember = members?.find(m => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) { toast.error("Nome é obrigatório"); return; }
    try {
      await createWorkspace.mutateAsync({ name: newWorkspace.name, description: newWorkspace.description || undefined });
      setIsCreateDialogOpen(false);
      setNewWorkspace({ name: "", description: "" });
    } catch (error: any) {
      toast.error(`Erro: ${error?.message || 'Desconhecido'}`);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) { toast.error("Email é obrigatório"); return; }
    try {
      await sendInvitation.mutateAsync({ email: inviteEmail, role: inviteRole as any });
      setInviteEmail("");
      setIsInviteMembersOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao convidar: ${error?.message || 'Desconhecido'}`);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    try {
      await deleteWorkspace.mutateAsync(id);
      if (selectedWorkspaceId === id) setSelectedWorkspaceId(null);
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error(`Erro ao eliminar: ${error?.message}`);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedWorkspaceId) return;
    try {
      await updateWorkspace.mutateAsync({ id: selectedWorkspaceId, name: settingsName, description: settingsDesc });
      setIsSettingsOpen(false);
    } catch {}
  };

  const openSettings = () => {
    setSettingsName(selectedWorkspace?.name || "");
    setSettingsDesc(selectedWorkspace?.description || "");
    setIsSettingsOpen(true);
  };

  const todayActions = activities?.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length || 0;

  const filteredWorkspaces = workspaces?.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return "Você";
    const member = members?.find(m => m.user_id === userId);
    return member?.profile?.contact_name || `Utilizador ${userId.slice(0, 6)}`;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('report') || action.includes('share')) return <FileText className="h-4 w-4 text-emerald-500" />;
    if (action.includes('member') || action.includes('invitation')) return <Users className="h-4 w-4 text-primary" />;
    if (action.includes('download')) return <Download className="h-4 w-4 text-blue-500" />;
    return <Activity className="h-4 w-4 text-amber-500" />;
  };

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      'member_added': 'adicionou um membro',
      'member_removed': 'removeu um membro',
      'invitation_sent': 'enviou um convite',
      'report_shared': 'partilhou um relatório',
    };
    return map[action] || action;
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] overflow-hidden font-sans">
      <Sidebar activeItem="/workspace" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/workspace" />
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selectedWorkspaceId && selectedWorkspace ? (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedWorkspaceId(null)} className="rounded-xl bg-white dark:bg-white/5 border border-border/50 shadow-sm">
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-black tracking-tight text-foreground">{selectedWorkspace.name}</h1>
                        <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">Ativo</Badge>
                        <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest">
                          <Users className="w-3 h-3 mr-1" /> {members?.length || 0} Membros
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedWorkspace.description || "Workspace da equipe"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnerOrAdmin && (
                      <Button onClick={() => setIsInviteMembersOpen(true)} className="rounded-xl gap-2 shadow-sm">
                        <UserPlus className="h-4 w-4" /> Convidar
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                        <DropdownMenuLabel>Opções</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isOwnerOrAdmin && (
                          <DropdownMenuItem onClick={openSettings}><Settings className="mr-2 h-4 w-4" /> Configurações</DropdownMenuItem>
                        )}
                        {selectedWorkspace.owner_id === user?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(selectedWorkspaceId)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Dynamic Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Membros", value: members?.length || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Relatórios", value: sharedReports?.length || 0, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Atividades", value: activities?.length || 0, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Ações Hoje", value: todayActions, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                          <div>
                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="members" className="space-y-6">
                  <TabsList className="bg-white dark:bg-white/5 border border-border/50 p-1 rounded-xl flex-wrap">
                    <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Users className="h-4 w-4 mr-2" /> Membros</TabsTrigger>
                    <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><MessageSquare className="h-4 w-4 mr-2" /> Chat</TabsTrigger>
                    <TabsTrigger value="dms" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><MessageSquare className="h-4 w-4 mr-2" /> Privado</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><FileText className="h-4 w-4 mr-2" /> Relatórios</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Activity className="h-4 w-4 mr-2" /> Atividade</TabsTrigger>
                  </TabsList>

                  {/* Members Tab */}
                  <TabsContent value="members" className="space-y-6">
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-black">Membros da Equipa</CardTitle>
                            <CardDescription>{members?.length || 0} membros</CardDescription>
                          </div>
                          {isOwnerOrAdmin && (
                            <Button onClick={() => setIsInviteMembersOpen(true)} className="rounded-xl gap-2">
                              <UserPlus className="h-4 w-4" /> Adicionar
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {members?.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-background">
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {(member.profile?.contact_name || member.user_id.slice(0, 2)).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-foreground">
                                    {member.user_id === user?.id ? "Você" : member.profile?.contact_name || `Utilizador ${member.user_id.slice(0, 8)}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Desde {format(new Date(member.joined_at), "dd MMM yyyy", { locale: pt })}
                                    {member.profile?.company_name && ` · ${member.profile.company_name}`}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={member.role === 'owner' ? 'default' : 'secondary'}
                                className={
                                  member.role === 'owner' ? 'bg-amber-500/20 text-amber-600 border-none' :
                                  member.role === 'admin' ? 'bg-primary/20 text-primary border-none' :
                                  member.role === 'editor' ? 'bg-emerald-500/20 text-emerald-600 border-none' :
                                  'bg-muted text-muted-foreground border-none'
                                }
                              >
                                {member.role === 'owner' ? 'Proprietário' : member.role === 'admin' ? 'Admin' : member.role === 'editor' ? 'Editor' : 'Visualizador'}
                              </Badge>
                            </div>
                          ))}
                          {invitations?.filter(i => i.status === 'pending').length > 0 && (
                            <>
                              <div className="pt-4 pb-2"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Convites Pendentes</p></div>
                              {invitations.filter(i => i.status === 'pending').map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                                    <p className="text-xs text-muted-foreground">Convite pendente · {inv.role}</p>
                                  </div>
                                  <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pendente</Badge>
                                </div>
                              ))}
                            </>
                          )}
                          {(!members || members.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro encontrado</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Group Chat Tab */}
                  <TabsContent value="chat"><WorkspaceGroupChat workspaceId={selectedWorkspaceId} /></TabsContent>

                  {/* Private Messages Tab */}
                  <TabsContent value="dms"><WorkspacePrivateChat workspaceId={selectedWorkspaceId} /></TabsContent>

                  {/* Reports Tab */}
                  <TabsContent value="reports" className="space-y-6">
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-black">Relatórios Partilhados</CardTitle>
                        <CardDescription>{sharedReports?.length || 0} relatórios no workspace</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {sharedReports?.map((report: any) => (
                            <div key={report.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10"><FileText className="h-5 w-5 text-emerald-500" /></div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{report.report?.title || `Relatório ${report.report_id.slice(0, 8)}`}</p>
                                  <p className="text-xs text-muted-foreground">Partilhado em {format(new Date(report.shared_at), "dd MMM yyyy", { locale: pt })}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                            </div>
                          ))}
                          {(!sharedReports || sharedReports.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Nenhum relatório partilhado</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-6">
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-black">Histórico de Atividades</CardTitle>
                        <CardDescription>Todas as ações registadas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {activities?.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
                              <div className="p-2 rounded-lg bg-muted/50">{getActivityIcon(item.action)}</div>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-bold text-foreground">{getMemberName(item.user_id)}</span>
                                  <span className="text-muted-foreground"> {formatAction(item.action)}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!activities || activities.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registada</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 uppercase tracking-wider">
                      <Building2 className="w-3 h-3" /> Gestão de Equipes
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Seus <span className="text-primary">Workspaces</span></h1>
                    <p className="text-muted-foreground text-sm">Gerencie seus espaços de trabalho colaborativos.</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-white dark:bg-white/5 border border-border/50 p-1 rounded-xl">
                      <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                      <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20 font-bold px-6"><Plus className="h-4 w-4" /> Novo Workspace</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2rem] border-border/50">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black">Criar Novo Workspace</DialogTitle>
                          <DialogDescription>Crie um espaço de trabalho para colaborar com sua equipe.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome</Label>
                            <Input placeholder="Ex: Equipe de Análise" value={newWorkspace.name} onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })} className="rounded-xl py-6" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição (opcional)</Label>
                            <Textarea placeholder="Descreva o propósito..." value={newWorkspace.description} onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })} className="rounded-2xl min-h-[100px] resize-none" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateWorkspace} className="w-full rounded-xl py-6 font-black" disabled={createWorkspace.isPending}>
                            {createWorkspace.isPending ? "A criar..." : "Confirmar Criação"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Search & Sort */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 max-w-md">
                    <div className="flex items-center bg-white dark:bg-white/5 border border-border/50 rounded-xl overflow-hidden px-3 py-1">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Procurar workspace..." className="border-none focus:ring-0 bg-transparent text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[160px] rounded-xl bg-white dark:bg-white/5 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Total Workspaces", value: workspaces?.length || 0, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Seus Workspaces", value: workspaces?.filter(w => w.owner_id === user?.id).length || 0, icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Colaborações", value: workspaces?.filter(w => w.owner_id !== user?.id).length || 0, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 rounded-xl">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                        <div>
                          <p className="text-xl font-black text-foreground">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Workspace Cards */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-white dark:bg-white/5 border border-border/50 animate-pulse" />)}
                  </div>
                ) : filteredWorkspaces && filteredWorkspaces.length > 0 ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredWorkspaces.map((workspace) => (
                      <motion.div key={workspace.id} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Card
                          className="bg-white dark:bg-white/5 border-border/50 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden rounded-2xl shadow-sm"
                          onClick={() => setSelectedWorkspaceId(workspace.id)}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight className="w-5 h-5 text-primary" /></div>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500"><Building2 className="h-6 w-6" /></div>
                              {workspace.owner_id === user?.id && (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none text-[9px] font-black uppercase tracking-widest rounded-full px-3">
                                  <ShieldCheck className="w-3 h-3 mr-1" /> Proprietário
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl font-black text-foreground mt-4 group-hover:text-primary transition-colors">{workspace.name}</CardTitle>
                            {workspace.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{workspace.description}</p>}
                          </CardHeader>
                          <CardContent className="pt-4 border-t border-border/50 bg-muted/10">
                            <div className="flex items-center justify-between">
                              <div className="text-right w-full">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Criado em</span>
                                <div className="flex items-center gap-1 mt-1 text-xs font-bold justify-end">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(workspace.created_at), "dd MMM yyyy", { locale: pt })}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl overflow-hidden">
                    <CardContent className="p-16 text-center">
                      <div className="p-6 rounded-2xl bg-primary/10 w-fit mx-auto mb-6"><Sparkles className="h-12 w-12 text-primary" /></div>
                      <h3 className="text-2xl font-black text-foreground mb-2">{searchQuery ? "Nenhum workspace encontrado" : "Inicie sua Colaboração"}</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-8">{searchQuery ? "Tente ajustar a pesquisa." : "Crie o primeiro workspace para colaborar com a equipe."}</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-xl px-8 py-6 font-black gap-2"><Plus className="h-5 w-5" /> Criar Primeiro Workspace</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {[
                    { title: "Chat em Tempo Real", desc: "Comunique com a equipa no workspace", icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
                    { title: "Controle de Permissões", desc: "Gerencie acessos e funções", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Relatórios Partilhados", desc: "Partilhe e acesse relatórios da equipa", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" }
                  ].map((f, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 shadow-sm rounded-2xl hover:border-primary/20 transition-all">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${f.bg}`}><f.icon className={`h-6 w-6 ${f.color}`} /></div>
                        <div><h4 className="font-bold text-sm text-foreground">{f.title}</h4><p className="text-xs text-muted-foreground">{f.desc}</p></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteMembersOpen} onOpenChange={setIsInviteMembersOpen}>
        <DialogContent className="rounded-[2rem] border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Convidar Membros</DialogTitle>
            <DialogDescription>Adicione novos membros ao workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input type="email" placeholder="exemplo@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="rounded-xl py-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="rounded-xl py-6"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInviteMember} className="w-full rounded-xl py-6 font-black" disabled={sendInvitation.isPending}>
              {sendInvitation.isPending ? "A enviar..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[2rem] border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Configurações do Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome</Label>
              <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className="rounded-xl py-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</Label>
              <Textarea value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} className="rounded-2xl min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings} className="w-full rounded-xl py-6 font-black" disabled={updateWorkspace.isPending}>
              {updateWorkspace.isPending ? "A guardar..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Workspace?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível. Todos os dados, membros e mensagens serão eliminados permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => deleteConfirmId && handleDeleteWorkspace(deleteConfirmId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Workspace;
