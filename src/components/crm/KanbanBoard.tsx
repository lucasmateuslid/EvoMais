import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, STAGES, DealStage } from '../../types/crm';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  deals: Deal[];
  onDragEnd: (dealId: string, newStage: DealStage) => void;
}

export function KanbanBoard({ deals, onDragEnd }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    onDragEnd(draggableId, destination.droppableId as DealStage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage.id)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
