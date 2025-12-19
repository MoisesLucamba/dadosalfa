import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

// User Profile
export function useUserProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      contact_name?: string;
      contact_phone?: string;
      contact_role?: string;
      company_name?: string;
      nif?: string;
      country?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });
}

// User Alerts for notifications
export function useUserNotificationSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["notificationSettings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_alerts")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ alertType, settings }: { 
      alertType: string; 
      settings: { 
        is_enabled?: boolean; 
        notify_email?: boolean; 
        notify_app?: boolean; 
        threshold_value?: number;
      } 
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Check if alert type exists
      const { data: existing } = await supabase
        .from("user_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("alert_type", alertType)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from("user_alerts")
          .update(settings)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_alerts")
          .insert({
            user_id: user.id,
            alert_type: alertType,
            ...settings,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationSettings"] });
      toast.success("Configurações de notificação atualizadas");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configurações: " + error.message);
    },
  });
}

// Password change
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao alterar senha: " + error.message);
    },
  });
}

// Export user data
export function useExportUserData() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Fetch all user-related data
      const [profileResult, alertsResult, requestsResult, reportsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_alerts").select("*").eq("user_id", user.id),
        supabase.from("user_requests").select("*").eq("user_id", user.id),
        supabase.from("reports").select("*").eq("user_id", user.id),
      ]);
      
      const exportData = {
        profile: profileResult.data,
        alerts: alertsResult.data,
        requests: requestsResult.data,
        reports: reportsResult.data,
        exportedAt: new Date().toISOString(),
      };
      
      // Create and download CSV
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alphadata-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return exportData;
    },
    onSuccess: () => {
      toast.success("Dados exportados com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao exportar dados: " + error.message);
    },
  });
}

// Delete account
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Note: Full account deletion would require a backend function
      // For now, just sign out
    },
    onSuccess: () => {
      toast.success("Conta encerrada");
      window.location.href = "/auth";
    },
    onError: (error) => {
      toast.error("Erro ao encerrar conta: " + error.message);
    },
  });
}
