import React, { useState } from 'react';
import { useCRM } from '../hooks/useCRM';
import { KanbanBoard } from '../components/crm/KanbanBoard';
import { FollowupAlert } from '../components/crm/FollowupAlert';

const formatarValor = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

export default function CRMPage() {
  const [visualizacao, setVisualizacao] = useState<"kanban" | "lista">("kanban");
  const { deals, loading, error, updateDealStage } = useCRM();

  const totalPipeline = deals.reduce((a, n) => a + n.value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-muted text-sm">
            {deals.length} negócios ativos · {formatarValor(totalPipeline)} em pipeline
          </p>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Toggle kanban / lista */}
          <div className="flex bg-surface-input rounded-lg border border-divider-subtle p-1">
            {(["kanban", "lista"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisualizacao(v)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  visualizacao === v 
                    ? "bg-surface shadow-sm text-brand dark:text-brand-light" 
                    : "text-muted hover:text-secondary"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-sm">
            + Novo negócio
          </button>
        </div>
      </div>

      {/* Alerta de follow-ups */}
      <FollowupAlert deals={deals} />

      {/* Kanban */}
      {visualizacao === "kanban" ? (
        <KanbanBoard deals={deals} onDragEnd={updateDealStage} />
      ) : (
        <div className="bg-surface border border-divider-subtle rounded-2xl p-10 text-center">
          <p className="text-muted text-sm">Visualização em lista — em desenvolvimento.</p>
        </div>
      )}
    </div>
  );
}
