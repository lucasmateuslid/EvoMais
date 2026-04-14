import { useState } from 'react';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useTimelineMetrics } from '../hooks/useTimelineMetrics';

export default function MetricsPage() {
  const [view, setView] = useState<'daily' | 'hourly'>('daily');
  const { data, loading, error } = useTimelineMetrics();

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-500">
        {error || 'Erro ao carregar métricas.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-sm text-secondary">Total Mensagens</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.kpis.totalMessages}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-sm text-secondary">Total Conversas</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.kpis.totalConversations}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-sm text-secondary">Dia Mais Ativo</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.kpis.mostActiveDay}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-sm text-secondary">Hora Mais Ativa</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.kpis.mostActiveHour}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-divider-subtle bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Mensagens e Conversas</h2>
          <div className="rounded-lg border border-divider-subtle bg-surface-input p-1">
            <button
              onClick={() => setView('daily')}
              className={`rounded-md px-3 py-1.5 text-sm ${view === 'daily' ? 'bg-surface text-primary shadow-sm' : 'text-secondary'}`}
            >
              Por Dia
            </button>
            <button
              onClick={() => setView('hourly')}
              className={`rounded-md px-3 py-1.5 text-sm ${view === 'hourly' ? 'bg-surface text-primary shadow-sm' : 'text-secondary'}`}
            >
              Por Hora
            </button>
          </div>
        </div>

        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'daily' ? (
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="mensagens" name="Mensagens" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="conversas" name="Conversas" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data.hourly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" minTickGap={24} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mensagens" name="Mensagens" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversas" name="Conversas" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
