import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquareText,
  Plus,
  Tag,
  Users2,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useVendors } from '../hooks/useVendors';

const channelPalette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#0ea5e9'];

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRangeLabel(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Ultimos 7 dias';
  }
  return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
}

function formatMinutes(value: number) {
  if (!value || value <= 0) {
    return '0 min';
  }

  const totalSeconds = Math.round(value * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} seg`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} seg`;
}

function formatDuration(value: number) {
  if (!value || value <= 0) {
    return '0 min';
  }

  const totalMinutes = Math.round(value);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} dia${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 && parts.length < 2) {
    parts.push(`${minutes} min`);
  }

  return parts.join(' ');
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR');
}

function MetricCard({
  title,
  value,
  helper,
  icon,
  tone,
}: {
  title: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-divider-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          {icon}
        </div>
        {helper && <span className="text-xs font-semibold text-secondary">{helper}</span>}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{title}</p>
        <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const today = new Date();
  const defaultEnd = toInputDate(today);
  const defaultStart = toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedSeller, setSelectedSeller] = useState('all');

  const sellerIds = selectedSeller === 'all' ? [] : [selectedSeller];
  const filters = useMemo(() => ({ start: startDate, end: endDate, sellerIds }), [startDate, endDate, selectedSeller]);

  const { data, loading, error } = useDashboardMetrics(filters);
  const { data: vendorsData } = useVendors();

  const attendance = data?.attendance;
  const kpis = attendance?.kpis || {
    pendingBefore: 0,
    newInPeriod: 0,
    resolvedInPeriod: 0,
    pendingAfter: 0,
  };

  const capacityData = attendance?.capacity || [];
  const waitDaily = attendance?.waitTime.daily || [];
  const durationDaily = attendance?.duration.daily || [];
  const channels = attendance?.channels || [];
  const tags = attendance?.tags || [];
  const hourlyVolume = attendance?.hourlyVolume || [];
  const peakHour = attendance?.peakHour || '-';

  const periodLabel = formatRangeLabel(startDate, endDate);
  const waitAverageLabel = formatMinutes(attendance?.waitTime.averageMinutes || 0);
  const durationAverageLabel = formatDuration(attendance?.duration.averageMinutes || 0);
  const totalConversations = attendance?.waitTime.totalConversations || 0;
  const respondedConversations = attendance?.waitTime.respondedConversations || 0;
  const concludedConversations = attendance?.duration.concludedConversations || 0;
  const maxTag = Math.max(...tags.map(tag => tag.count), 1);

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
        {error || 'Nao foi possivel carregar os indicadores do dashboard.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Dashboard de atendimento</p>
            <h1 className="mt-2 text-2xl font-bold">Indicadores de fluxo e produtividade</h1>
            <p className="mt-2 text-sm text-slate-200">
              Periodo ativo: <span className="font-semibold">{periodLabel}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-200">
                <Filter className="h-4 w-4" />
                Equipes
              </div>
              <select
                value={selectedSeller}
                onChange={event => setSelectedSeller(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="all">Todos</option>
                {(vendorsData?.vendors || []).map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="text-[11px] font-semibold uppercase text-slate-200">Periodo</div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={event => setStartDate(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={event => setEndDate(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pendentes antes do periodo"
          value={formatNumber(kpis.pendingBefore)}
          helper="backlog"
          icon={<Clock3 className="h-5 w-5 text-slate-700" />}
          tone="bg-slate-100"
        />
        <MetricCard
          title="Novos no periodo"
          value={formatNumber(kpis.newInPeriod)}
          helper="entrada"
          icon={<Plus className="h-5 w-5 text-emerald-600" />}
          tone="bg-emerald-50"
        />
        <MetricCard
          title="Concluidos no periodo"
          value={formatNumber(kpis.resolvedInPeriod)}
          helper="saida"
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          tone="bg-blue-50"
        />
        <MetricCard
          title="Pendentes apos o periodo"
          value={formatNumber(kpis.pendingAfter)}
          helper="acumulo"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          tone="bg-orange-50"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Capacidade de atendimento</h2>
              <p className="text-xs text-secondary">Novos x concluidos e estoque diario</p>
            </div>
            <div className="text-xs font-medium text-secondary">{periodLabel}</div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={capacityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                />
                <Legend />
                <Bar dataKey="newCount" name="Novos" fill="#34d399" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="resolvedCount" name="Concluidos" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="pendingCount" name="Pendentes" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-secondary">Resumo do periodo</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-divider-subtle bg-surface-input/60 p-4">
              <p className="text-xs font-semibold text-secondary">Novos atendimentos</p>
              <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(kpis.newInPeriod)}</p>
            </div>
            <div className="rounded-2xl border border-divider-subtle bg-surface-input/60 p-4">
              <p className="text-xs font-semibold text-secondary">Concluidos</p>
              <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(kpis.resolvedInPeriod)}</p>
            </div>
            <div className="rounded-2xl border border-divider-subtle bg-surface-input/60 p-4">
              <p className="text-xs font-semibold text-secondary">Pendencias ativas</p>
              <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(kpis.pendingAfter)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Tempo de espera</h2>
              <p className="text-xs text-secondary">
                Considerados {respondedConversations} de {totalConversations} atendimentos iniciados
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary">Tendencia</p>
              <p className="text-lg font-bold text-primary">{waitAverageLabel}</p>
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={waitDaily} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                />
                <Bar dataKey="averageMinutes" name="Tempo de espera (min)" fill="#f97316" radius={[6, 6, 0, 0]} barSize={22} />
                <Line type="monotone" dataKey="trendMinutes" name="Tendencia" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Duracao do atendimento</h2>
              <p className="text-xs text-secondary">{concludedConversations} atendimentos concluidos no periodo</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary">Tendencia geral</p>
              <p className="text-lg font-bold text-primary">{durationAverageLabel}</p>
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={durationDaily} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                />
                <Bar dataKey="averageMinutes" name="Duracao (min)" fill="#facc15" radius={[6, 6, 0, 0]} barSize={22} />
                <Line type="monotone" dataKey="trendMinutes" name="Tendencia" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">Atendimentos por canal</h2>
              <p className="text-xs text-secondary">Distribuicao por origem</p>
            </div>
            <MessageSquareText className="h-5 w-5 text-secondary" />
          </div>
          <div className="mt-6 h-64">
            {channels.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-secondary">
                Nenhum canal registrado no periodo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channels}
                    dataKey="count"
                    nameKey="channel"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {channels.map((entry, index) => (
                      <Cell key={entry.channel} fill={channelPalette[index % channelPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      backgroundColor: 'var(--color-bg-surface)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">Etiquetas</h2>
              <p className="text-xs text-secondary">Top etiquetas usadas no periodo</p>
            </div>
            <Tag className="h-5 w-5 text-secondary" />
          </div>
          <div className="mt-6 space-y-3">
            {tags.length === 0 ? (
              <div className="rounded-2xl border border-divider-subtle bg-surface-input/60 p-4 text-sm text-secondary">
                Nenhuma etiqueta registrada para o periodo selecionado.
              </div>
            ) : (
              tags.slice(0, 12).map(tag => (
                <div key={tag.tag} className="flex items-center gap-3">
                  <span className="w-32 truncate text-sm font-semibold text-primary">{tag.tag}</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-input">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{ width: `${Math.max((tag.count / maxTag) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-secondary">{formatNumber(tag.count)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary">Volume diario de atendimentos</h2>
            <p className="text-xs text-secondary">Distribuicao por hora no periodo selecionado</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-secondary">Pico de atendimento</p>
            <p className="text-lg font-bold text-primary">{peakHour}</p>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyVolume} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  backgroundColor: 'var(--color-bg-surface)',
                }}
              />
              <Bar dataKey="count" name="Atendimentos" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-secondary">
        <span>Atualizado em {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
        <span className="flex items-center gap-2"><Users2 className="h-4 w-4" /> {formatNumber((vendorsData?.vendors || []).length)} vendedores ativos</span>
      </div>
    </div>
  );
}
