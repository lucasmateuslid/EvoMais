import React from 'react';
import { Deal } from '../../types/crm';

interface FollowupAlertProps {
  deals: Deal[];
}

const formatarValor = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

export function FollowupAlert({ deals }: FollowupAlertProps) {
  const vencidos = deals.filter((n) => n.followup_status === "vencido").length;
  const hoje = deals.filter((n) => n.followup_status === "hoje").length;
  const valorRisco = deals.filter((n) => n.followup_status === "vencido").reduce((a, n) => a + n.value, 0);

  if (vencidos === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-3.5 px-4 mb-4 flex items-center gap-3 flex-wrap shadow-sm">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="text-red-600 dark:text-red-400 text-sm font-bold">
        {vencidos} follow-up{vencidos > 1 ? "s" : ""} vencido{vencidos > 1 ? "s" : ""}
      </span>
      <span className="text-secondary text-xs">|</span>
      <span className="text-secondary text-sm font-medium">{hoje} vencem hoje</span>
      <span className="text-secondary text-xs">|</span>
      <span className="text-secondary text-sm font-medium">{formatarValor(valorRisco)} em risco</span>
      <button className="ml-auto px-4 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 bg-white dark:bg-transparent text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm dark:shadow-none">
        Ver pendências →
      </button>
    </div>
  );
}
