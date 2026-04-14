import { Deal, DealStage } from '../types/crm';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

async function getAccessToken() {
  return useAuthStore.getState().accessToken;
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
  async getDeals(_organizationId: string): Promise<Deal[]> {
    const response = await backendFetch(`/api/crm/deals`);

    if (!response.ok) {
      throw new Error('Erro ao carregar negócios');
    }

    const data = await response.json() as { deals?: Deal[] };
    return data.deals || [];
  },

  async updateDealStage(dealId: string, stage: DealStage): Promise<void> {
    const response = await backendFetch(`/api/crm/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar etapa do negócio');
    }
  },

  async createDeal(deal: Omit<Deal, 'id' | 'created_at'>): Promise<Deal> {
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
  },

  async deleteDeal(dealId: string): Promise<void> {
    const response = await backendFetch(`/api/crm/deals/${dealId}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Erro ao excluir negócio');
    }
  }
};
