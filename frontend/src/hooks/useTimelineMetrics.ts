import { useCallback, useEffect, useState } from 'react';

import { metricsService, type TimelineMetricsResponse } from '../services/metricsService';
import { getRealtimeSocket } from '../services/realtimeService';

export function useTimelineMetrics() {
  const [data, setData] = useState<TimelineMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await metricsService.getTimeline();
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error loading timeline metrics:', err);
      setError('Erro ao carregar métricas de timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) {
      return;
    }

    const onRealtimeUpdate = () => {
      void refresh();
    };

    socket.on('chat:message_created', onRealtimeUpdate);
    socket.on('crm:deal_created', onRealtimeUpdate);
    socket.on('crm:deal_updated', onRealtimeUpdate);

    return () => {
      socket.off('chat:message_created', onRealtimeUpdate);
      socket.off('crm:deal_created', onRealtimeUpdate);
      socket.off('crm:deal_updated', onRealtimeUpdate);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
