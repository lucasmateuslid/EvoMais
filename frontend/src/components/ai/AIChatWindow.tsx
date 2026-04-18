import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/ai';
import { USER_MESSAGE_MAX_CHARS } from '../../constants/ai';

interface AIChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  suggestions: string[];
}

interface MessageSection {
  title: string | null;
  lines: string[];
}

function renderBoldText(text: string) {
  const partes = text.split(/\*\*(.*?)\*\*/g);
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

function parseMessageSections(text: string): MessageSection[] {
  const normalizedLines = text
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim());

  const sections: MessageSection[] = [];
  let current: MessageSection = { title: null, lines: [] };

  const pushCurrent = () => {
    if (current.title || current.lines.length > 0) {
      sections.push(current);
    }
  };

  for (const line of normalizedLines) {
    if (!line || /^[-_]{3,}$/.test(line)) {
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      pushCurrent();
      current = {
        title: line.replace(/^#{1,3}\s+/, '').trim(),
        lines: [],
      };
      continue;
    }

    current.lines.push(line);
  }

  pushCurrent();

  if (sections.length === 0) {
    return [{ title: null, lines: [text.trim()] }];
  }

  return sections;
}

function AICardMessage({ text }: { text: string }) {
  const sections = parseMessageSections(text);
  const hasStructuredSections = sections.some(section => Boolean(section.title));

  if (!hasStructuredSections) {
    const lines = sections.flatMap(section => section.lines).filter(Boolean);

    return (
      <div className="space-y-2.5">
        {lines.map((line, index) => {
          const isBullet = /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
          const content = line
            .replace(/^[-*]\s+/, '')
            .replace(/^\d+\.\s+/, '');

          return (
            <p key={`${line}-${index}`} className="text-sm leading-relaxed text-secondary whitespace-pre-wrap">
              {isBullet ? '• ' : ''}
              {renderBoldText(content)}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {sections.map((section, sectionIndex) => {
        const sectionLines = section.lines.filter(Boolean);

        return (
          <div
            key={`${section.title || 'section'}-${sectionIndex}`}
            className="rounded-xl border border-divider-subtle bg-surface-card/80 px-3.5 py-3"
          >
            {section.title && (
              <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-divider-soft pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                  {section.title}
                </p>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                  Bloco {sectionIndex + 1}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              {sectionLines.map((line, lineIndex) => {
                const isBullet = /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
                const content = line
                  .replace(/^[-*]\s+/, '')
                  .replace(/^\d+\.\s+/, '');

                return (
                  <p key={`${content}-${lineIndex}`} className="text-sm leading-relaxed text-secondary">
                    {isBullet ? '• ' : ''}
                    {renderBoldText(content)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AIChatWindow({ messages, loading, onSendMessage, suggestions }: AIChatWindowProps) {
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const hasMessages = messages.length > 0;
  const remainingChars = USER_MESSAGE_MAX_CHARS - input.length;
  const isNearLimit = remainingChars <= 500;

  const isNearBottom = (element: HTMLDivElement, threshold = 72) =>
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

  useEffect(() => {
    const element = chatRef.current;
    if (!element || !shouldStickToBottomRef.current) return;

    // Keep natural chat behavior: stay at bottom only when the user is already near the latest message.
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading || input.length > USER_MESSAGE_MAX_CHARS) return;
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
    <div className="h-full min-h-0 bg-surface-card border border-divider-subtle rounded-2xl p-3 sm:p-4 flex flex-col shadow-sm overflow-hidden">
      {/* Visão rápida de fluxo */}
      {!hasMessages && (
      <div className="hidden md:block rounded-xl border border-brand/15 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent p-3 mb-3">
        <p className="text-brand dark:text-brand-light text-xs font-bold mb-2">
          Fluxo de análise orientado a vendas
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-lg bg-surface px-3 py-2 border border-divider-soft">
            <p className="font-semibold text-primary">1. Contexto</p>
            <p className="text-muted mt-0.5">Pipeline, estágio e urgência</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2 border border-divider-soft">
            <p className="font-semibold text-primary">2. Diagnóstico</p>
            <p className="text-muted mt-0.5">Riscos, gaps e prioridade</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2 border border-divider-soft">
            <p className="font-semibold text-primary">3. Ação</p>
            <p className="text-muted mt-0.5">Próximo passo com prazo</p>
          </div>
        </div>
      </div>
      )}

      {/* Histórico */}
      <div
        ref={chatRef}
        onScroll={(event) => {
          shouldStickToBottomRef.current = isNearBottom(event.currentTarget);
        }}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y mb-2 sm:mb-3 space-y-2.5 sm:space-y-3 pr-1 sm:pr-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 sm:p-3.5 px-3 sm:px-4 rounded-2xl text-sm leading-relaxed border ${
              m.type === 'user' 
                ? 'bg-brand/10 border-transparent ml-6 sm:ml-12 text-primary rounded-tr-sm' 
                : 'bg-surface border-divider-subtle mr-6 sm:mr-12 text-secondary rounded-tl-sm shadow-sm'
            }`}
          >
            {m.type === 'ai' ? <AICardMessage text={m.text} /> : renderBoldText(m.text)}
          </div>
        ))}
        {loading && (
          <div className="p-3 sm:p-3.5 px-3 sm:px-4 rounded-2xl bg-surface border border-divider-subtle text-muted text-sm animate-pulse mr-6 sm:mr-12 rounded-tl-sm shadow-sm">
            Analisando seu pipeline...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-divider-subtle pt-2.5 sm:pt-3 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre seu pipeline. Ex.: quais deals devo atacar hoje e qual abordagem usar?"
          maxLength={USER_MESSAGE_MAX_CHARS}
          rows={2}
          className="w-full resize-none min-h-[66px] sm:min-h-[72px] max-h-[120px] sm:max-h-[96px] bg-surface-input border border-divider-subtle rounded-xl text-primary text-sm p-3 px-3 sm:px-4 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-sm"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-muted">
            Enter envia • Shift+Enter quebra linha
          </p>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className={`text-xs font-medium ${isNearLimit ? 'text-brand' : 'text-muted'}`}>
              {input.length}/{USER_MESSAGE_MAX_CHARS}
            </span>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || input.length > USER_MESSAGE_MAX_CHARS}
              className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-sm ${
                input.trim() && !loading ? 'bg-brand hover:bg-brand-hover' : 'bg-brand/50 cursor-default'
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Sugestões rápidas */}
      {!hasMessages && (
      <div className="mt-2 sm:mt-3 -mx-1 px-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => !loading && onSendMessage(s)}
            disabled={loading}
            className="inline-block mr-2 last:mr-0 px-3 py-1.5 rounded-lg border border-divider-subtle bg-surface text-muted text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 hover:text-secondary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
