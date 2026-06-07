import { authorizedFetch } from './httpClient';

export interface EvolutionInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  status: string;
  qr_code: string | null;
  error_message: string | null;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEvolutionInstancePayload {
  name: string;
  rejectCall?: boolean;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  syncFullHistory?: boolean;
}

export const evolutionService = {
  async listInstances(): Promise<EvolutionInstance[]> {
    const response = await authorizedFetch('/api/evolution/instances');

    if (!response.ok) {
      throw new Error('Erro ao carregar instâncias');
    }

    const data = await response.json() as { instances?: EvolutionInstance[] };
    return data.instances || [];
  },

  async createInstance(payload: CreateEvolutionInstancePayload) {
    const response = await authorizedFetch('/api/evolution/instances', {
      method: 'POST',
      body: JSON.stringify({ instanceName: payload.name }),
    });

    if (!response.ok) {
      const payloadData = await response.json().catch(() => ({}));
      throw new Error(payloadData?.message || 'Erro ao criar instância');
    }

    return response.json() as Promise<{ instance: EvolutionInstance; qrcode?: string | null }>;
  },

  async getQrCode(instanceName: string) {
    const response = await authorizedFetch(`/api/evolution/instances/${encodeURIComponent(instanceName)}/qrcode`);

    if (!response.ok) {
      throw new Error('Erro ao carregar QR code');
    }

    return response.json() as Promise<{ qrcode?: string | null; pairingCode?: string | null }>;
  },

  async restartInstance(instanceName: string) {
    const response = await authorizedFetch(`/api/evolution/instances/${encodeURIComponent(instanceName)}/restart`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erro ao reiniciar instância');
    }
  },

  async deleteInstance(instanceName: string) {
    const response = await authorizedFetch(`/api/evolution/instances/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir instância');
    }
  },
};