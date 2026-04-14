export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  type: ChatRole;
  text: string;
  created_at: string;
}

export interface AIContext {
  pipelineTotal: number;
  negociosPorEtapa: Record<string, number>;
  followupsVencidos: number;
  taxaConversao: number;
  topDeals: Array<{
    company: string;
    value: number;
    stage: string;
  }>;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context: AIContext;
}

export interface ChatResponse {
  text: string;
  provider: 'cache' | 'gemini' | 'fallback';
}