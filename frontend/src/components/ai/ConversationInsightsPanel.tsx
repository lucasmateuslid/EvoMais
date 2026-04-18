import React, { useMemo } from 'react';
import { AlertTriangle, GaugeCircle, ShieldCheck, TrendingUp } from 'lucide-react';

import type { AIContext, ChatMessage } from '../../types/ai';

type InsightSnapshot = {
  bantPercent: number;
  bantClassificacao: 'Frio' | 'Morno' | 'Quente' | 'Hot';
  aggressivenessLevel: 'N1' | 'N2' | 'N3' | 'N4';
  strengths: string[];
  weaknesses: string[];
  criticalPoints: string[];
  sourceTimestamp: string | null;
};

interface ConversationInsightsPanelProps {
  messages: ChatMessage[];
  context: AIContext;
  loading: boolean;
}

const POSITIVE_TOKENS = [
  'força', 'forte', 'vantagem', 'fit', 'quente', 'hot', 'oportunidade',
  'boa abertura', 'aderência', 'dor clara', 'champion', 'valor percebido',
] as const;

const WEAKNESS_TOKENS = [
  'fraco', 'fraqueza', 'gap', 'obje', 'trav', 'falta', 'pendente', 'risco',
  'insegurança', 'desconto', 'sem resposta', 'concorr',
] as const;

const CRITICAL_TOKENS = [
  'crítico', 'critico', 'urgente', 'alerta', 'perda', 'risco alto',
  'vencido', 'bloqueio', 'janela curta', 'estagnado',
] as const;

const cleanLine = (line: string): string =>
  line
    .replace(/^#{1,3}\s+/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*\*/g, '')
    .trim();

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const toUnique = (items: string[], max = 3): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(item);
    if (result.length >= max) break;
  }

  return result;
};

const containsAnyToken = (line: string, tokens: readonly string[]): boolean => {
  const normalized = line.toLowerCase();
  return tokens.some(token => normalized.includes(token));
};

const classifyBant = (bantPercent: number): InsightSnapshot['bantClassificacao'] => {
  if (bantPercent >= 76) return 'Hot';
  if (bantPercent >= 56) return 'Quente';
  if (bantPercent >= 36) return 'Morno';
  return 'Frio';
};

const extractBantPercent = (text: string): number | null => {
  const by40 = text.match(/bant[^\d]{0,20}(\d{1,2})\s*\/\s*40/i);
  if (by40?.[1]) {
    const value = Number(by40[1]);
    if (!Number.isNaN(value)) return clamp(Math.round((value / 40) * 100), 0, 100);
  }

  const byPercent = text.match(/bant[^\d]{0,20}(\d{1,3})\s*%/i);
  if (byPercent?.[1]) {
    const value = Number(byPercent[1]);
    if (!Number.isNaN(value)) return clamp(value, 0, 100);
  }

  const leadScore = text.match(/lead\s*score[^\d]{0,20}(\d{1,3})\s*%?/i);
  if (leadScore?.[1]) {
    const value = Number(leadScore[1]);
    if (!Number.isNaN(value)) return clamp(Math.round(value * 0.8), 0, 100);
  }

  return null;
};

const extractAggressivenessLevel = (text: string): InsightSnapshot['aggressivenessLevel'] | null => {
  const levelMatch = text.match(/n[ií]vel\s+de\s+agressividade\s+recomendado\s*[:\-]?\s*(N[1-4])/i);
  if (levelMatch?.[1]) return levelMatch[1].toUpperCase() as InsightSnapshot['aggressivenessLevel'];

  const shorthand = text.match(/\b(N[1-4])\b/i);
  if (shorthand?.[1]) return shorthand[1].toUpperCase() as InsightSnapshot['aggressivenessLevel'];

  return null;
};

const heuristicBant = (context: AIContext): number => {
  let score = 38;

  if (context.pipelineTotal > 0) score += 10;
  if (context.taxaConversao >= 30) score += 12;
  if (context.topDeals.length >= 3) score += 8;
  if (context.followupsVencidos > 5) score -= 14;
  if (context.followupsVencidos > 0 && context.followupsVencidos <= 5) score -= 6;

  return clamp(score, 10, 92);
};

const recommendAggressiveness = (
  bantPercent: number,
  context: AIContext,
): InsightSnapshot['aggressivenessLevel'] => {
  if (bantPercent >= 76) return 'N4';
  if (bantPercent >= 61) return context.followupsVencidos > 5 ? 'N4' : 'N3';
  if (bantPercent >= 41) return 'N2';
  return 'N1';
};

