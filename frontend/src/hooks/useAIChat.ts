import { useState, useCallback } from 'react';
import { ChatMessage, AIContext } from '../types/ai';
import { aiService } from '../services/aiService';
import { USER_MESSAGE_MAX_CHARS } from '../constants/ai';

export function useAIChat(context: AIContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      text: `Olá! Com base no seu pipeline atual, você tem **${context.followupsVencidos} follow-ups vencidos** e R$ ${context.pipelineTotal.toLocaleString('pt-BR')} em negócios ativos. O que gostaria de analisar hoje?`,
      created_at: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText || loading) return;

    const safeText = normalizedText.slice(0, USER_MESSAGE_MAX_CHARS);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: safeText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const aiResponse = await aiService.chat(safeText, messages, context);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiResponse,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error in AI chat:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, context, loading]);

  return {
    messages,
    loading,
    sendMessage
  };
}
