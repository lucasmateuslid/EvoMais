import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Search, Send } from 'lucide-react';

import { useChat } from '../hooks/useChat';

function timeLabel(value?: string | null) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { vendorId, conversationId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const {
    conversations,
    currentConversation,
    messages,
    loadingConversations,
    loadingMessages,
    error,
    sendMessage,
  } = useChat(vendorId, conversationId);

  const orderedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.lastMessageAt || b.startedAt).getTime() - new Date(a.lastMessageAt || a.startedAt).getTime()),
    [conversations],
  );

  async function onSend() {
    if (!draft.trim() || !vendorId || !conversationId || sending) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(draft.trim());
      setDraft('');
    } catch (sendError) {
      console.error(sendError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden rounded-2xl border border-divider-subtle bg-surface">
      <aside className="flex w-80 flex-col border-r border-divider-subtle bg-surface">
        <div className="flex items-center gap-2 border-b border-divider-subtle bg-surface-input p-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-surface">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-semibold text-primary">Conversas do vendedor</p>
            <p className="text-xs text-secondary">{orderedConversations.length} conversa(s)</p>
          </div>
        </div>

        <div className="border-b border-divider-subtle p-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface-input px-3 py-2">
            <Search className="h-4 w-4 text-secondary" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar conversa" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-sm text-secondary">Carregando conversas...</div>
          ) : orderedConversations.length === 0 ? (
            <div className="p-4 text-sm text-secondary">Nenhuma conversa encontrada.</div>
          ) : (
            orderedConversations.map(conversation => {
              const active = conversation.id === conversationId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => navigate(`/chat/${vendorId}/${conversation.id}`)}
                  className={`w-full border-b border-divider-soft px-4 py-3 text-left hover:bg-surface-input ${active ? 'bg-surface-input' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-primary">{conversation.contactName}</p>
                    <p className="text-[11px] text-secondary">{timeLabel(conversation.lastMessageAt || conversation.startedAt)}</p>
                  </div>
                  <p className="mt-1 truncate text-xs text-secondary">{conversation.preview || conversation.contactPhone}</p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-surface-deep">
        <div className="border-b border-divider-subtle bg-surface-input px-5 py-4">
          <p className="text-sm font-semibold text-primary">{currentConversation?.contactName || 'Selecione uma conversa'}</p>
          <p className="text-xs text-secondary">{currentConversation?.contactPhone || 'Sem contato selecionado'}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-3 rounded-lg border border-red-300/40 bg-red-500/10 p-3 text-xs text-red-500">
              {error}
            </div>
          )}

          {loadingMessages ? (
            <div className="text-sm text-secondary">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-secondary">Sem mensagens nesta conversa.</div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => {
                const isSeller = message.sender === 'seller';
                return (
                  <div key={message.id} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${isSeller ? 'bg-brand/20 text-primary' : 'bg-surface text-primary'}`}>
                      {message.text || '[mensagem sem conteúdo]'}
                      <p className="mt-1 text-[10px] text-secondary">{timeLabel(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-divider-subtle bg-surface-input p-3">
          <button className="rounded-full p-2 text-secondary hover:bg-surface">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void onSend();
              }
            }}
            placeholder="Digite uma mensagem"
            className="flex-1 rounded-lg border border-divider-subtle bg-surface px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => void onSend()}
            disabled={!draft.trim() || !conversationId || sending}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
