import { publicFetch } from './httpClient';

export interface TenantInfo {
  id: string;
  organization_id: string;
  subdomain: string;
  domain: string;
  status: string;
  created_at: string;
}

export const tenantService = {
  async getCurrentTenant(): Promise<TenantInfo | null> {
    const response = await publicFetch('/api/tenant/current');

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as { tenant?: TenantInfo | null };
    return data.tenant || null;
  },
};
