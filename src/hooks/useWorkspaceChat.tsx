import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WorkspaceMessage {
  id: string;
  workspace_id: string;
  user_id: string;
  content: string;
  message_type: string;
  reply_to: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
}

export interface PrivateMessage {
  id: string;
  workspace_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export function useWorkspaceMessages(workspaceId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['workspace-messages', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as WorkspaceMessage[];
    },
    enabled: !!workspaceId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`workspace-messages-${workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_messages',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspace-messages', workspaceId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, replyTo }: { content: string; replyTo?: string }) => {
      if (!workspaceId || !user?.id) throw new Error('Invalid');
      const { data, error } = await supabase
        .from('workspace_messages')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          content,
          reply_to: replyTo || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-messages', workspaceId] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('workspace_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-messages', workspaceId] });
    },
  });

  const editMessage = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('workspace_messages')
        .update({ content, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-messages', workspaceId] });
    },
  });

  return { messages: messages || [], isLoading, sendMessage, deleteMessage, editMessage };
}

export function usePrivateMessages(workspaceId: string | null, otherUserId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['private-messages', workspaceId, otherUserId],
    queryFn: async () => {
      if (!workspaceId || !otherUserId || !user?.id) return [];
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as PrivateMessage[];
    },
    enabled: !!workspaceId && !!otherUserId,
  });

  // Realtime
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`private-messages-${workspaceId}-${otherUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['private-messages', workspaceId, otherUserId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, otherUserId, queryClient]);

  const sendPrivateMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!workspaceId || !user?.id || !otherUserId) throw new Error('Invalid');
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          workspace_id: workspaceId,
          sender_id: user.id,
          recipient_id: otherUserId,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-messages', workspaceId, otherUserId] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const markAsRead = useCallback(async () => {
    if (!workspaceId || !user?.id || !otherUserId) return;
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('workspace_id', workspaceId)
      .eq('sender_id', otherUserId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  }, [workspaceId, user?.id, otherUserId]);

  return { messages: messages || [], isLoading, sendPrivateMessage, markAsRead };
}

export function useUnreadCounts(workspaceId: string | null) {
  const { user } = useAuth();

  const { data: unreadCounts } = useQuery({
    queryKey: ['unread-counts', workspaceId],
    queryFn: async () => {
      if (!workspaceId || !user?.id) return {};
      const { data, error } = await supabase
        .from('private_messages')
        .select('sender_id')
        .eq('workspace_id', workspaceId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      return counts;
    },
    enabled: !!workspaceId && !!user?.id,
    refetchInterval: 10000,
  });

  return { unreadCounts: unreadCounts || {} };
}
