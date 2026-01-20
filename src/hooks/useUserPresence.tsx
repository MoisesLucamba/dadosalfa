import { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen_at: string;
  session_count: number;
  total_session_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface UserActivityMetric {
  id: string;
  user_id: string;
  workspace_id: string | null;
  action_type: string;
  action_count: number;
  date: string;
  created_at: string;
}

export function useUserPresence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch all presence data
  const { data: presenceData, isLoading } = useQuery({
    queryKey: ['user-presence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      return data as UserPresence[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update own presence
  const updatePresence = useMutation({
    mutationFn: async (status: 'online' | 'away' | 'offline') => {
      if (!user?.id) return;

      const { data: existing } = await supabase
        .from('user_presence')
        .select('id, session_count')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_presence')
          .update({
            status,
            last_seen_at: new Date().toISOString(),
            session_count: status === 'online' ? (existing.session_count || 0) + 1 : existing.session_count,
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_presence')
          .insert({
            user_id: user.id,
            status,
            last_seen_at: new Date().toISOString(),
            session_count: status === 'online' ? 1 : 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-presence'] });
    },
  });

  // Set up presence tracking and realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    // Set online status when component mounts
    updatePresence.mutate('online');

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-presence'] });
        }
      )
      .subscribe();

    setChannel(presenceChannel);

    // Update presence periodically (heartbeat)
    const heartbeat = setInterval(() => {
      updatePresence.mutate('online');
    }, 60000); // Every minute

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence.mutate('away');
      } else {
        updatePresence.mutate('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup - set offline when unmounting
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      presenceChannel.unsubscribe();
      
      // Set offline status
      if (user?.id) {
        supabase
          .from('user_presence')
          .update({ status: 'offline', last_seen_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .then(() => {});
      }
    };
  }, [user?.id]);

  // Get presence for specific user
  const getUserPresence = useCallback((userId: string): UserPresence | undefined => {
    return presenceData?.find(p => p.user_id === userId);
  }, [presenceData]);

  // Get online users count
  const onlineUsersCount = presenceData?.filter(p => p.status === 'online').length || 0;

  return {
    presenceData,
    isLoading,
    getUserPresence,
    onlineUsersCount,
    updatePresence: updatePresence.mutate,
  };
}

export function useUserActivityMetrics(workspaceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch activity metrics
  const { data: activityMetrics, isLoading } = useQuery({
    queryKey: ['user-activity-metrics', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('user_activity_metrics')
        .select('*')
        .order('date', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as UserActivityMetric[];
    },
    enabled: !!user?.id,
  });

  // Log activity
  const logActivity = useMutation({
    mutationFn: async ({ actionType, workspaceId: wId }: { actionType: string; workspaceId?: string }) => {
      if (!user?.id) return;

      const today = new Date().toISOString().split('T')[0];

      // Try to update existing record for today
      const { data: existing } = await supabase
        .from('user_activity_metrics')
        .select('id, action_count')
        .eq('user_id', user.id)
        .eq('action_type', actionType)
        .eq('date', today)
        .eq('workspace_id', wId || null)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_activity_metrics')
          .update({ action_count: (existing.action_count || 0) + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_activity_metrics')
          .insert({
            user_id: user.id,
            workspace_id: wId || null,
            action_type: actionType,
            action_count: 1,
            date: today,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-activity-metrics'] });
    },
  });

  // Aggregate metrics by user
  const getUserMetrics = useCallback((userId: string) => {
    if (!activityMetrics) return null;

    const userMetrics = activityMetrics.filter(m => m.user_id === userId);
    
    const totalActions = userMetrics.reduce((sum, m) => sum + (m.action_count || 0), 0);
    const reportViews = userMetrics
      .filter(m => m.action_type === 'view_report')
      .reduce((sum, m) => sum + (m.action_count || 0), 0);
    const downloads = userMetrics
      .filter(m => m.action_type === 'download')
      .reduce((sum, m) => sum + (m.action_count || 0), 0);
    const searches = userMetrics
      .filter(m => m.action_type === 'search')
      .reduce((sum, m) => sum + (m.action_count || 0), 0);

    // Get last 7 days activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const dailyActivity = last7Days.map(date => {
      const dayMetrics = userMetrics.filter(m => m.date === date);
      return {
        date,
        count: dayMetrics.reduce((sum, m) => sum + (m.action_count || 0), 0),
      };
    }).reverse();

    return {
      totalActions,
      reportViews,
      downloads,
      searches,
      dailyActivity,
    };
  }, [activityMetrics]);

  return {
    activityMetrics,
    isLoading,
    logActivity: logActivity.mutate,
    getUserMetrics,
  };
}
