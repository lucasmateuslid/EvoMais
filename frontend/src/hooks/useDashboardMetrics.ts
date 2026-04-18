import { useCallback, useEffect, useMemo, useState } from 'react';

import { metricsService, type DashboardMetricsFilters, type DashboardMetricsResponse } from '../services/metricsService';
import { getRealtimeSocket } from '../services/realtimeService';

export function useDashboardMetrics(filters?: DashboardMetricsFilters) {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = [filters?.start || '', filters?.end || '', (filters?.sellerIds || []).join(',')].join('|');
  const normalizedFilters = useMemo<DashboardMetricsFilters | undefined>(() => {
    if (!filters) {
      return undefined;
    }

    return {
      start: filters.start,
      end: filters.end,
      sellerIds: filters.sellerIds && filters.sellerIds.length > 0 ? [...filters.sellerIds] : undefined,
    };
  }, [filterKey]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await metricsService.getDashboard(normalizedFilters);
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      setError('Erro ao carregar indicadores do dashboard');
    } finally {
      setLoading(false);
    }
  }, [filterKey, normalizedFilters]);

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
    socket.on('chat:conversation_updated', onChatEvent);

    return () => {
      socket.off('crm:deal_created', onDealEvent);
      socket.off('crm:deal_updated', onDealEvent);
      socket.off('crm:deal_deleted', onDealEvent);
      socket.off('chat:message_created', onChatEvent);
      socket.off('chat:conversation_updated', onChatEvent);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
