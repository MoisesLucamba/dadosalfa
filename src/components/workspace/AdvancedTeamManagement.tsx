import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  UserPlus, 
  Shield, 
  Crown, 
  Edit2, 
  Trash2,
  Building2,
  Search,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  Activity,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMembers, useWorkspaceInvitations, WorkspaceMember } from "@/hooks/useWorkspaces";
import { useUserPresence, useUserActivityMetrics } from "@/hooks/useUserPresence";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AdvancedTeamManagementProps {
  workspaceId: string;
  maxUsers?: number;
  planName?: string;
}

export const AdvancedTeamManagement = ({ 
  workspaceId, 
  maxUsers = 6,
  planName = "Starter"
}: AdvancedTeamManagementProps) => {
  const { user } = useAuth();
  const { members, addMember, updateMemberRole, removeMember, isLoading } = useWorkspaceMembers(workspaceId);
  const { invitations, sendInvitation, cancelInvitation } = useWorkspaceInvitations(workspaceId);
  const { presenceData, getUserPresence, onlineUsersCount } = useUserPresence();
  const { activityMetrics, getUserMetrics, logActivity } = useUserActivityMetrics(workspaceId);
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [editRole, setEditRole] = useState<WorkspaceMember['role']>("viewer");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  // Extract company domain from user's email
  const userDomain = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[1];
    }
    return null;
  }, [user?.email]);

  // Validate email domain
  const isValidDomain = (email: string) => {
    if (!userDomain) return true;
    const emailDomain = email.split('@')[1];
    return emailDomain === userDomain;
  };

  // Get current member role
  const currentMemberRole = members.find(m => m.user_id === user?.id)?.role;
  const isOwnerOrAdmin = currentMemberRole === 'owner' || currentMemberRole === 'admin';

  // Usage stats
  const usersUsed = members?.length || 0;
  const usagePercentage = (usersUsed / maxUsers) * 100;

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.user_id.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Member activity data for chart
  const memberActivityChartData = useMemo(() => {
    if (!members || !activityMetrics) return [];
    
    return members.slice(0, 10).map(member => {
      const metrics = getUserMetrics(member.user_id);
      return {
        name: `User ${member.user_id.slice(0, 4)}`,
        actions: metrics?.totalActions || 0,
        reports: metrics?.reportViews || 0,
        downloads: metrics?.downloads || 0,
      };
    });
  }, [members, activityMetrics, getUserMetrics]);

  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Por favor, insira um email");
      return;
    }

    if (!isValidDomain(inviteEmail)) {
      toast.error(`Email deve pertencer ao domínio @${userDomain}`, {
        description: "Apenas funcionários da mesma empresa podem ser convidados."
      });
      return;
    }

    if (usersUsed >= maxUsers) {
      toast.error(`Limite de utilizadores atingido (${maxUsers})`, {
        description: "Faça upgrade do plano para adicionar mais utilizadores."
      });
      return;
    }

    try {
      await sendInvitation.mutateAsync({ email: inviteEmail, role: inviteRole });
      
      // Send email notification
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'workspace_invite',
          recipientEmail: inviteEmail,
          data: {
            workspaceName: 'Workspace',
            inviterName: user?.email?.split('@')[0],
            inviteRole: inviteRole,
          }
        }
      });
      
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditRole = async () => {
    if (!selectedMember) return;
    try {
      await updateMemberRole.mutateAsync({ memberId: selectedMember.id, role: editRole });
      setShowEditDialog(false);
      setSelectedMember(null);
    } catch (error) {}
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      await removeMember.mutateAsync(selectedMember.id);
      setShowRemoveDialog(false);
      setSelectedMember(null);
    } catch (error) {}
  };

  const getStatusBadge = (userId: string) => {
    const presence = getUserPresence(userId);
    if (!presence) return { status: 'offline', color: 'bg-muted', label: 'Offline' };
    
    switch (presence.status) {
      case 'online':
        return { status: 'online', color: 'bg-emerald-500', label: 'Online' };
      case 'away':
        return { status: 'away', color: 'bg-amber-500', label: 'Ausente' };
      default:
        return { status: 'offline', color: 'bg-muted', label: 'Offline' };
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
      admin: 'bg-primary/20 text-primary border-primary/30',
      editor: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
      viewer: 'bg-muted text-muted-foreground border-muted',
    };
    const labels: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador',
    };
    return (
      <Badge variant="outline" className={styles[role] || styles.viewer}>
        {labels[role] || role}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-amber-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-primary" />;
      case 'editor': return <Edit2 className="h-4 w-4 text-emerald-500" />;
      default: return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Usage Stats */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Gestão Corporativa de Equipa
          </h3>
          {userDomain && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Domínio: @{userDomain}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <Card className="flex-1 lg:flex-initial bg-card/50 border-border/50 p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano {planName}</p>
                <p className="text-sm font-semibold text-foreground">
                  {usersUsed}/{maxUsers} utilizadores
                </p>
              </div>
            </div>
            <Progress value={usagePercentage} className="mt-2 h-1.5" />
          </Card>
          
          <Card className="bg-emerald-500/10 border-emerald-500/30 p-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">{onlineUsersCount} online</span>
            </div>
          </Card>
          
          {isOwnerOrAdmin && (
            <Button 
              onClick={() => setShowInviteDialog(true)} 
              className="gap-2"
              disabled={usersUsed >= maxUsers}
            >
              <UserPlus className="h-4 w-4" />
              Convidar
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade Banner if near limit */}
      {usagePercentage >= 80 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {usersUsed >= maxUsers ? 'Limite de utilizadores atingido' : 'Quase no limite de utilizadores'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Faça upgrade para adicionar mais membros à equipa
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                Ver Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Membros ({members?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                A carregar membros...
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const presence = getUserPresence(member.user_id);
                const metrics = getUserMetrics(member.user_id);
                const statusInfo = getStatusBadge(member.user_id);

                return (
                  <Card key={member.id} className="bg-card border-border overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              {getRoleIcon(member.role)}
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${statusInfo.color}`} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {statusInfo.label}
                                  {presence && presence.status !== 'online' && (
                                    <span className="block text-xs text-muted-foreground">
                                      Visto {formatDistanceToNow(new Date(presence.last_seen_at), { locale: pt, addSuffix: true })}
                                    </span>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.user_id === user?.id ? "Você" : `Utilizador ${member.user_id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Desde {format(new Date(member.joined_at), "dd MMM yyyy", { locale: pt })}
                            </p>
                          </div>
                        </div>
                        {getRoleBadge(member.role)}
                      </div>

                      {/* Activity Stats */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{metrics?.totalActions || 0}</p>
                          <p className="text-xs text-muted-foreground">Ações</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{metrics?.reportViews || 0}</p>
                          <p className="text-xs text-muted-foreground">Relatórios</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{metrics?.downloads || 0}</p>
                          <p className="text-xs text-muted-foreground">Downloads</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {isOwnerOrAdmin && member.role !== 'owner' && member.user_id !== user?.id && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setEditRole(member.role);
                              setShowEditDialog(true);
                            }}
                            className="flex-1"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveDialog(true);
                            }}
                            className="flex-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Nenhum membro encontrado
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Convites Pendentes ({pendingInvitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expira em {format(new Date(invitation.expires_at), "dd MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(invitation.role)}
                      {isOwnerOrAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation.mutate(invitation.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Atividade Recente da Equipa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberActivityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="actions" name="Ações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reports" name="Relatórios" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downloads" name="Downloads" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {activityMetrics?.reduce((sum, m) => sum + (m.action_count || 0), 0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total de Ações</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Eye className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {activityMetrics?.filter(m => m.action_type === 'view_report').reduce((sum, m) => sum + (m.action_count || 0), 0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Relatórios Vistos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Download className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {activityMetrics?.filter(m => m.action_type === 'download').reduce((sum, m) => sum + (m.action_count || 0), 0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Ranking de Utilização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members?.slice(0, 5).map((member, index) => {
                const metrics = getUserMetrics(member.user_id);
                const totalActions = metrics?.totalActions || 0;
                const maxActions = Math.max(...(members?.map(m => getUserMetrics(m.user_id)?.totalActions || 0) || [1])) || 1;
                
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {member.user_id === user?.id ? "Você" : `Utilizador ${member.user_id.slice(0, 8)}`}
                        </p>
                        <span className="text-sm text-muted-foreground">{totalActions} ações</span>
                      </div>
                      <Progress value={(totalActions / maxActions) * 100} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
            <DialogDescription>
              Envie um convite para um colega de trabalho se juntar ao workspace.
              {userDomain && ` Apenas emails @${userDomain} são permitidos.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Funcionário</Label>
              <Input
                id="email"
                type="email"
                placeholder={userDomain ? `exemplo@${userDomain}` : "email@empresa.com"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              {inviteEmail && !isValidDomain(inviteEmail) && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Email deve pertencer ao domínio @{userDomain}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={!inviteEmail || (userDomain && !isValidDomain(inviteEmail)) || sendInvitation.isPending}
            >
              {sendInvitation.isPending ? "A enviar..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função</DialogTitle>
            <DialogDescription>
              Altere a função deste membro no workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editRole">Nova Função</Label>
            <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditRole} disabled={updateMemberRole.isPending}>
              {updateMemberRole.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover este membro do workspace? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeMember.isPending ? "A remover..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
