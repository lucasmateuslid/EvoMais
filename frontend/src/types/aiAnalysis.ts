export type LeadTemperature = "Quente" | "Morno" | "Frio";
export type IntentLevel = "Alta" | "Média" | "Baixa";
export type ImpactLevel = "Alto" | "Médio" | "Baixo";
export type PriorityLevel = "Alta" | "Média";
export type Period = "today" | "week" | "month";

export interface KpiData {
  conversations: number;
  messages: number;
  hotLeads: number;
  highIntent: number;
}

export interface LeadClassification {
  id: string;
  name: string;
  temperature: LeadTemperature;
  intentLevel: IntentLevel;
  pain: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "warning" | "success" | "info";
}

export interface Bottleneck {
  id: string;
  title: string;
  description: string;
  suggestion: string;
}

export interface SalesOpportunity {
  id: string;
  priority: PriorityLevel;
  title: string;
  description: string;
}

export interface ActionableRecommendation {
  id: string;
  title: string;
  impact: ImpactLevel;
  description: string;
}

export interface HistoricalReport {
  id: string;
  type: "Semana" | "Dia";
  startDate: string;
  endDate: string;
  conversations: number;
  messages: number;
  summary: string;
}

export interface AIAnalysisData {
  period: Period;
  executiveSummary: string;
  kpi: KpiData;
  leadClassifications: LeadClassification[];
  insights: Insight[];
  behaviorPatterns: string[];
  commonObjections: string[];
  identifiedPains: string[];
  bottlenecks: Bottleneck[];
  salesOpportunities: SalesOpportunity[];
  recommendations: ActionableRecommendation[];
  historicalReports: HistoricalReport[];
}
