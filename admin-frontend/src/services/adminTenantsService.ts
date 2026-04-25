import { authorizedFetch } from './httpClient';

export type TenantUserRole = 'user' | 'viewer' | 'admin' | 'super_admin';

export interface CreateTenantUserPayload {
  organization_id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: TenantUserRole;
}

export interface CreatedTenantUserResponse {
  user: {
    id: string;
    email?: string | null;
  };
  profile: {
    id: string;
    user_id: string;
    organization_id: string;
    role: TenantUserRole;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  organization: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
}

export const adminTenantsService = {
  async createUser(payload: CreateTenantUserPayload): Promise<CreatedTenantUserResponse> {
    const response = await authorizedFetch('/api/tenants/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({} as Record<string, unknown>));
      throw new Error((errorPayload as { message?: string }).message || 'Erro ao criar usuario');
    }

    return response.json() as Promise<CreatedTenantUserResponse>;
  },
};