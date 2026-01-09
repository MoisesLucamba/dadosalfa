import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiConfig {
  oil_price_api: { enabled: boolean; name: string; description: string };
  eia_api: { enabled: boolean; name: string; description: string };
  fred_api: { enabled: boolean; name: string; description: string };
  auto_sync: { enabled: boolean; interval: string; time: string };
}

interface PlatformConfig {
  maintenance_mode: boolean;
  allow_signups: boolean;
  require_approval: boolean;
  max_users: number;
}

interface NotificationConfig {
  email_notifications: boolean;
  sync_alerts: boolean;
  price_alerts: boolean;
}

export interface SystemSettings {
  api_config?: ApiConfig;
  platform_config?: PlatformConfig;
  notification_config?: NotificationConfig;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) throw error;

      const settings: Record<string, any> = {};
      for (const row of data || []) {
        settings[row.setting_key] = row.setting_value;
      }

      return settings as SystemSettings;
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      settingKey, 
      settingValue 
    }: { 
      settingKey: string; 
      settingValue: any;
    }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ 
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq("setting_key", settingKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      toast.success("Configuração atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configuração: " + error.message);
    },
  });
}

export function usePromoteToSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc("promote_to_super_admin", {
        _target_user_id: targetUserId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithEmail"] });
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast.success("Utilizador promovido a Super Admin com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao promover utilizador: " + error.message);
    },
  });
}

export function useDemoteFromSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc("demote_from_super_admin", {
        _target_user_id: targetUserId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithEmail"] });
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast.success("Utilizador removido de Super Admin");
    },
    onError: (error) => {
      toast.error("Erro ao remover Super Admin: " + error.message);
    },
  });
}

export function useCronJobs() {
  return useQuery({
    queryKey: ["cronJobs"],
    queryFn: async () => {
      // This would need a server-side function to query cron jobs
      // For now, return static info about configured jobs
      return [
        {
          name: "sync-all-data-daily",
          schedule: "0 6 * * *",
          description: "Sincronização diária de todos os dados às 6h UTC",
          active: true,
        },
      ];
    },
  });
}

export function useTriggerSync() {
  return useMutation({
    mutationFn: async (syncType: 'all' | 'prices' | 'production' | 'exports' | 'risks') => {
      const functionName = syncType === 'all' 
        ? 'sync-all-data' 
        : `fetch-${syncType === 'prices' ? 'oil-prices' : syncType}-data`;
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'sync' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, syncType) => {
      toast.success(`Sincronização de ${syncType} iniciada com sucesso`);
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });
}
