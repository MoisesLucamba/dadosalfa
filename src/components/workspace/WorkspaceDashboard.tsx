import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  BarChart3,
  Download,
  Share2,
  Clock,
  Building2,
  Crown,
  Settings,
  UserPlus,
  Send,
  Trash2,
  Search,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaces, useWorkspaceMembers, useWorkspaceActivity, useWorkspaceReports } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { WorkspacePanel } from "./WorkspacePanel";
import { AdvancedTeamManagement } from "./AdvancedTeamManagement";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

interface WorkspaceDashboardProps {
  workspaceId: string;
}

export const WorkspaceDashboard = ({ workspaceId }: WorkspaceDashboardProps) => {
  const { user } = useAuth();
  const { workspaces } = useWorkspaces();
  const { members } = useWorkspaceMembers(workspaceId);
  const { activities } = useWorkspaceActivity(workspaceId);
  const { sharedReports, shareReport, unshareReport } = useWorkspaceReports(workspaceId);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [reportSearch, setReportSearch] = useState("");

  // Fetch available reports to share
  const { data: availableReports } = useQuery({
    queryKey: ['available-reports-for-share'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, type, period, status, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: showShareDialog,
  });

  const alreadySharedIds = sharedReports?.map((sr: any) => sr.report_id) || [];
  const filteredReports = availableReports?.filter(r => 
    !alreadySharedIds.includes(r.id) &&
    (r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
     r.type.toLowerCase().includes(reportSearch.toLowerCase()))
  ) || [];

  const workspace = workspaces?.find(w => w.id === workspaceId);
  const currentMember = members?.find(m => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // Mock data for charts - would come from real data
  const memberActivityData = [
    { name: 'Seg', reports: 4, downloads: 8, exports: 2 },
    { name: 'Ter', reports: 6, downloads: 12, exports: 5 },
    { name: 'Qua', reports: 3, downloads: 6, exports: 3 },
    { name: 'Qui', reports: 8, downloads: 15, exports: 7 },
    { name: 'Sex', reports: 5, downloads: 10, exports: 4 },
  ];

  const roleDistribution = [
    { name: 'Owner', value: members?.filter(m => m.role === 'owner').length || 0, color: 'hsl(var(--primary))' },
    { name: 'Admin', value: members?.filter(m => m.role === 'admin').length || 0, color: 'hsl(var(--accent))' },
    { name: 'Editor', value: members?.filter(m => m.role === 'editor').length || 0, color: 'hsl(142, 71%, 45%)' },
    { name: 'Viewer', value: members?.filter(m => m.role === 'viewer').length || 0, color: 'hsl(var(--muted-foreground))' },
  ].filter(r => r.value > 0);

  const reportTypesData = [
    { name: 'Produção', count: sharedReports?.filter(r => r.report_id?.includes('prod')).length || 3 },
    { name: 'Preços', count: sharedReports?.filter(r => r.report_id?.includes('price')).length || 5 },
    { name: 'Exportações', count: sharedReports?.filter(r => r.report_id?.includes('export')).length || 2 },
    { name: 'Risco', count: sharedReports?.filter(r => r.report_id?.includes('risk')).length || 4 },
  ];

  const recentActivityItems = activities?.slice(0, 10) || [];

  const getActivityIcon = (action: string) => {
    if (action.includes('report')) return <FileText className="h-4 w-4" />;
    if (action.includes('member')) return <Users className="h-4 w-4" />;
    if (action.includes('download')) return <Download className="h-4 w-4" />;
    if (action.includes('share')) return <Share2 className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecione um workspace para ver o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              {workspace.name}
              {isOwnerOrAdmin && <Crown className="h-4 w-4 text-amber-500" />}
            </h2>
            <p className="text-sm text-muted-foreground">
              {workspace.description || "Workspace da equipe"}
            </p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{members?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Membros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{sharedReports?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Relatórios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activities?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {activities?.filter(a => {
                    const date = new Date(a.created_at);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  }).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Ações Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="team">Equipa</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <AdvancedTeamManagement workspaceId={workspaceId} maxUsers={16} planName="Professional" />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Atividade Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={memberActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="reports" name="Relatórios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="downloads" name="Downloads" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Distribuição de Funções
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Report Types */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Relatórios por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={reportTypesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Quantidade"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Membros do Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members?.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.user_id === user?.id ? "Você" : `Usuário ${member.user_id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Desde {format(new Date(member.joined_at), "dd MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={member.role === 'owner' ? 'default' : 'secondary'}
                      className={
                        member.role === 'owner' ? 'bg-amber-500/20 text-amber-500' :
                        member.role === 'admin' ? 'bg-primary/20 text-primary' :
                        member.role === 'editor' ? 'bg-emerald-500/20 text-emerald-500' :
                        'bg-muted text-muted-foreground'
                      }
                    >
                      {member.role === 'owner' ? 'Proprietário' :
                       member.role === 'admin' ? 'Administrador' :
                       member.role === 'editor' ? 'Editor' : 'Visualizador'}
                    </Badge>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Relatórios Partilhados</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowShareDialog(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar Relatório
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedReports?.map((sr: any) => (
                  <div 
                    key={sr.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <FileText className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {sr.report?.title || `Relatório ${sr.report_id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2">
                          {sr.report?.type && (
                            <Badge variant="secondary" className="text-[10px]">
                              {sr.report.type}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Partilhado em {format(new Date(sr.shared_at), "dd MMM yyyy", { locale: pt })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      {isOwnerOrAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => unshareReport.mutate(sr.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!sharedReports || sharedReports.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum relatório partilhado neste workspace
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowShareDialog(true)}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Enviar primeiro relatório
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Histórico de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivityItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getActivityIcon(item.action)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivityItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade registada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workspace Settings Panel */}
      <WorkspacePanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Share Report Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar Relatório ao Workspace
            </DialogTitle>
            <DialogDescription>
              Selecione um relatório para partilhar com a equipa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar relatórios..." 
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">{report.type}</Badge>
                          {report.period && (
                            <span className="text-[10px] text-muted-foreground">{report.period}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0 ml-2"
                      onClick={() => {
                        shareReport.mutate(report.id);
                        setShowShareDialog(false);
                        setReportSearch("");
                      }}
                      disabled={shareReport.isPending}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Enviar
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    {reportSearch ? "Nenhum relatório encontrado" : "Todos os relatórios já foram partilhados"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
