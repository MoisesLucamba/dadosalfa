import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  prices: { success: boolean; error: string | null };
  production: { success: boolean; error: string | null };
  exports: { success: boolean; error: string | null };
  risks: { success: boolean; error: string | null };
}

interface SyncResponse {
  success: boolean;
  results: SyncResult;
  timestamp: string;
}

export const useDataSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult | null>(null);

  const syncAllData = useCallback(async () => {
    setIsSyncing(true);
    
    try {
      toast.loading('Sincronizando dados em tempo real...', { id: 'sync' });

      const { data, error } = await supabase.functions.invoke<SyncResponse>('sync-all-data', {
        method: 'POST'
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Todos os dados foram atualizados com sucesso!', { id: 'sync' });
      } else {
        const failedSyncs = Object.entries(data?.results || {})
          .filter(([_, result]) => !result.success)
          .map(([key]) => key);
        
        if (failedSyncs.length > 0) {
          toast.warning(`Dados parcialmente atualizados. Falhas: ${failedSyncs.join(', ')}`, { id: 'sync' });
        } else {
          toast.success('Dados atualizados!', { id: 'sync' });
        }
      }

      setSyncResults(data?.results || null);
      setLastSync(data?.timestamp || new Date().toISOString());

      return data;
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar dados. Tente novamente.', { id: 'sync' });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncPrices = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading('Atualizando preços...', { id: 'sync-prices' });
      
      const { data, error } = await supabase.functions.invoke('fetch-oil-prices', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast.success('Preços atualizados!', { id: 'sync-prices' });
      return data;
    } catch (error) {
      console.error('Price sync error:', error);
      toast.error('Erro ao atualizar preços', { id: 'sync-prices' });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncProduction = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading('Atualizando produção...', { id: 'sync-production' });
      
      const { data, error } = await supabase.functions.invoke('fetch-production-data', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast.success('Produção atualizada!', { id: 'sync-production' });
      return data;
    } catch (error) {
      console.error('Production sync error:', error);
      toast.error('Erro ao atualizar produção', { id: 'sync-production' });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncExports = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading('Atualizando exportações...', { id: 'sync-exports' });
      
      const { data, error } = await supabase.functions.invoke('fetch-export-data', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast.success('Exportações atualizadas!', { id: 'sync-exports' });
      return data;
    } catch (error) {
      console.error('Export sync error:', error);
      toast.error('Erro ao atualizar exportações', { id: 'sync-exports' });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncRisks = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading('Atualizando riscos...', { id: 'sync-risks' });
      
      const { data, error } = await supabase.functions.invoke('fetch-risk-data', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast.success('Riscos atualizados!', { id: 'sync-risks' });
      return data;
    } catch (error) {
      console.error('Risk sync error:', error);
      toast.error('Erro ao atualizar riscos', { id: 'sync-risks' });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSync,
    syncResults,
    syncAllData,
    syncPrices,
    syncProduction,
    syncExports,
    syncRisks
  };
};
