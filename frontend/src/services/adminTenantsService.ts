const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL nao configurado.');
}

function getAdminToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return sessionStorage.getItem('authToken');
}

async function adminAuthorizedFetch(path: string, init?: RequestInit) {
  const token = getAdminToken();

  if (!token) {
    throw new Error('Super admin nao autenticado');
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
    const response = await adminAuthorizedFetch('/api/tenants/users', {
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
