import { authorizedFetch } from './httpClient';

export interface TenantRecord {
  id: string;
  organization_id: string;
  subdomain: string;
  domain: string;
  status: 'active' | 'inactive';
  created_at: string;
  organizations?: {
    id: string;
    name: string;
    email: string;
    plan?: string;
    status?: string;
    max_users?: number;
    created_at?: string;
  };
}

export const tenantsService = {
  async list(): Promise<TenantRecord[]> {
    const response = await authorizedFetch('/api/tenants');

    if (!response.ok) {
      throw new Error('Erro ao carregar tenants');
    }

    const data = await response.json() as { tenants?: TenantRecord[] };
    return data.tenants || [];
  },

  async update(tenantId: string, payload: Partial<Pick<TenantRecord, 'subdomain' | 'domain' | 'status'>>): Promise<TenantRecord> {
    const response = await authorizedFetch(`/api/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar tenant');
    }

    const data = await response.json() as { tenant?: TenantRecord };

    if (!data.tenant) {
      throw new Error('Resposta invalida do backend');
    }

    return data.tenant;
  },
};