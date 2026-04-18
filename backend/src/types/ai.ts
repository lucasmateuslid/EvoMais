export const AI_PROVIDERS = ['gemini', 'openai', 'anthropic', 'deepseek', 'groq'] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];
export type AIProviderPreference = AIProvider | 'auto';
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
  provider?: AIProviderPreference;
}

export interface ChatResponse {
  text: string;
  provider: 'cache' | AIProvider | 'fallback';
}