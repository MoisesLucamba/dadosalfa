import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Check,
  Clock,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMembers, useWorkspaceInvitations, WorkspaceMember } from "@/hooks/useWorkspaces";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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

interface TeamManagementProps {
  workspaceId: string;
  companyDomain?: string;
}

interface TeamMemberProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  name?: string;
  job_title?: string;
}

export const TeamManagement = ({ workspaceId, companyDomain }: TeamManagementProps) => {
  const { user } = useAuth();
  const { members, addMember, updateMemberRole, removeMember, isLoading } = useWorkspaceMembers(workspaceId);
  const { invitations, sendInvitation, cancelInvitation } = useWorkspaceInvitations(workspaceId);
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberProfile | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [editRole, setEditRole] = useState<WorkspaceMember['role']>("viewer");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract company domain from user's email
  const userDomain = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[1];
    }
    return companyDomain;
  }, [user?.email, companyDomain]);

  // Validate email domain
  const isValidDomain = (email: string) => {
    if (!userDomain) return true;
    const emailDomain = email.split('@')[1];
    return emailDomain === userDomain;
  };

  // Get current member role
  const currentMemberRole = members.find(m => m.user_id === user?.id)?.role;
  const isOwnerOrAdmin = currentMemberRole === 'owner' || currentMemberRole === 'admin';

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.user_id.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Pending invitations
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

    try {
      await sendInvitation.mutateAsync({ email: inviteEmail, role: inviteRole });
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
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await removeMember.mutateAsync(selectedMember.id);
      setShowRemoveDialog(false);
      setSelectedMember(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = (member: any) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setShowEditDialog(true);
  };

  const openRemoveDialog = (member: any) => {
    setSelectedMember(member);
    setShowRemoveDialog(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-amber-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-primary" />;
      case 'editor': return <Edit2 className="h-4 w-4 text-emerald-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-amber-500/20 text-amber-500',
      admin: 'bg-primary/20 text-primary',
      editor: 'bg-emerald-500/20 text-emerald-500',
      viewer: 'bg-muted text-muted-foreground',
    };
    const labels: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador',
    };
    return (
      <Badge variant="secondary" className={styles[role] || styles.viewer}>
        {labels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestão de Equipa
          </h3>
          {userDomain && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Domínio: @{userDomain}
            </p>
          )}
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Funcionário
          </Button>
        )}
      </div>

      {/* Domain Restriction Notice */}
      {userDomain && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Workspace Empresarial Seguro
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas utilizadores com email @{userDomain} podem ser convidados para este workspace. 
                  Isto garante que apenas funcionários da sua empresa tenham acesso aos dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Members List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Membros ({members.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              A carregar membros...
            </div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.user_id === user?.id ? "Você" : `Utilizador ${member.user_id.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde {format(new Date(member.joined_at), "dd MMM yyyy", { locale: pt })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  {isOwnerOrAdmin && member.role !== 'owner' && member.user_id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRemoveDialog(member)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro encontrado
            </div>
          )}
        </CardContent>
      </Card>

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
                <div className="flex items-center gap-3">
                  {getRoleBadge(invitation.role)}
                  {isOwnerOrAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation.mutate(invitation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4 text-emerald-500" />
                      Editor
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Visualizador
                    </div>
                  </SelectItem>
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
