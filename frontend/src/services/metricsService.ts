import { authorizedFetch } from './httpClient';

export interface DashboardMetricsResponse {
  summary: {
    monthlyRevenue: number;
    newLeads: number;
    conversionRate: number;
    avgCycleDays: number;
    followupsOverdue: number;
    totalConversations: number;
    totalMessages: number;
    activeVendors: number;
  };
  charts: {
    areaData: Array<{ name: string; value: number }>;
    weeklyPerformance: Array<{ name: string; sales: number; prospects: number }>;
  };
  pipelineByStage: Record<string, number>;
  hotLeads: Array<{ id: string; company: string; value: number }>;
  topVendors: Array<{ id: string; name: string; conversations: number; messages: number; status: string }>;
  generatedAt: string;
}

export interface TimelineMetricsResponse {
  daily: Array<{ name: string; date: string; mensagens: number; conversas: number }>;
  hourly: Array<{ name: string; mensagens: number; conversas: number }>;
  kpis: {
    totalMessages: number;
    totalConversations: number;
    mostActiveDay: string;
    mostActiveHour: string;
  };
  generatedAt: string;
}

export const metricsService = {
  async getDashboard(): Promise<DashboardMetricsResponse> {
    const response = await authorizedFetch('/api/metrics/dashboard');

    if (!response.ok) {
      throw new Error('Erro ao carregar dados do dashboard');
    }

    return response.json() as Promise<DashboardMetricsResponse>;
  },

  async getTimeline(): Promise<TimelineMetricsResponse> {
    const response = await authorizedFetch('/api/metrics/timeline');

    if (!response.ok) {
      throw new Error('Erro ao carregar dados de métricas');
    }

    return response.json() as Promise<TimelineMetricsResponse>;
  },
};
