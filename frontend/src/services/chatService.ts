import { authorizedFetch } from './httpClient';

export interface ChatConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: string;
  startedAt: string;
  lastMessageAt: string | null;
  preview: string | null;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderName: string | null;
  text: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  status: string;
  createdAt: string;
}

export const chatService = {
  async listConversations(vendorId: string): Promise<ChatConversation[]> {
    const response = await authorizedFetch(`/api/chat/vendors/${vendorId}/conversations`);

    if (!response.ok) {
      throw new Error('Erro ao carregar conversas');
    }

    const data = await response.json() as { conversations?: ChatConversation[] };
    return data.conversations || [];
  },

  async listMessages(vendorId: string, conversationId: string): Promise<ChatMessage[]> {
    const response = await authorizedFetch(`/api/chat/vendors/${vendorId}/conversations/${conversationId}/messages`);

    if (!response.ok) {
      throw new Error('Erro ao carregar mensagens');
    }

    const data = await response.json() as { messages?: ChatMessage[] };
    return data.messages || [];
  },

  async sendMessage(vendorId: string, conversationId: string, text: string): Promise<ChatMessage> {
    const response = await authorizedFetch(`/api/chat/vendors/${vendorId}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    const data = await response.json() as { message?: ChatMessage };

    if (!data.message) {
      throw new Error('Resposta inválida do backend');
    }

    return data.message;
  },
};
