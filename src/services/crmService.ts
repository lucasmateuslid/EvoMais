import { supabase } from '../lib/supabase';
import { Deal, DealStage } from '../types/crm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function backendFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  return response;
}

export const crmService = {
  async getDeals(organizationId: string): Promise<Deal[]> {
    if (BACKEND_URL) {
      const response = await backendFetch(`/api/crm/deals`);

      if (!response.ok) {
        throw new Error('Erro ao carregar negócios');
      }

      const data = await response.json() as { deals?: Deal[] };
      return data.deals || [];
    }

    const { data, error } = await (supabase.from('deals') as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Deal[];
  },

  async updateDealStage(dealId: string, stage: DealStage): Promise<void> {
    if (BACKEND_URL) {
      const response = await backendFetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar etapa do negócio');
      }

      return;
    }

    const { error } = await (supabase.from('deals') as any)
      .update({ stage })
      .eq('id', dealId);

    if (error) throw error;
  },

  async createDeal(deal: Omit<Deal, 'id' | 'created_at'>): Promise<Deal> {
    if (BACKEND_URL) {
      const response = await backendFetch(`/api/crm/deals`, {
        method: 'POST',
        body: JSON.stringify(deal),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar negócio');
      }

      const data = await response.json() as { deal?: Deal };
      if (!data.deal) {
        throw new Error('Resposta inválida do backend');
      }

      return data.deal;
    }

    const { data, error } = await (supabase.from('deals') as any)
      .insert([deal])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Deal;
  },

  async deleteDeal(dealId: string): Promise<void> {
    if (BACKEND_URL) {
      const response = await backendFetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Erro ao excluir negócio');
      }

      return;
    }

    const { error } = await (supabase.from('deals') as any)
      .delete()
      .eq('id', dealId);

    if (error) throw error;
  }
};
