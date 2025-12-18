import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

// Production Data
export function useProductionData() {
  return useQuery({
    queryKey: ["productionData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_data")
        .select("*")
        .order("data_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddProductionData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      operator: string;
      block: string;
      field?: string;
      daily_production: number;
      monthly_production: number;
      decline_rate?: number;
      status?: string;
      data_date: string;
    }) => {
      const { error } = await supabase
        .from("production_data")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionData"] });
      toast.success("Dados de produção adicionados");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dados: " + error.message);
    },
  });
}

export function useUpdateProductionData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("production_data")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionData"] });
      toast.success("Dados de produção atualizados");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados: " + error.message);
    },
  });
}

export function useDeleteProductionData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("production_data")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionData"] });
      toast.success("Dados de produção removidos");
    },
    onError: (error) => {
      toast.error("Erro ao remover dados: " + error.message);
    },
  });
}

// Price Data
export function usePriceData() {
  return useQuery({
    queryKey: ["priceData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_data")
        .select("*")
        .order("data_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPriceData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      crude_type: string;
      price: number;
      change_percent?: number;
      volume?: number;
      data_date: string;
    }) => {
      const { error } = await supabase
        .from("price_data")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceData"] });
      toast.success("Dados de preço adicionados");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dados: " + error.message);
    },
  });
}

export function useUpdatePriceData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("price_data")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceData"] });
      toast.success("Dados de preço atualizados");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados: " + error.message);
    },
  });
}

export function useDeletePriceData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("price_data")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceData"] });
      toast.success("Dados de preço removidos");
    },
    onError: (error) => {
      toast.error("Erro ao remover dados: " + error.message);
    },
  });
}

// Export Data
export function useExportData() {
  return useQuery({
    queryKey: ["exportData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_data")
        .select("*")
        .order("data_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddExportData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      destination: string;
      volume: number;
      value_usd?: number;
      tanker_name?: string;
      departure_date?: string;
      arrival_date?: string;
      status?: string;
      data_date: string;
    }) => {
      const { error } = await supabase
        .from("export_data")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exportData"] });
      toast.success("Dados de exportação adicionados");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dados: " + error.message);
    },
  });
}

export function useUpdateExportData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("export_data")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exportData"] });
      toast.success("Dados de exportação atualizados");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados: " + error.message);
    },
  });
}

export function useDeleteExportData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("export_data")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exportData"] });
      toast.success("Dados de exportação removidos");
    },
    onError: (error) => {
      toast.error("Erro ao remover dados: " + error.message);
    },
  });
}

// Log data update
export function useLogDataUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      data_type: string;
      source: string;
      records_updated: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("data_updates")
        .insert({
          ...data,
          updated_by: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataUpdates"] });
    },
  });
}

// Notifications
export function useNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// User Alerts
export function useUserAlerts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["userAlerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAddUserAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      alert_type: string;
      threshold_value?: number;
      is_enabled?: boolean;
      notify_email?: boolean;
      notify_app?: boolean;
    }) => {
      const { error } = await supabase
        .from("user_alerts")
        .insert({
          ...data,
          user_id: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAlerts"] });
      toast.success("Alerta criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar alerta: " + error.message);
    },
  });
}

export function useUpdateUserAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("user_alerts")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAlerts"] });
      toast.success("Alerta atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar alerta: " + error.message);
    },
  });
}

export function useDeleteUserAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_alerts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAlerts"] });
      toast.success("Alerta removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover alerta: " + error.message);
    },
  });
}
