import React from 'react';
import { Deal, InfoType, FollowupStatus } from '../../types/crm';
import { Draggable } from '@hello-pangea/dnd';

const FOLLOWUP_BADGE: Record<FollowupStatus, { bg: string; color: string }> = {
  vencido:  { bg: "bg-red-100 dark:bg-red-500/10",    color: "text-red-700 dark:text-red-400"  },
  hoje:     { bg: "bg-amber-100 dark:bg-amber-500/10",   color: "text-amber-700 dark:text-amber-400"  },
  amanhã:   { bg: "bg-emerald-100 dark:bg-emerald-500/10",   color: "text-emerald-700 dark:text-emerald-400"  },
  ok:       { bg: "bg-emerald-100 dark:bg-emerald-500/10",   color: "text-emerald-700 dark:text-emerald-400"  },
  reunião:  { bg: "bg-blue-100 dark:bg-blue-500/10",   color: "text-blue-700 dark:text-blue-400"  },
  contrato: { bg: "bg-emerald-100 dark:bg-emerald-500/10",   color: "text-emerald-700 dark:text-emerald-400"  },
};

const INFO_TIPO: Record<InfoType, { bg: string; color: string }> = {
  danger:  { bg: "bg-red-50 dark:bg-red-500/5",   color: "text-red-600 dark:text-red-400" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-500/5",  color: "text-emerald-600 dark:text-emerald-400" },
  info:    { bg: "bg-blue-50 dark:bg-blue-500/5",  color: "text-blue-600 dark:text-blue-400" },
};

const formatarValor = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

interface DealCardProps {
  key?: React.Key;
  deal: Deal;
  index: number;
}

export function DealCard({ deal, index }: DealCardProps) {
  const badge = FOLLOWUP_BADGE[deal.followup_status] || FOLLOWUP_BADGE.ok;
  const isVencido = deal.followup_status === "vencido";
  const info = deal.info && deal.info_type ? INFO_TIPO[deal.info_type] : null;
  const ck = deal.checklist;
  const ckPct = ck ? Math.round((ck.feitos / ck.total) * 100) : null;
  const ckCor = ckPct !== null ? (ckPct === 100 ? "bg-emerald-500" : ckPct >= 60 ? "bg-amber-500" : "bg-red-500") : null;

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface rounded-xl p-3.5 mb-3 cursor-pointer transition-all border shadow-sm ${
            snapshot.isDragging ? 'border-brand shadow-lg scale-[1.02] z-50' : isVencido ? 'border-red-300 dark:border-red-500/50' : 'border-divider-subtle hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          {/* Topo: empresa + badge */}
          <div className="flex justify-between items-start mb-2 gap-2">
            <p className="text-primary text-xs font-semibold leading-tight flex-1">
              {deal.company}
            </p>
            <span 
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}
            >
              {deal.followup_status}
            </span>
          </div>

          {/* Valor */}
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-2">
            {formatarValor(deal.value)}
          </p>

          {/* Checklist progress */}
          {ck && (
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-muted mb-1 font-medium">
                <span>Checklist</span>
                <span>{ck.feitos}/{ck.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${ckCor || 'bg-gray-400'}`}
                  style={{ width: `${ckPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Info extra */}
          {info && (
            <div className={`rounded-md p-1.5 px-2 mb-2 ${info.bg}`}>
              <p className={`text-[10px] font-medium ${info.color}`}>{deal.info}</p>
            </div>
          )}

          {/* Rodapé: consultor + avatar */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-muted text-[10px] font-medium">
              {deal.consultant_name} · {deal.days_in_stage} {deal.days_in_stage === 1 ? "dia" : "dias"}
            </span>
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 shadow-sm"
              style={{ background: deal.color }}
            >
              {deal.consultant_initials}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
