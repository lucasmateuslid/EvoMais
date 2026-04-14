export type MessageType = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  created_at: string;
}

export interface PipelineHealth {
  empresa: string;
  score: number;
  consultor: string;
}

export interface PipelineMetrics {
  negociosAtivos: number;
  followupsPendentes: number;
  pipelineTotal: number;
  taxaConversao: number;
}

export interface SmartAlert {
  tipo: 'danger' | 'info';
  titulo: string;
  mensagem: string;
  acao: string | null;
}

export interface AIContext {
  pipelineTotal: number;
  negociosPorEtapa: Record<string, number>;
  followupsVencidos: number;
  taxaConversao: number;
  topDeals: { company: string; value: number; stage: string }[];
}
