import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Settings, 
  Crown, 
  Shield, 
  Edit3, 
  Eye,
  Mail,
  Trash2,
  X,
  Building2,
  Clock,
  Activity,
  FileText,
  Share2,
  UserPlus,
  MoreVertical,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useWorkspaces, 
  useWorkspaceMembers, 
  useWorkspaceInvitations,
  useWorkspaceActivity,
  Workspace 
} from '@/hooks/useWorkspaces';

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  viewer: Eye,
};

const roleLabels = {
  owner: 'Proprietário',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
};

const roleColors = {
  owner: 'bg-amber-500/20 text-amber-400',
  admin: 'bg-primary/20 text-primary',
  editor: 'bg-success/20 text-success',
  viewer: 'bg-muted text-muted-foreground',
};

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspacePanel({ isOpen, onClose }: WorkspacePanelProps) {
  const { workspaces, isLoading, createWorkspace, deleteWorkspace } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  const { members, removeMember, updateMemberRole } = useWorkspaceMembers(selectedWorkspace?.id || null);
  const { invitations, sendInvitation, cancelInvitation } = useWorkspaceInvitations(selectedWorkspace?.id || null);
  const { activities } = useWorkspaceActivity(selectedWorkspace?.id || null);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    await createWorkspace.mutateAsync({
      name: newWorkspaceName,
      description: newWorkspaceDescription || undefined,
    });
    
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setShowCreateDialog(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    await sendInvitation.mutateAsync({
      email: inviteEmail,
      role: inviteRole,
    });
    
    setInviteEmail('');
    setShowInviteDialog(false);
  };

  const formatActivityAction = (action: string) => {
    const actions: Record<string, string> = {
      member_added: 'adicionou um membro',
      member_removed: 'removeu um membro',
      invitation_sent: 'enviou um convite',
      report_shared: 'partilhou um relatório',
      workspace_updated: 'atualizou o workspace',
    };
    return actions[action] || action;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Workspaces</h2>
                    <p className="text-sm text-muted-foreground">Gerencie equipes e colaboração</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
                {!selectedWorkspace ? (
                  // Workspace List View
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Seus Workspaces</h3>
                      <Button 
                        size="sm" 
                        onClick={() => setShowCreateDialog(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Novo Workspace
                      </Button>
                    </div>

                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-20 rounded-lg" />
                        ))}
                      </div>
                    ) : workspaces.length > 0 ? (
                      <div className="space-y-3">
                        {workspaces.map((workspace) => (
                          <motion.div
                            key={workspace.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedWorkspace(workspace)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground">{workspace.name}</h4>
                                  {workspace.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {workspace.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedWorkspace(workspace)}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Gerir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Eliminar este workspace?')) {
                                        deleteWorkspace.mutate(workspace.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Criado {formatDate(workspace.created_at)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h4 className="text-lg font-medium text-foreground mb-2">Nenhum workspace</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Crie um workspace para colaborar com sua equipe
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Workspace
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Workspace Detail View
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedWorkspace(null)}
                      >
                        ← Voltar
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{selectedWorkspace.name}</h3>
                        {selectedWorkspace.description && (
                          <p className="text-sm text-muted-foreground">{selectedWorkspace.description}</p>
                        )}
                      </div>
                    </div>

                    <Tabs defaultValue="members" className="w-full">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="members" className="gap-2">
                          <Users className="w-4 h-4" />
                          Membros
                        </TabsTrigger>
                        <TabsTrigger value="invitations" className="gap-2">
                          <Mail className="w-4 h-4" />
                          Convites
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2">
                          <Activity className="w-4 h-4" />
                          Atividade
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="members" className="mt-4 space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => setShowInviteDialog(true)}
                            className="gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Convidar
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {members.map((member) => {
                            const RoleIcon = roleIcons[member.role];
                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">
                                      {member.user_id.substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {member.profile?.contact_name || 'Utilizador'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {member.profile?.company_name || member.user_id.substring(0, 8)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${roleColors[member.role]}`}>
                                    <RoleIcon className="w-3 h-3" />
                                    {roleLabels[member.role]}
                                  </span>
                                  {member.role !== 'owner' && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => updateMemberRole.mutate({ memberId: member.id, role: 'admin' })}>
                                          <Shield className="w-4 h-4 mr-2" />
                                          Promover a Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateMemberRole.mutate({ memberId: member.id, role: 'editor' })}>
                                          <Edit3 className="w-4 h-4 mr-2" />
                                          Definir como Editor
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateMemberRole.mutate({ memberId: member.id, role: 'viewer' })}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          Definir como Visualizador
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => removeMember.mutate(member.id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Remover
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="invitations" className="mt-4 space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => setShowInviteDialog(true)}
                            className="gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Enviar Convite
                          </Button>
                        </div>

                        {invitations.length > 0 ? (
                          <div className="space-y-2">
                            {invitations.map((invitation) => (
                              <div
                                key={invitation.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                              >
                                <div>
                                  <p className="text-sm font-medium text-foreground">{invitation.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      invitation.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                      invitation.status === 'accepted' ? 'bg-success/20 text-success' :
                                      'bg-destructive/20 text-destructive'
                                    }`}>
                                      {invitation.status === 'pending' ? 'Pendente' :
                                       invitation.status === 'accepted' ? 'Aceite' : 'Expirado'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {roleLabels[invitation.role as keyof typeof roleLabels]}
                                    </span>
                                  </div>
                                </div>
                                {invitation.status === 'pending' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => cancelInvitation.mutate(invitation.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum convite pendente</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="activity" className="mt-4">
                        {activities.length > 0 ? (
                          <div className="space-y-3">
                            {activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20"
                              >
                                <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm text-foreground">
                                    {formatActivityAction(activity.action)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(activity.created_at)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma atividade recente</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Workspace</DialogTitle>
            <DialogDescription>
              Crie um espaço de trabalho para colaborar com sua equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Workspace</label>
              <Input
                placeholder="Ex: Equipa de Análise"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                placeholder="Descreva o propósito do workspace"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || createWorkspace.isPending}
            >
              {createWorkspace.isPending ? 'Criando...' : 'Criar Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>
              Envie um convite para adicionar um novo membro ao workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select value={inviteRole} onValueChange={(v: 'admin' | 'editor' | 'viewer') => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Editor
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
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
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim() || sendInvitation.isPending}
            >
              {sendInvitation.isPending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
