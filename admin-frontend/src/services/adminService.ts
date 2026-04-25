import { authorizedFetch } from './httpClient';

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
    const response = await authorizedFetch('/api/admin/stats');

    if (!response.ok) {
      throw new Error('Erro ao carregar estatisticas admin');
    }

    return response.json() as Promise<AdminStatsResponse>;
  },

  async getJobs(): Promise<AdminJobsResponse> {
    const response = await authorizedFetch('/api/admin/jobs');

    if (!response.ok) {
      throw new Error('Erro ao carregar status de jobs');
    }

    return response.json() as Promise<AdminJobsResponse>;
  },

  async getLogs(): Promise<AdminLogsResponse> {
    const response = await authorizedFetch('/api/admin/logs');

    if (!response.ok) {
      throw new Error('Erro ao carregar status de logs');
    }

    return response.json() as Promise<AdminLogsResponse>;
  },
};