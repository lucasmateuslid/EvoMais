import { useCallback, useEffect, useState } from 'react';

import { getRealtimeSocket } from '../services/realtimeService';
import { vendorsService, type VendorsResponse } from '../services/vendorsService';

export function useVendors() {
  const [data, setData] = useState<VendorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorsService.list();
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Erro ao carregar vendedores');
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
    socket.on('chat:conversation_updated', onRealtimeUpdate);
    socket.on('connections:updated', onRealtimeUpdate);

    return () => {
      socket.off('chat:message_created', onRealtimeUpdate);
      socket.off('chat:conversation_updated', onRealtimeUpdate);
      socket.off('connections:updated', onRealtimeUpdate);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
