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

export interface AdminStatsResponse {
  stats: {
    organizations: number;
    tenants: number;
    profiles: number;
    deals: number;
    conversations: number;
    messages: number;
  };
  generatedAt: string;
}

export interface AdminJobsResponse {
  jobs: {
    queueBackend: boolean;
    queueNames: Record<string, string>;
    capabilities: {
      workers: boolean;
      redis: boolean;
    };
  };
  generatedAt: string;
}

export interface AdminLogsResponse {
  logs: {
    sentryEnabled: boolean;
    correlationIdEnabled: boolean;
    note: string;
  };
  generatedAt: string;
}

export const adminService = {
  async getStats(): Promise<AdminStatsResponse> {
    const response = await adminAuthorizedFetch('/api/admin/stats');

    if (!response.ok) {
      throw new Error('Erro ao carregar estatisticas admin');
    }

    return response.json() as Promise<AdminStatsResponse>;
  },

  async getJobs(): Promise<AdminJobsResponse> {
    const response = await adminAuthorizedFetch('/api/admin/jobs');

    if (!response.ok) {
      throw new Error('Erro ao carregar status de jobs');
    }

    return response.json() as Promise<AdminJobsResponse>;
  },

  async getLogs(): Promise<AdminLogsResponse> {
    const response = await adminAuthorizedFetch('/api/admin/logs');

    if (!response.ok) {
      throw new Error('Erro ao carregar status de logs');
    }

    return response.json() as Promise<AdminLogsResponse>;
  },
};