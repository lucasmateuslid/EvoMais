import { useAuthStore } from '../store/authStore';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
type ApiProvider = 'evolution' | 'whatsmeow';

export type Connection = {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  instance_name: string;
  status: ConnectionStatus;
  api_provider: ApiProvider;
  created_at: string;
};

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

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

export const connectionsService = {
  async list(): Promise<Connection[]> {
    const response = await backendFetch('/api/connections');

    if (!response.ok) {
      throw new Error('Erro ao carregar conexões');
    }

    const data = await response.json() as { connections?: Connection[] };
    return data.connections || [];
  },

  async create(payload: {
    name: string;
    phone: string;
    instance_name: string;
    api_provider: ApiProvider;
  }): Promise<Connection> {
    const response = await backendFetch('/api/connections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar conexão');
    }

    const data = await response.json() as { connection?: Connection };

    if (!data.connection) {
      throw new Error('Resposta inválida do backend');
    }

    return data.connection;
  },

  async updateStatus(connectionId: string, status: ConnectionStatus): Promise<Connection> {
    const response = await backendFetch(`/api/connections/${connectionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar status da conexão');
    }

    const data = await response.json() as { connection?: Connection };

    if (!data.connection) {
      throw new Error('Resposta inválida do backend');
    }

    return data.connection;
  },

  async remove(connectionId: string): Promise<void> {
    const response = await backendFetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Erro ao excluir conexão');
    }
  },
};
