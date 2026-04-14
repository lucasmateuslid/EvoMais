import React from 'react';
import { Deal, StageConfig } from '../../types/crm';
import { DealCard } from './DealCard';
import { Droppable } from '@hello-pangea/dnd';

const COR_ETAPA = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", text: "text-blue-700 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-500/20" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", text: "text-purple-700 dark:text-purple-400", badge: "bg-purple-100 dark:bg-purple-500/20" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", text: "text-amber-700 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-500/20" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", text: "text-orange-700 dark:text-orange-400", badge: "bg-orange-100 dark:bg-orange-500/20" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-500/20" },
};

interface KanbanColumnProps {
  key?: React.Key;
  stage: StageConfig;
  deals: Deal[];
}

export function KanbanColumn({ stage, deals }: KanbanColumnProps) {
  const c = COR_ETAPA[stage.color];

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      {/* Header da coluna */}
      <div 
        className={`border-b-0 rounded-t-xl p-3 px-4 flex justify-between items-center border ${c.bg} ${c.border}`}
      >
        <span className={`text-sm font-bold ${c.text}`}>{stage.label}</span>
        <span 
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge} ${c.text}`}
        >
          {deals.length}
        </span>
      </div>

      {/* Body da coluna */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 bg-surface-card border border-t-0 border-divider-subtle rounded-b-xl p-3 min-h-[500px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-white/[0.02]' : ''
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {provided.placeholder}
            <button className="mt-2 w-full py-2.5 rounded-lg border border-dashed border-divider-subtle bg-transparent text-muted text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 hover:text-secondary transition-colors">
              + Adicionar negócio
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
