import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para atualização automática de riscos:
 * - Riscos geopolíticos: atualização a cada 1 hora
 * - Riscos gerais: atualização diária às 6h UTC
 */
export function useRealTimeRisks() {
  const lastGeopoliticalUpdate = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateRisks = useCallback(async (forceUpdate = false) => {
    try {
      const now = new Date();
      const hoursSinceLastUpdate = lastGeopoliticalUpdate.current
        ? (now.getTime() - lastGeopoliticalUpdate.current.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Update geopolitical risks every hour or on force
      if (forceUpdate || hoursSinceLastUpdate >= 1) {
        console.log("[RealTimeRisks] Updating geopolitical risks...");
        
        const { data, error } = await supabase.functions.invoke('analyze-risks');
        
        if (error) {
          console.error("[RealTimeRisks] Error updating risks:", error);
          return false;
        }

        if (data?.success) {
          lastGeopoliticalUpdate.current = now;
          console.log("[RealTimeRisks] Geopolitical risks updated successfully");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("[RealTimeRisks] Error:", error);
      return false;
    }
  }, []);

  // Setup automatic hourly updates
  useEffect(() => {
    // Initial update on mount
    updateRisks(true);

    // Set interval for hourly updates (1 hour = 3600000 ms)
    intervalRef.current = setInterval(() => {
      updateRisks();
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateRisks]);

  return { updateRisks };
}

/**
 * Hook para usar nos componentes que precisam de dados de risco atualizados
 */
export function useRiskAutoRefresh(onRefresh?: () => void) {
  const lastRefresh = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Refresh every 5 minutes for UI data
    intervalRef.current = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onRefresh]);

  const forceRefresh = useCallback(() => {
    lastRefresh.current = new Date();
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return { forceRefresh, lastRefresh: lastRefresh.current };
}
