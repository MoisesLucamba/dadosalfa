import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Risk Data
export function useRiskData() {
  return useQuery({
    queryKey: ["riskData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_data")
        .select("*")
        .order("data_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddRiskData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      category: string;
      score: number;
      trend?: string;
      description?: string;
      source?: string;
      data_date: string;
    }) => {
      const { error } = await supabase
        .from("risk_data")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskData"] });
      toast.success("Dados de risco adicionados");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dados: " + error.message);
    },
  });
}

export function useUpdateRiskData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("risk_data")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskData"] });
      toast.success("Dados de risco atualizados");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados: " + error.message);
    },
  });
}

export function useDeleteRiskData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_data")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskData"] });
      toast.success("Dados de risco removidos");
    },
    onError: (error) => {
      toast.error("Erro ao remover dados: " + error.message);
    },
  });
}

// Risk Alerts
export function useRiskAlerts() {
  return useQuery({
    queryKey: ["riskAlerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddRiskAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      alert_type: string;
      region?: string;
      impact?: string;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from("risk_alerts")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskAlerts"] });
      toast.success("Alerta de risco adicionado");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar alerta: " + error.message);
    },
  });
}

export function useUpdateRiskAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("risk_alerts")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskAlerts"] });
      toast.success("Alerta de risco atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar alerta: " + error.message);
    },
  });
}

export function useDeleteRiskAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_alerts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskAlerts"] });
      toast.success("Alerta de risco removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover alerta: " + error.message);
    },
  });
}

// Country Risk
export function useCountryRisk() {
  return useQuery({
    queryKey: ["countryRisk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_risk")
        .select("*")
        .order("score", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCountryRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      country: string;
      score: number;
      trend?: string;
      data_date: string;
    }) => {
      const { error } = await supabase
        .from("country_risk")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countryRisk"] });
      toast.success("Risco de país adicionado");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dados: " + error.message);
    },
  });
}

export function useUpdateCountryRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("country_risk")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countryRisk"] });
      toast.success("Risco de país atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados: " + error.message);
    },
  });
}

export function useDeleteCountryRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("country_risk")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countryRisk"] });
      toast.success("Risco de país removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover dados: " + error.message);
    },
  });
}

// Regulatory Events
export function useRegulatoryEvents() {
  return useQuery({
    queryKey: ["regulatoryEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regulatory_events")
        .select("*")
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddRegulatoryEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      event_date?: string;
      status?: string;
      impact_level?: string;
    }) => {
      const { error } = await supabase
        .from("regulatory_events")
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryEvents"] });
      toast.success("Evento regulatório adicionado");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar evento: " + error.message);
    },
  });
}

export function useUpdateRegulatoryEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("regulatory_events")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryEvents"] });
      toast.success("Evento regulatório atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });
}

export function useDeleteRegulatoryEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("regulatory_events")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryEvents"] });
      toast.success("Evento regulatório removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover evento: " + error.message);
    },
  });
}
