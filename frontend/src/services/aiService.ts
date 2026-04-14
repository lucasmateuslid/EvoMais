import { AIContext, ChatMessage } from "../types/ai";
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

async function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export const aiService = {
  async chat(message: string, history: ChatMessage[], context: AIContext): Promise<string> {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        history,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao processar análise de IA');
    }

    const data = await response.json() as { text?: string };
    return data.text || "Desculpe, não consegui processar sua solicitação.";
  }
};
