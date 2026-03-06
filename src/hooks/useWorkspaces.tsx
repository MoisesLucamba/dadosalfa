import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string | null;
  joined_at: string;
  // Joined profile data
  profile?: {
    contact_name: string;
    company_name: string;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

export function useWorkspaces() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all workspaces for the current user
  const { data: workspaces, isLoading, error, refetch } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workspace[];
    },
    enabled: !!user?.id,
  });

  // Create workspace mutation
  const createWorkspace = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: workspaceId, error } = await supabase
        .rpc('create_workspace', {
          _name: name,
          _description: description || null,
        });

      if (error) throw error;

      // Fetch the created workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (fetchError) throw fetchError;
      return workspace as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast.error('Erro ao criar workspace');
    },
  });

  // Update workspace mutation
  const updateWorkspace = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
      const updates: Partial<Workspace> = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;

      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace atualizado!');
    },
    onError: (error) => {
      console.error('Error updating workspace:', error);
      toast.error('Erro ao atualizar workspace');
    },
  });

  // Delete workspace mutation
  const deleteWorkspace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace eliminado!');
    },
    onError: (error) => {
      console.error('Error deleting workspace:', error);
      toast.error('Erro ao eliminar workspace');
    },
  });

  return {
    workspaces: workspaces || [],
    isLoading,
    error,
    refetch,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}

export function useWorkspaceMembers(workspaceId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data as WorkspaceMember[];
    },
    enabled: !!workspaceId,
  });

  // Add member mutation
  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: WorkspaceMember['role'] }) => {
      if (!workspaceId || !user?.id) throw new Error('Invalid request');

      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: 'member_added',
        details: { added_user_id: userId, role },
      });

      return data as WorkspaceMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Membro adicionado!');
    },
    onError: (error) => {
      console.error('Error adding member:', error);
      toast.error('Erro ao adicionar membro');
    },
  });

  // Update member role mutation
  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceMember['role'] }) => {
      const { data, error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data as WorkspaceMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Função atualizada!');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar função');
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!workspaceId || !user?.id) throw new Error('Invalid request');

      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: 'member_removed',
        details: { removed_member_id: memberId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Membro removido!');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    },
  });

  return {
    members: members || [],
    isLoading,
    refetch,
    addMember,
    updateMemberRole,
    removeMember,
  };
}

export function useWorkspaceInvitations(workspaceId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkspaceInvitation[];
    },
    enabled: !!workspaceId,
  });

  // Send invitation mutation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: WorkspaceInvitation['role'] }) => {
      if (!workspaceId || !user?.id) throw new Error('Invalid request');

      const { data, error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: 'invitation_sent',
        details: { email, role },
      });

      return data as WorkspaceInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
      toast.success('Convite enviado!');
    },
    onError: (error) => {
      console.error('Error sending invitation:', error);
      toast.error('Erro ao enviar convite');
    },
  });

  // Cancel invitation mutation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
      toast.success('Convite cancelado!');
    },
    onError: (error) => {
      console.error('Error canceling invitation:', error);
      toast.error('Erro ao cancelar convite');
    },
  });

  return {
    invitations: invitations || [],
    isLoading,
    refetch,
    sendInvitation,
    cancelInvitation,
  };
}

export function useWorkspaceActivity(workspaceId: string | null) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['workspace-activity', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_activity')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WorkspaceActivity[];
    },
    enabled: !!workspaceId,
  });

  return {
    activities: activities || [],
    isLoading,
  };
}

export function useWorkspaceReports(workspaceId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sharedReports, isLoading, refetch } = useQuery({
    queryKey: ['workspace-reports', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_reports')
        .select(`
          *,
          report:reports(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('shared_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  // Share report to workspace
  const shareReport = useMutation({
    mutationFn: async (reportId: string) => {
      if (!workspaceId || !user?.id) throw new Error('Invalid request');

      const { data, error } = await supabase
        .from('workspace_reports')
        .insert({
          workspace_id: workspaceId,
          report_id: reportId,
          shared_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: 'report_shared',
        details: { report_id: reportId },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-reports', workspaceId] });
      toast.success('Relatório partilhado no workspace!');
    },
    onError: (error) => {
      console.error('Error sharing report:', error);
      toast.error('Erro ao partilhar relatório');
    },
  });

  // Remove shared report
  const unshareReport = useMutation({
    mutationFn: async (workspaceReportId: string) => {
      const { error } = await supabase
        .from('workspace_reports')
        .delete()
        .eq('id', workspaceReportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-reports', workspaceId] });
      toast.success('Relatório removido do workspace!');
    },
    onError: (error) => {
      console.error('Error unsharing report:', error);
      toast.error('Erro ao remover relatório');
    },
  });

  return {
    sharedReports: sharedReports || [],
    isLoading,
    refetch,
    shareReport,
    unshareReport,
  };
}
