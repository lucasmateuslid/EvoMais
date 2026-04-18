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

export type EvolutionInstance = {
  id: string;
  organization_id: string;
  connection_id: string | null;
  seller_id: string | null;
  instance_name: string;
  status: 'creating' | 'queued' | 'generating_qr' | 'qr_ready' | 'connected' | 'disconnected' | 'error';
  phone_number: string | null;
  qr_code: string | null;
  qr_expires_at: string | null;
  last_heartbeat: string | null;
  error_message: string | null;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
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
    cache: 'no-store',
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
    instance_name?: string;
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

  async connect(connectionId: string): Promise<Connection> {
    const response = await backendFetch(`/api/connections/${connectionId}/connect`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erro ao conectar WhatsApp');
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

  async listEvolutionInstances(): Promise<EvolutionInstance[]> {
    const response = await backendFetch('/api/evolution/instances');

    if (!response.ok) {
      throw new Error('Erro ao carregar instâncias Evolution');
    }

    const data = await response.json() as { instances?: EvolutionInstance[] };
    return data.instances || [];
  },
};
