import { useCallback, useEffect, useState } from 'react';

import { metricsService, type DashboardMetricsResponse } from '../services/metricsService';
import { getRealtimeSocket } from '../services/realtimeService';

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await metricsService.getDashboard();
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      setError('Erro ao carregar indicadores do dashboard');
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

    const onDealEvent = () => {
      void refresh();
    };

    const onChatEvent = () => {
      void refresh();
    };

    socket.on('crm:deal_created', onDealEvent);
    socket.on('crm:deal_updated', onDealEvent);
    socket.on('crm:deal_deleted', onDealEvent);
    socket.on('chat:message_created', onChatEvent);

    return () => {
      socket.off('crm:deal_created', onDealEvent);
      socket.off('crm:deal_updated', onDealEvent);
      socket.off('crm:deal_deleted', onDealEvent);
      socket.off('chat:message_created', onChatEvent);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
