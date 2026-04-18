import React from 'react';
import { Deal, StageConfig } from '../../types/crm';
import { DealCard } from './DealCard';
import { Droppable } from '@hello-pangea/dnd';

const COR_ETAPA = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-500/15", border: "border-blue-200 dark:border-blue-500/35", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-100 dark:bg-blue-500/25" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/15", border: "border-purple-200 dark:border-purple-500/35", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 dark:bg-purple-500/25" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-500/15", border: "border-amber-200 dark:border-amber-500/35", text: "text-amber-700 dark:text-amber-300", badge: "bg-amber-100 dark:bg-amber-500/25" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/15", border: "border-orange-200 dark:border-orange-500/35", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-100 dark:bg-orange-500/25" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-500/15", border: "border-emerald-200 dark:border-emerald-500/35", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 dark:bg-emerald-500/25" },
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
            <button className="mt-2 w-full py-2.5 rounded-lg border border-dashed border-divider-subtle bg-surface text-secondary text-xs font-semibold hover:bg-surface-input hover:text-primary transition-colors">
              + Adicionar negócio
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
