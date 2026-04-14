import React from 'react';
import { PipelineHealth as HealthType } from '../../types/ai';

const corScore = (s: number) => (s >= 70 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500");
const textScore = (s: number) => (s >= 70 ? "text-emerald-600 dark:text-emerald-400" : s >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400");

interface PipelineHealthProps {
  scores: HealthType[];
}

export function PipelineHealth({ scores }: PipelineHealthProps) {
  return (
    <div className="bg-surface-card border border-divider-subtle rounded-2xl p-5 shadow-sm">
      <p className="text-muted text-xs font-bold tracking-wider mb-4 uppercase">SAÚDE DO PIPELINE</p>
      <div className="space-y-4">
        {scores.map((s) => (
          <div key={s.empresa}>
            <div className="flex justify-between mb-1.5">
              <span className="text-primary text-sm font-medium">{s.empresa}</span>
              <span className={`text-sm font-bold ${textScore(s.score)}`}>{s.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${corScore(s.score)}`}
                style={{ width: `${s.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
