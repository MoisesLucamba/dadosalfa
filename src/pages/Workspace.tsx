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
  Building2, 
  Plus, 
  Users, 
  FileText, 
  Activity,
  ChevronRight,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  ArrowUpRight,
  Clock,
  MoreVertical,
  ShieldCheck,
  UserPlus,
  Settings,
  Archive,
  Trash2,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Bell,
  Filter,
  Download,
  Upload,
  Share2,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const Workspace = () => {
  const { user } = useAuth();
  const { workspaces, isLoading, createWorkspace } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteMembersOpen, setIsInviteMembersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "members">("recent");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Mock data for enhanced features
  const [workspaceMembers] = useState([
    { id: "1", name: "João Silva", email: "joao@example.com", role: "admin", avatar: "", status: "online" },
    { id: "2", name: "Maria Santos", email: "maria@example.com", role: "editor", avatar: "", status: "online" },
    { id: "3", name: "Pedro Costa", email: "pedro@example.com", role: "viewer", avatar: "", status: "offline" },
  ]);

  const [recentActivities] = useState([
    { id: "1", user: "João Silva", action: "criou um relatório", target: "Q4 Analysis", time: "Há 5 min", type: "create" },
    { id: "2", user: "Maria Santos", action: "comentou em", target: "Budget Report", time: "Há 1 hora", type: "comment" },
    { id: "3", user: "Pedro Costa", action: "visualizou", target: "Sales Metrics", time: "Há 2 horas", type: "view" },
  ]);

  const [workspaceStats] = useState({
    totalReports: 24,
    activeMembers: 12,
    completedTasks: 45,
    growthRate: 23,
    storageUsed: 65,
    reportsThisMonth: 8,
    collaborationScore: 87,
  });

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error("Nome do workspace é obrigatório");
      return;
    }

    try {
      await createWorkspace.mutateAsync({
        name: newWorkspace.name,
        description: newWorkspace.description || undefined,
      });
      toast.success("Workspace criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewWorkspace({ name: "", description: "" });
    } catch (error) {
      toast.error("Erro ao criar workspace");
    }
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviteEmail("");
    setIsInviteMembersOpen(false);
  };

  const handleArchiveWorkspace = (workspaceId: string) => {
    toast.success("Workspace arquivado com sucesso");
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    toast.success("Workspace eliminado com sucesso");
  };

  const filteredWorkspaces = workspaces?.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workspace.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && !workspace.is_archived) ||
                         (filterStatus === "archived" && workspace.is_archived);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "members") return 0; // Would compare member counts
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#050505] overflow-hidden font-sans">
      <Sidebar activeItem="/workspace" />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeItem="/workspace" />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selectedWorkspaceId ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-7xl mx-auto"
              >
                {/* Workspace Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedWorkspaceId(null)}
                      className="rounded-xl bg-white dark:bg-white/5 border border-border/50 shadow-sm"
                    >
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-black tracking-tight text-foreground">{selectedWorkspace?.name}</h1>
                        <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                          Ativo
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest">
                          <Users className="w-3 h-3 mr-1" /> {workspaceStats.activeMembers} Membros
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedWorkspace?.description || "Painel de controle e métricas do workspace."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => setIsInviteMembersOpen(true)}
                      className="rounded-xl gap-2 shadow-sm"
                    >
                      <UserPlus className="h-4 w-4" /> Convidar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-xl">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                        <DropdownMenuLabel>Opções do Workspace</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                          <Settings className="mr-2 h-4 w-4" /> Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" /> Partilhar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> Exportar Dados
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchiveWorkspace(selectedWorkspaceId)}>
                          <Archive className="mr-2 h-4 w-4" /> Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteWorkspace(selectedWorkspaceId)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total de Relatórios", value: workspaceStats.totalReports, icon: FileText, color: "text-primary", bg: "bg-primary/10", trend: "+12%" },
                    { label: "Membros Ativos", value: workspaceStats.activeMembers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+3" },
                    { label: "Tarefas Concluídas", value: workspaceStats.completedTasks, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+8" },
                    { label: "Taxa de Crescimento", value: `${workspaceStats.growthRate}%`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", trend: "+5%" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black rounded-full">
                            {stat.trend}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="bg-white dark:bg-white/5 border border-border/50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <BarChart3 className="h-4 w-4 mr-2" /> Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Users className="h-4 w-4 mr-2" /> Membros
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="h-4 w-4 mr-2" /> Relatórios
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Activity className="h-4 w-4 mr-2" /> Atividade
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Performance Chart */}
                      <Card className="lg:col-span-2 bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-black">Performance Mensal</CardTitle>
                          <CardDescription>Relatórios criados e colaboração</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <LineChart className="h-16 w-16 opacity-20" />
                            <span className="ml-4">Gráfico de performance aqui</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Storage & Usage */}
                      <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-black">Armazenamento</CardTitle>
                          <CardDescription>Uso de espaço do workspace</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Usado</span>
                              <span className="text-sm font-black">{workspaceStats.storageUsed}%</span>
                            </div>
                            <Progress value={workspaceStats.storageUsed} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">6.5 GB de 10 GB</p>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-xs font-medium">Documentos</span>
                              </div>
                              <span className="text-xs font-bold">3.2 GB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-medium">Imagens</span>
                              </div>
                              <span className="text-xs font-bold">2.1 GB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-medium">Outros</span>
                              </div>
                              <span className="text-xs font-bold">1.2 GB</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-black">Atividade Recente</CardTitle>
                            <CardDescription>Últimas ações no workspace</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            Ver Todas
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <Avatar className="h-10 w-10 border-2 border-background">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {activity.user.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-bold text-foreground">{activity.user}</span>
                                  <span className="text-muted-foreground"> {activity.action} </span>
                                  <span className="font-semibold text-foreground">{activity.target}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                              </div>
                              {activity.type === "create" && <FileText className="h-4 w-4 text-primary" />}
                              {activity.type === "comment" && <MessageSquare className="h-4 w-4 text-emerald-500" />}
                              {activity.type === "view" && <Eye className="h-4 w-4 text-blue-500" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-6">
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-black">Membros da Equipa</CardTitle>
                            <CardDescription>{workspaceMembers.length} membros ativos</CardDescription>
                          </div>
                          <Button onClick={() => setIsInviteMembersOpen(true)} className="rounded-xl gap-2">
                            <UserPlus className="h-4 w-4" /> Adicionar Membro
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {workspaceMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border-2 border-background">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${member.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase">
                                  {member.role}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-lg">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-2xl">
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" /> Alterar Função
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <MessageSquare className="mr-2 h-4 w-4" /> Enviar Mensagem
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Remover
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-6">
                    <WorkspaceDashboard workspaceId={selectedWorkspaceId} />
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6">
                    <Card className="bg-white dark:bg-white/5 border-border/50 rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-black">Histórico de Atividades</CardTitle>
                        <CardDescription>Todas as ações realizadas no workspace</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...recentActivities, ...recentActivities].map((activity, index) => (
                            <div key={`${activity.id}-${index}`} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
                              <Avatar className="h-10 w-10 border-2 border-background">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {activity.user.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-bold">{activity.user}</span>
                                  <span className="text-muted-foreground"> {activity.action} </span>
                                  <span className="font-semibold">{activity.target}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 uppercase tracking-wider">
                      <Building2 className="w-3 h-3" /> Gestão de Equipes
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Seus <span className="text-primary">Workspaces</span></h1>
                    <p className="text-muted-foreground text-sm">Gerencie seus espaços de trabalho colaborativos e relatórios.</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-white dark:bg-white/5 border border-border/50 p-1 rounded-xl">
                      <Button 
                        variant={viewMode === "grid" ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 rounded-lg" 
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={viewMode === "list" ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 rounded-lg" 
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20 font-bold px-6">
                          <Plus className="h-4 w-4" /> Novo Workspace
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f]">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-black">Criar Novo Workspace</DialogTitle>
                          <DialogDescription>Crie um espaço de trabalho para colaborar com sua equipe.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome do Workspace</Label>
                            <Input
                              id="name"
                              placeholder="Ex: Equipe de Análise Estratégica"
                              value={newWorkspace.name}
                              onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                              className="rounded-xl py-6"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição (opcional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Descreva o propósito deste workspace..."
                              value={newWorkspace.description}
                              onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                              className="rounded-2xl min-h-[100px] resize-none"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleCreateWorkspace} 
                            className="w-full rounded-xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            disabled={createWorkspace.isPending}
                          >
                            {createWorkspace.isPending ? "A criar..." : "Confirmar Criação"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative group flex-1 max-w-md">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                    <div className="relative flex items-center bg-white dark:bg-white/5 border border-border/50 rounded-xl overflow-hidden px-3 py-1">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Procurar workspace..." 
                        className="border-none focus:ring-0 bg-transparent text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-[140px] rounded-xl bg-white dark:bg-white/5 border-border/50">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="archived">Arquivados</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-[140px] rounded-xl bg-white dark:bg-white/5 border-border/50">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="recent">Mais Recentes</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="members">Membros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Workspaces", value: workspaces?.length || 0, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Membros Totais", value: "48", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Relatórios", value: "124", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Ativos Hoje", value: "23", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 rounded-xl">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xl font-black text-foreground">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Workspaces Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-64 rounded-[2rem] bg-white dark:bg-white/5 border border-border/50 animate-pulse" />
                    ))}
                  </div>
                ) : filteredWorkspaces && filteredWorkspaces.length > 0 ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredWorkspaces.map((workspace) => (
                      <motion.div
                        key={workspace.id}
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Card 
                          className={`bg-white dark:bg-white/5 border-border/50 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden rounded-[2rem] shadow-sm ${viewMode === "list" ? "flex flex-row items-center p-2" : ""}`}
                          onClick={() => setSelectedWorkspaceId(workspace.id)}
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                          </div>
                          
                          <CardHeader className={viewMode === "list" ? "p-4 flex-1" : "pb-4"}>
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                <Building2 className="h-6 w-6" />
                              </div>
                              <div className="flex gap-2">
                                {workspace.owner_id === user?.id && (
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none text-[9px] font-black uppercase tracking-widest rounded-full px-3">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Proprietário
                                  </Badge>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-2xl">
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="mr-2 h-4 w-4" /> Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Share2 className="mr-2 h-4 w-4" /> Partilhar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleArchiveWorkspace(workspace.id)}>
                                      <Archive className="mr-2 h-4 w-4" /> Arquivar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <CardTitle className="text-xl font-black text-foreground mt-4 group-hover:text-primary transition-colors">
                              {workspace.name}
                            </CardTitle>
                            {workspace.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 font-medium">
                                {workspace.description}
                              </p>
                            )}
                          </CardHeader>
                          
                          <CardContent className={viewMode === "list" ? "p-4 border-l border-border/50" : "pt-4 border-t border-border/50 bg-muted/10"}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membros</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Users className="h-3 w-3 text-primary" />
                                    <span className="text-xs font-bold">12</span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Relatórios</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <FileText className="h-3 w-3 text-emerald-500" />
                                    <span className="text-xs font-bold">08</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Criado em</span>
                                <div className="flex items-center gap-1 mt-1 text-xs font-bold">
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
                  <Card className="bg-white dark:bg-white/5 border-border/50 rounded-[3rem] overflow-hidden">
                    <CardContent className="p-16 text-center">
                      <div className="p-6 rounded-[2rem] bg-primary/10 w-fit mx-auto mb-6">
                        <Sparkles className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-black text-foreground mb-2">
                        {searchQuery ? "Nenhum workspace encontrado" : "Inicie sua Colaboração"}
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                        {searchQuery 
                          ? "Tente ajustar seus filtros ou criar um novo workspace."
                          : "Crie seu primeiro workspace para começar a organizar seus relatórios e colaborar com sua equipe em tempo real."
                        }
                      </p>
                      <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="rounded-xl px-8 py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
                      >
                        <Plus className="h-5 w-5" /> Criar Primeiro Workspace
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Features Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {[
                    { title: "Colaboração em Tempo Real", desc: "Trabalhe simultaneamente com sua equipe", icon: Users, color: "text-primary", bg: "bg-primary/10" },
                    { title: "Controle de Permissões", desc: "Gerencie acessos e funções facilmente", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Análise Avançada", desc: "Métricas e insights em tempo real", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-500/10" }
                  ].map((feature, i) => (
                    <Card key={i} className="bg-white dark:bg-white/5 border-border/50 shadow-sm rounded-2xl hover:border-primary/20 transition-all">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${feature.bg} ${feature.color}`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{feature.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Invite Members Dialog */}
      <Dialog open={isInviteMembersOpen} onOpenChange={setIsInviteMembersOpen}>
        <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Convidar Membros</DialogTitle>
            <DialogDescription>Adicione novos membros ao workspace e defina suas funções.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email do Membro</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-xl py-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="rounded-xl py-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="admin">Administrador - Acesso total</SelectItem>
                  <SelectItem value="editor">Editor - Pode criar e editar</SelectItem>
                  <SelectItem value="viewer">Visualizador - Apenas leitura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleInviteMember} 
              className="w-full rounded-xl py-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[2rem] border-border/50 bg-white dark:bg-[#0f0f0f] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Configurações do Workspace</DialogTitle>
            <DialogDescription>Gerencie as configurações e preferências do workspace.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="py-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl">
              <TabsTrigger value="general" className="rounded-lg">Geral</TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-lg">Permissões</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg">Notificações</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome do Workspace</Label>
                <Input defaultValue={selectedWorkspace?.name} className="rounded-xl py-6" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</Label>
                <Textarea defaultValue={selectedWorkspace?.description} className="rounded-2xl min-h-[100px]" />
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Configure quem pode convidar membros, criar relatórios e mais.</p>
              <div className="space-y-3">
                {["Convidar membros", "Criar relatórios", "Excluir conteúdo", "Alterar configurações"].map((perm, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <span className="text-sm font-medium">{perm}</span>
                    <Select defaultValue="admin">
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="admin">Apenas Admin</SelectItem>
                        <SelectItem value="editor">Admin e Editor</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Gerencie as notificações do workspace.</p>
              <div className="space-y-3">
                {["Novos membros", "Novos relatórios", "Comentários", "Menções"].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <span className="text-sm font-medium">{notif}</span>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      Ativo
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button className="w-full rounded-xl py-6 font-black uppercase tracking-widest">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Workspace;