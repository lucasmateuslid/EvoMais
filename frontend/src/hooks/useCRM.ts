import { useState, useEffect, useCallback } from 'react';
import { Deal, DealStage } from '../types/crm';
import { crmService } from '../services/crmService';
import { getRealtimeSocket } from '../services/realtimeService';
import { useAuthStore } from '../store/authStore';

export function useCRM() {
  const { profile, isLoading: authLoading } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!profile?.organization_id) {
      if (!authLoading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await crmService.getDeals(profile.organization_id);
      setDeals(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Erro ao carregar negócios');
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, authLoading]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) {
      return;
    }

    const refreshFromRealtime = () => {
      void fetchDeals();
    };

    socket.on('crm:deal_created', refreshFromRealtime);
    socket.on('crm:deal_updated', refreshFromRealtime);
    socket.on('crm:deal_deleted', refreshFromRealtime);

    return () => {
      socket.off('crm:deal_created', refreshFromRealtime);
      socket.off('crm:deal_updated', refreshFromRealtime);
      socket.off('crm:deal_deleted', refreshFromRealtime);
    };
  }, [fetchDeals]);

  const updateDealStage = async (dealId: string, newStage: DealStage) => {
    // Optimistic update
    const previousDeals = [...deals];
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      await crmService.updateDealStage(dealId, newStage);
    } catch (err) {
      console.error('Error updating deal stage:', err);
      setDeals(previousDeals);
      setError('Erro ao atualizar etapa do negócio');
    }
  };

  const addDeal = async (deal: Omit<Deal, 'id' | 'created_at'>) => {
    try {
      const newDeal = await crmService.createDeal(deal);
      setDeals(prev => [newDeal, ...prev]);
    } catch (err) {
      console.error('Error adding deal:', err);
      setError('Erro ao adicionar negócio');
    }
  };

  const deleteDeal = async (dealId: string) => {
    const previousDeals = [...deals];
    setDeals(prev => prev.filter(d => d.id !== dealId));

    try {
      await crmService.deleteDeal(dealId);
    } catch (err) {
      console.error('Error deleting deal:', err);
      setDeals(previousDeals);
      setError('Erro ao excluir negócio');
    }
  };

  return {
    deals,
    loading,
    error,
    updateDealStage,
    addDeal,
    deleteDeal,
    refresh: fetchDeals
  };
}
