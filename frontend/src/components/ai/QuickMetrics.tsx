import React from 'react';
import { PipelineMetrics } from '../../types/ai';

interface QuickMetricsProps {
  metrics: PipelineMetrics;
}

const formatarValor = (v: number) =>
  v >= 1000000
    ? `R$ ${(v / 1000000).toFixed(1)}M`
    : v >= 1000
    ? `R$ ${(v / 1000).toFixed(0)}k`
    : `R$ ${v}`;

export function QuickMetrics({ metrics }: QuickMetricsProps) {
  const items = [
    { label: "negócios ativos",     valor: metrics.negociosAtivos,    cor: "text-emerald-600 dark:text-emerald-400", size: "text-xl" },
    { label: "follow-ups",           valor: metrics.followupsPendentes, cor: "text-amber-600 dark:text-amber-400", size: "text-xl" },
    { label: "pipeline total",       valor: formatarValor(metrics.pipelineTotal), cor: "text-primary", size: "text-base" },
    { label: "taxa de conversão",    valor: `${metrics.taxaConversao}%`, cor: "text-blue-600 dark:text-blue-400", size: "text-xl" },
  ];

  return (
    <div className="bg-surface-card border border-divider-subtle rounded-2xl p-5 shadow-sm">
      <p className="text-muted text-xs font-bold tracking-wider mb-4 uppercase">ESTA SEMANA</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((m) => (
          <div key={m.label} className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 text-center border border-divider-subtle">
            <p className={`${m.cor} ${m.size} font-bold mb-1`}>{m.valor}</p>
            <p className="text-muted text-xs font-medium">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
