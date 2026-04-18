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
  attendance?: AttendanceMetrics;
}

export interface AttendanceMetrics {
  range: {
    start: string;
    end: string;
  };
  filters: {
    sellerIds: string[];
  };
  kpis: {
    pendingBefore: number;
    newInPeriod: number;
    resolvedInPeriod: number;
    pendingAfter: number;
  };
  capacity: Array<{ date: string; label: string; newCount: number; resolvedCount: number; pendingCount: number }>;
  waitTime: {
    averageMinutes: number;
    daily: Array<{ date: string; label: string; averageMinutes: number; trendMinutes: number }>;
    totalConversations: number;
    respondedConversations: number;
  };
  duration: {
    averageMinutes: number;
    daily: Array<{ date: string; label: string; averageMinutes: number; trendMinutes: number }>;
    concludedConversations: number;
  };
  channels: Array<{ channel: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  hourlyVolume: Array<{ hour: string; count: number }>;
  peakHour: string;
}

export interface DashboardMetricsFilters {
  start?: string;
  end?: string;
  sellerIds?: string[];
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
  async getDashboard(filters?: DashboardMetricsFilters): Promise<DashboardMetricsResponse> {
    const params = new URLSearchParams();
    if (filters?.start) params.set('start', filters.start);
    if (filters?.end) params.set('end', filters.end);
    if (filters?.sellerIds && filters.sellerIds.length > 0) {
      params.set('sellerIds', filters.sellerIds.join(','));
    }

    const query = params.toString();
    const response = await authorizedFetch(`/api/metrics/dashboard${query ? `?${query}` : ''}`);

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
