import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DataUpdate {
  id: string;
  data_type: string;
  source: string;
  records_updated: number | null;
  created_at: string;
  notes: string | null;
}

export function useLatestDataUpdates() {
  return useQuery({
    queryKey: ['data-updates-latest'],
    queryFn: async () => {
      // Get latest update for each data type
      const { data, error } = await supabase
        .from('data_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Group by data_type and get latest for each
      const latestByType: Record<string, DataUpdate> = {};
      for (const update of data || []) {
        if (!latestByType[update.data_type]) {
          latestByType[update.data_type] = update;
        }
      }

      return latestByType;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function formatLastUpdate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays} dias`;
  
  return date.toLocaleDateString('pt-AO', { 
    day: '2-digit', 
    month: 'short' 
  });
}

export function getSourceShortName(source: string): string {
  if (source.includes('Oil Price API')) return 'Oil Price API';
  if (source.includes('EIA')) return 'EIA';
  if (source.includes('FRED')) return 'FRED';
  if (source.includes('OPEC')) return 'OPEC';
  if (source.includes('Cached')) return 'Cache';
  if (source.includes('Calculated')) return 'Calculado';
  return source.split(' ')[0];
}
