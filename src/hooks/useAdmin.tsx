import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return profiles;
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUserRequests() {
  return useQuery({
    queryKey: ["userRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useDataUpdates() {
  return useQuery({
    queryKey: ["dataUpdates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_updates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isApproved }: { userId: string; isApproved: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: isApproved })
        .eq("id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Status do usuário atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      title, 
      message, 
      type = "info",
      isGlobal = false 
    }: { 
      userId?: string; 
      title: string; 
      message: string; 
      type?: string;
      isGlobal?: boolean;
    }) => {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId || null,
          title,
          message,
          type,
          is_global: isGlobal,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificação enviada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao enviar notificação: " + error.message);
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      response, 
      status 
    }: { 
      requestId: string; 
      response: string; 
      status: string;
    }) => {
      const { error } = await supabase
        .from("user_requests")
        .update({ 
          admin_response: response, 
          status,
          responded_by: user?.id 
        })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRequests"] });
      toast.success("Resposta enviada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao enviar resposta: " + error.message);
    },
  });
}
