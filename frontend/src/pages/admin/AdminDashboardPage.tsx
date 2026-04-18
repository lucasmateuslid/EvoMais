import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Building2, Users, MessageSquare, BriefcaseBusiness, Database, Activity } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  adminService,
  type AdminJobsResponse,
  type AdminLogsResponse,
  type AdminStatsResponse,
} from '../../services/adminService';

type DashboardPayload = {
  stats: AdminStatsResponse;
  jobs: AdminJobsResponse;
  logs: AdminLogsResponse;
};

const chartColors = ['#10b981', '#2563eb', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f97316'];

export default function AdminDashboardPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [stats, jobs, logs] = await Promise.all([
          adminService.getStats(),
          adminService.getJobs(),
          adminService.getLogs(),
        ]);

        if (!mounted) {
          return;
        }

        setPayload({ stats, jobs, logs });
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(err);
        setError('Nao foi possivel carregar o dashboard admin.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const distributionData = useMemo(() => {
    if (!payload) {
      return [];
    }

    const { stats } = payload.stats;

    return [
      { name: 'Tenants', value: stats.tenants },
      { name: 'Usuarios', value: stats.profiles },
      { name: 'Deals', value: stats.deals },
      { name: 'Conversas', value: stats.conversations },
      { name: 'Mensagens', value: stats.messages },
    ];
  }, [payload]);

  const entitiesData = useMemo(() => {
    if (!payload) {
      return [];
    }

    const { stats } = payload.stats;

    return [
      { name: 'Empresas', total: stats.organizations },
      { name: 'Tenants', total: stats.tenants },
      { name: 'Usuarios', total: stats.profiles },
      { name: 'Deals', total: stats.deals },
      { name: 'Conversas', total: stats.conversations },
      { name: 'Mensagens', total: stats.messages },
    ];
  }, [payload]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-divider-subtle bg-surface p-6 text-sm text-secondary">
        Carregando dashboard administrativo...
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-6 text-sm text-red-500">
        {error || 'Falha ao carregar dashboard administrativo.'}
      </div>
    );
  }

  const { stats, generatedAt } = payload.stats;
  const { jobs } = payload.jobs;
  const { logs } = payload.logs;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Dados globais reais da plataforma e status operacional do backend.
        </p>
        <p className="mt-2 text-xs text-secondary">Atualizado em: {new Date(generatedAt).toLocaleString('pt-BR')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={<Building2 className="h-5 w-5 text-emerald-500" />} title="Empresas" value={stats.organizations} />
        <MetricCard icon={<Database className="h-5 w-5 text-blue-500" />} title="Tenants" value={stats.tenants} />
        <MetricCard icon={<Users className="h-5 w-5 text-indigo-500" />} title="Usuarios" value={stats.profiles} />
        <MetricCard icon={<BriefcaseBusiness className="h-5 w-5 text-amber-500" />} title="Deals" value={stats.deals} />
        <MetricCard icon={<Activity className="h-5 w-5 text-cyan-500" />} title="Conversas" value={stats.conversations} />
        <MetricCard icon={<MessageSquare className="h-5 w-5 text-orange-500" />} title="Mensagens" value={stats.messages} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-primary">Distribuicao de Entidades</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-primary">Volume por Recurso</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entitiesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusCard
          title="Fila"
          value={jobs.queueBackend ? 'Ativa' : 'Inativa'}
          helper={`Redis: ${jobs.capabilities.redis ? 'ok' : 'indisponivel'}`}
          tone={jobs.queueBackend ? 'ok' : 'warn'}
        />
        <StatusCard
          title="Workers"
          value={jobs.capabilities.workers ? 'Ativos' : 'Desabilitados'}
          helper={Object.values(jobs.queueNames).join(' | ')}
          tone={jobs.capabilities.workers ? 'ok' : 'warn'}
        />
        <StatusCard
          title="Logs"
          value={logs.sentryEnabled ? 'Sentry ativo' : 'Sentry inativo'}
          helper={logs.note}
          tone={logs.sentryEnabled ? 'ok' : 'warn'}
        />
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-lg bg-surface-input p-2">{icon}</div>
        <h3 className="text-sm font-medium text-secondary">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-primary">{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

function StatusCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: 'ok' | 'warn';
}) {
  const textTone = tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{title}</p>
      <p className={`mt-2 text-xl font-bold ${textTone}`}>{value}</p>
      <p className="mt-2 text-xs text-secondary">{helper}</p>
    </div>
  );
}
