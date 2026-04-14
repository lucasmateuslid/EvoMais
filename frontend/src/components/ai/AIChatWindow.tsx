import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/ai';

interface AIChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  suggestions: string[];
}

function TextoComNegrito({ texto }: { texto: string }) {
  const partes = texto.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-primary font-semibold">{parte}</strong>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </>
  );
}

export function AIChatWindow({ messages, loading, onSendMessage, suggestions }: AIChatWindowProps) {
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-surface-card border border-divider-subtle rounded-2xl p-4 flex flex-col min-h-[600px] shadow-sm">
      {/* Resumo Semanal (Static for now or passed as prop) */}
      <div className="bg-brand/5 border border-brand/10 rounded-xl p-4 mb-4">
        <p className="text-brand dark:text-brand-light text-xs font-bold mb-1.5">
          Resumo semanal — gerado automaticamente pela IA
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          Seu pipeline está com boa movimentação. Foco em negócios parados há mais de 7 dias.
        </p>
      </div>

      {/* Histórico */}
      <div ref={chatRef} className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-hide pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3.5 px-4 rounded-2xl text-sm leading-relaxed border ${
              m.type === 'user' 
                ? 'bg-brand/10 border-transparent ml-12 text-primary rounded-tr-sm' 
                : 'bg-surface border-divider-subtle mr-12 text-secondary rounded-tl-sm shadow-sm'
            }`}
          >
            <TextoComNegrito texto={m.text} />
          </div>
        ))}
        {loading && (
          <div className="p-3.5 px-4 rounded-2xl bg-surface border border-divider-subtle text-muted text-sm animate-pulse mr-12 rounded-tl-sm shadow-sm">
            Analisando seu pipeline...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-divider-subtle pt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre seu pipeline..."
          className="flex-1 bg-surface-input border border-divider-subtle rounded-xl text-primary text-sm p-3 px-4 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`px-6 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-sm ${
            input.trim() && !loading ? 'bg-brand hover:bg-brand-hover' : 'bg-brand/50 cursor-default'
          }`}
        >
          Enviar
        </button>
      </div>

      {/* Sugestões rápidas */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSendMessage(s)}
            className="px-3 py-1.5 rounded-lg border border-divider-subtle bg-surface text-muted text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 hover:text-secondary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