function deriveInsights(messages: ChatMessage[], context: AIContext): InsightSnapshot {
  const aiMessages = messages.filter(
    message => message.type === 'ai' && !message.text.toLowerCase().includes('desculpe, ocorreu um erro'),
  );

  const recentMessages = aiMessages.slice(-3);
  const latestMessage = recentMessages[recentMessages.length - 1] ?? null;
  const textSource = recentMessages.map(message => message.text).join('\n\n');

  const lines = textSource
    .replace(/\r/g, '')
    .split('\n')
    .map(cleanLine)
    .filter(line => line.length >= 8);

  const strengths = toUnique(lines.filter(line => containsAnyToken(line, POSITIVE_TOKENS)));
  const weaknesses = toUnique(lines.filter(line => containsAnyToken(line, WEAKNESS_TOKENS)));
  const criticalPoints = toUnique(lines.filter(line => containsAnyToken(line, CRITICAL_TOKENS)));

  if (strengths.length === 0 && context.topDeals.length > 0) {
    strengths.push(
      `Pipeline com ${context.topDeals.length} oportunidades relevantes para priorização comercial.`,
    );
  }

  if (weaknesses.length === 0) {
    const earlyStages = (context.negociosPorEtapa.prospeccao || 0) + (context.negociosPorEtapa.qualificacao || 0);
    if (earlyStages > 0) {
      weaknesses.push('Parte do pipeline ainda está em etapas iniciais e exige qualificação mais firme.');
    }
  }

  if (criticalPoints.length === 0 && context.followupsVencidos > 0) {
    criticalPoints.push(
      `${context.followupsVencidos} follow-ups vencidos podem reduzir a chance de fechamento no curto prazo.`,
    );
  }

  const bantPercent = extractBantPercent(textSource) ?? heuristicBant(context);
  const aggressivenessLevel =
    extractAggressivenessLevel(textSource) ?? recommendAggressiveness(bantPercent, context);

  return {
    bantPercent,
    bantClassificacao: classifyBant(bantPercent),
    aggressivenessLevel,
    strengths: toUnique(strengths.length > 0 ? strengths : ['Ainda sem sinais fortes suficientes na conversa atual.']),
    weaknesses: toUnique(weaknesses.length > 0 ? weaknesses : ['Sem fragilidades explícitas extraídas; peça uma análise mais detalhada do deal.']),
    criticalPoints: toUnique(criticalPoints.length > 0 ? criticalPoints : ['Sem alerta crítico explícito neste momento.']),
    sourceTimestamp: latestMessage?.created_at ?? null,
  };
}

const BANT_COLOR: Record<InsightSnapshot['bantClassificacao'], string> = {
  Frio: 'text-slate-500',
  Morno: 'text-amber-500',
  Quente: 'text-orange-500',
  Hot: 'text-emerald-500',
};

const AGGRESSIVENESS_STYLE: Record<InsightSnapshot['aggressivenessLevel'], string> = {
  N1: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25',
  N2: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25',
  N3: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  N4: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25',
};

function InsightsList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-divider-subtle bg-surface-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-xs font-bold tracking-wide text-primary uppercase">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="text-sm text-secondary leading-relaxed">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConversationInsightsPanel({ messages, context, loading }: ConversationInsightsPanelProps) {
  const insights = useMemo(() => deriveInsights(messages, context), [messages, context]);

  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1 space-y-4">
      <div className="rounded-2xl border border-divider-subtle bg-surface-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">Radar da conversa</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${AGGRESSIVENESS_STYLE[insights.aggressivenessLevel]}`}>
            {insights.aggressivenessLevel}
          </span>
        </div>

        <div className="rounded-xl border border-divider-soft bg-surface px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GaugeCircle className="h-4 w-4 text-brand" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">BANT</p>
            </div>
            <p className={`text-sm font-bold ${BANT_COLOR[insights.bantClassificacao]}`}>
              {insights.bantPercent}% • {insights.bantClassificacao}
            </p>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-500"
              style={{ width: `${insights.bantPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Nível de agressividade sugerido: {insights.aggressivenessLevel}
          </p>
        </div>

        <p className="mt-3 text-[11px] text-muted">
          {loading ? 'Atualizando análise da conversa...' : 'Painel reativo com base nas últimas mensagens da IA.'}
          {insights.sourceTimestamp ? ` • Última atualização: ${new Date(insights.sourceTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
      </div>

      <InsightsList
        title="Pontos fortes"
        items={insights.strengths}
        icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
      />

      <InsightsList
        title="Pontos fracos"
        items={insights.weaknesses}
        icon={<ShieldCheck className="h-4 w-4 text-amber-500" />}
      />

      <InsightsList
        title="Pontos críticos"
        items={insights.criticalPoints}
        icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
      />
    </div>
  );
}
