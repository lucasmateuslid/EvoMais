import React from 'react';
import { SmartAlert } from '../../types/ai';

const ALERTA_ESTILO = {
  danger: { 
    bg: "bg-red-50 dark:bg-red-500/5",   
    border: "border-red-200 dark:border-red-500/20",   
    titulo: "text-red-600 dark:text-red-400", 
    btn: { bg: "bg-white dark:bg-red-500/10",  border: "border-red-200 dark:border-red-500/30",  color: "text-red-600 dark:text-red-400", hover: "hover:bg-red-50 dark:hover:bg-red-500/20" } 
  },
  info:   { 
    bg: "bg-blue-50 dark:bg-blue-500/5",  
    border: "border-blue-200 dark:border-blue-500/15",  
    titulo: "text-blue-600 dark:text-blue-400", 
    btn: null 
  },
};

interface SmartAlertsProps {
  alerts: SmartAlert[];
}

export function SmartAlerts({ alerts }: SmartAlertsProps) {
  return (
    <div className="space-y-4">
      {alerts.map((alerta, i) => {
        const e = ALERTA_ESTILO[alerta.tipo];
        return (
          <div key={i} className={`${e.bg} border ${e.border} rounded-2xl p-4 shadow-sm`}>
            <p className={`${e.titulo} text-sm font-bold mb-1.5`}>{alerta.titulo}</p>
            <p className="text-secondary text-sm leading-relaxed">{alerta.mensagem}</p>
            {alerta.acao && e.btn && (
              <button
                className={`mt-3 w-full py-2 rounded-lg border ${e.btn.border} ${e.btn.bg} ${e.btn.color} text-xs font-bold ${e.btn.hover} transition-all shadow-sm dark:shadow-none`}
              >
                {alerta.acao}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
