/**
 * Global data refresh hook — simulates live data feed behavior.
 * Provides auto-varying metrics and a last-updated counter.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface LiveMetric {
  value: number;
  baseValue: number;
  variance: number; // percentage variance range
}

interface DataRefreshState {
  lastUpdated: number; // seconds since last refresh
  isLive: boolean;
  metrics: Record<string, number>;
}

/**
 * useDataRefresh — auto-refreshes numeric values with realistic variance
 * @param initialMetrics Record of metric names to { baseValue, variance }
 * @param intervalMs refresh interval (default 30s)
 */
export function useDataRefresh(
  initialMetrics: Record<string, { baseValue: number; variance: number }>,
  intervalMs: number = 30000
) {
  const metricsRef = useRef(initialMetrics);
  
  const computeValues = useCallback(() => {
    const result: Record<string, number> = {};
    for (const [key, { baseValue, variance }] of Object.entries(metricsRef.current)) {
      const delta = baseValue * (variance / 100) * (Math.random() * 2 - 1);
      result[key] = Math.round((baseValue + delta) * 100) / 100;
    }
    return result;
  }, []);

  const [state, setState] = useState<DataRefreshState>({
    lastUpdated: 0,
    isLive: true,
    metrics: computeValues(),
  });

  // Increment seconds counter
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({ ...prev, lastUpdated: prev.lastUpdated + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh metrics at interval
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        lastUpdated: 0,
        metrics: computeValues(),
      }));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, computeValues]);

  const refresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastUpdated: 0,
      metrics: computeValues(),
    }));
  }, [computeValues]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Simple last-updated counter hook
 */
export function useLastUpdated(resetTrigger?: any) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetTrigger]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return seconds;
}
