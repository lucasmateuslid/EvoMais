import React, { useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { useAIChat } from '../../hooks/useAIChat';
import { AIChatWindow } from './AIChatWindow';
import { PipelineHealth } from './PipelineHealth';
import { QuickMetrics } from './QuickMetrics';
import { SmartAlerts } from './SmartAlerts';
import { AIContext, PipelineMetrics, PipelineHealth as HealthType, SmartAlert } from '../../types/ai';
import { X, BrainCircuit } from 'lucide-react';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ isOpen, onClose }: AIAnalysisModalProps) {
  const { deals, loading: crmLoading } = useCRM();

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

  const metrics: PipelineMetrics = {
    negociosAtivos: deals.length,
    followupsPendentes: context.followupsVencidos,
    pipelineTotal: context.pipelineTotal,
    taxaConversao: 32
  };

  const healthScores: HealthType[] = deals.slice(0, 5).map(d => ({
    empresa: d.company,
    score: d.followup_status === 'vencido' ? 30 : d.followup_status === 'hoje' ? 50 : 85,
    consultor: d.consultant_initials
  }));

  const smartAlerts: SmartAlert[] = [
    {
      tipo: "danger",
      titulo: "Alerta inteligente",
      mensagem: "Existem negócios parados há mais de 7 dias. Momento ideal para reengajamento.",
      acao: "Ver pendências"
    },
    {
      tipo: "info",
      titulo: "Sugestão de foco",
      mensagem: "Terça e quinta entre 10h–11h são seus melhores horários de contato.",
      acao: null
    }
  ];

  const suggestions = [
    "O que devo fazer hoje?",
    "Negócios em risco de esfriar",
    "Resumo do pipeline",
    "Dicas de conversão"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-2xl border border-divider-subtle w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-divider-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-xl text-brand dark:text-brand-light">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Análise IA</h2>
              <p className="text-sm text-muted">Assistente inteligente contextual do seu pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-brand/10 text-brand dark:text-brand-light text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm hidden sm:block">
              IA ativa
            </span>
            <button 
              onClick={onClose}
              className="text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-input"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {crmLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Chat principal */}
              <AIChatWindow 
                messages={messages} 
                loading={aiLoading} 
                onSendMessage={sendMessage} 
                suggestions={suggestions}
              />

              {/* Painel direito */}
              <div className="flex flex-col gap-6">
                <PipelineHealth scores={healthScores} />
                <QuickMetrics metrics={metrics} />
                <SmartAlerts alerts={smartAlerts} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
