import React, { useEffect, useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { useAIChat } from '../../hooks/useAIChat';
import { AIChatWindow } from './AIChatWindow';
import { ConversationInsightsPanel } from './ConversationInsightsPanel';
import { AIContext } from '../../types/ai';
import { X, BrainCircuit } from 'lucide-react';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ isOpen, onClose }: AIAnalysisModalProps) {
  const { deals, loading: crmLoading } = useCRM();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    // Keep background fixed while the modal handles interaction and scrolling.
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const context: AIContext = useMemo(() => {
    const pipelineTotal = deals.reduce((a, n) => a + n.value, 0);
    const negociosPorEtapa: Record<string, number> = {};
    deals.forEach(d => {
      negociosPorEtapa[d.stage] = (negociosPorEtapa[d.stage] || 0) + 1;
    });
    const followupsVencidos = deals.filter(d => d.followup_status === 'vencido').length;
    
    return {
      pipelineTotal,
      negociosPorEtapa,
      followupsVencidos,
      taxaConversao: 32, // Mocked for now
      topDeals: deals
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(d => ({ company: d.company, value: d.value, stage: d.stage }))
    };
  }, [deals]);

  const { messages, loading: aiLoading, sendMessage } = useAIChat(context);

  const suggestions = [
    "Me dê um plano de ação para hoje",
    "Quais deals estão em risco agora?",
    "Resumo executivo do pipeline",
    "Como aumentar conversão nesta semana?"
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-analysis-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-surface rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-divider-subtle w-full max-w-6xl h-[100dvh] sm:h-[calc(100dvh-2rem)] lg:h-[min(94dvh,920px)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-3 py-2.5 sm:px-5 sm:py-4 border-b border-divider-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 p-1.5 sm:p-2 rounded-xl text-brand dark:text-brand-light">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 id="ai-analysis-modal-title" className="text-base sm:text-xl font-bold text-primary">Análise IA</h2>
              <p className="hidden sm:block text-sm text-muted">Assistente inteligente contextual do seu pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="bg-brand/10 text-brand dark:text-brand-light text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm hidden sm:block">
              IA ativa
            </span>
            <button 
              onClick={onClose}
              className="text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-input"
              aria-label="Fechar modal de análise"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-4 lg:p-5">
          {crmLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 lg:gap-6 overflow-hidden">
              {/* Chat principal */}
              <AIChatWindow 
                messages={messages} 
                loading={aiLoading} 
                onSendMessage={sendMessage} 
                suggestions={suggestions}
              />

              {/* Painel direito */}
              <div className="hidden lg:block h-full min-h-0 overflow-hidden">
                <ConversationInsightsPanel messages={messages} context={context} loading={aiLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
