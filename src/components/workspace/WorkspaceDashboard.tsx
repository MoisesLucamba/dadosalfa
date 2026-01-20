import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserPlus
} from "lucide-react";
import { useWorkspaces, useWorkspaceMembers, useWorkspaceActivity, useWorkspaceReports } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { WorkspacePanel } from "./WorkspacePanel";
import { TeamManagement } from "./TeamManagement";
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
  const { sharedReports } = useWorkspaceReports(workspaceId);
  const [showSettings, setShowSettings] = useState(false);

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
          <TeamManagement workspaceId={workspaceId} />
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
            <CardHeader>
              <CardTitle className="text-base">Relatórios Partilhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedReports?.map((report) => (
                  <div 
                    key={report.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <FileText className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Relatório {report.report_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Partilhado em {format(new Date(report.shared_at), "dd MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!sharedReports || sharedReports.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum relatório partilhado
                  </p>
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
    </div>
  );
};
