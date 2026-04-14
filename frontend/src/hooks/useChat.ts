import { useCallback, useEffect, useMemo, useState } from 'react';

import { chatService, type ChatConversation, type ChatMessage } from '../services/chatService';
import { getRealtimeSocket } from '../services/realtimeService';

export function useChat(vendorId?: string, conversationId?: string) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!vendorId) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    try {
      setLoadingConversations(true);
      const data = await chatService.listConversations(vendorId);
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Erro ao carregar conversas');
    } finally {
      setLoadingConversations(false);
    }
  }, [vendorId]);

  const refreshMessages = useCallback(async () => {
    if (!vendorId || !conversationId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    try {
      setLoadingMessages(true);
      const data = await chatService.listMessages(vendorId, conversationId);
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  }, [vendorId, conversationId]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    void refreshMessages();
  }, [refreshMessages]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) {
      return;
    }

    const onMessageCreated = (event: { conversationId?: string; vendorId?: string }) => {
      if (vendorId && event.vendorId && event.vendorId !== vendorId) {
        return;
      }
      void refreshConversations();
      if (conversationId && event.conversationId === conversationId) {
        void refreshMessages();
      }
    };

    socket.on('chat:message_created', onMessageCreated);
    socket.on('chat:conversation_updated', onMessageCreated);

    return () => {
      socket.off('chat:message_created', onMessageCreated);
      socket.off('chat:conversation_updated', onMessageCreated);
    };
  }, [vendorId, conversationId, refreshConversations, refreshMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!vendorId || !conversationId) {
      throw new Error('Conversa inválida para envio de mensagem');
    }

    const message = await chatService.sendMessage(vendorId, conversationId, text);

    setMessages(prev => [...prev, message]);
    await refreshConversations();
    return message;
  }, [vendorId, conversationId, refreshConversations]);

  const currentConversation = useMemo(
    () => conversations.find(conversation => conversation.id === conversationId) || null,
    [conversations, conversationId],
  );

  return {
    conversations,
    messages,
    currentConversation,
    loadingConversations,
    loadingMessages,
    error,
    refreshConversations,
    refreshMessages,
    sendMessage,
  };
}
