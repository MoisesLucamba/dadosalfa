import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PredefinedCompany {
  id: string;
  name: string;
  sector: string;
  email_domain: string;
  country: string;
}

export interface Organization {
  id: string;
  name: string;
  nif: string;
  sector: string;
  email_domain: string;
  country: string;
  contact_email: string;
  contact_phone: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export function usePredefinedCompanies() {
  return useQuery({
    queryKey: ['predefined-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predefined_companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as PredefinedCompany[];
    },
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_approved', true)
        .order('name');
      
      if (error) throw error;
      return data as Organization[];
    },
  });
}

export function useOrganizationByDomain(emailDomain: string) {
  return useQuery({
    queryKey: ['organization-by-domain', emailDomain],
    queryFn: async () => {
      if (!emailDomain) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('email_domain', emailDomain)
        .eq('is_approved', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      return data as Organization;
    },
    enabled: !!emailDomain,
  });
}
