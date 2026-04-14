import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Clock,
  FileText,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useTenant } from '../hooks/useTenant';

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function trend(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function trendTag(value: number, suffix = '%') {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return {
    Icon,
    className: positive
      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      : 'text-red-500 bg-red-50 dark:bg-red-500/10',
    text: `${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${suffix}`,
  };
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardMetrics();
  const { tenant } = useTenant();

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

  const areaData = data.charts.areaData;
  const barData = data.charts.weeklyPerformance;

  const lastRevenue = areaData[areaData.length - 1]?.value || 0;
  const previousRevenue = areaData[areaData.length - 2]?.value || 0;
  const revenueTrend = trend(lastRevenue, previousRevenue);

  const firstHalfLeads = sum(barData.slice(0, 3).map(day => day.prospects));
  const secondHalfLeads = sum(barData.slice(-3).map(day => day.prospects));
  const leadsTrend = trend(secondHalfLeads, firstHalfLeads);

  const conversionVsTarget = Number((data.summary.conversionRate - 10).toFixed(1));
  const cycleVsTargetDays = Number((14 - data.summary.avgCycleDays).toFixed(1));

  const pipelineProspeccao = data.pipelineByStage.prospeccao || 0;
  const pipelineQualificacao = data.pipelineByStage.qualificacao || 0;
  const pipelineProposta = (data.pipelineByStage.proposta || 0) + (data.pipelineByStage.negociacao || 0);
  const pipelineFechamento = data.pipelineByStage.fechamento || 0;

  const hotLeads = data.hotLeads.slice(0, 3);
  const topVendors = data.topVendors.slice(0, 3);
  const maxConversations = Math.max(...topVendors.map(vendor => vendor.conversations), 1);

  const revenueTag = trendTag(revenueTrend);
  const leadsTag = trendTag(leadsTrend);
  const conversionTag = trendTag(conversionVsTarget, ' pp');
  const cycleTag = trendTag(cycleVsTargetDays, 'd');

  const bestLead = hotLeads[0];

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-bold text-purple-300 tracking-wider uppercase">AI Velocity Insight</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {tenant?.domain || tenant?.subdomain || 'Tenant atual'}: pipeline ativo com {data.summary.newLeads} novos leads.
            </h2>

            <p className="text-purple-100/80 leading-relaxed max-w-3xl">
              Receita dos ultimos 30 dias em {currency(data.summary.monthlyRevenue)}. Conversao geral em {data.summary.conversionRate}% e {data.summary.activeVendors} vendedores ativos. {bestLead ? `Maior oportunidade atual: ${bestLead.company} (${currency(bestLead.value)}).` : 'Sem hot leads registrados no momento.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/crm')}
            className="whitespace-nowrap flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20"
          >
            <Zap className="w-5 h-5" />
            Acelerar Leads
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className={`flex items-center text-sm font-medium px-2.5 py-1 rounded-full ${revenueTag.className}`}>
              <revenueTag.Icon className="h-4 w-4 mr-1" />
              {revenueTag.text}
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Receita Mensal</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{currency(data.summary.monthlyRevenue)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-brand/10 dark:bg-brand-light/10 p-3 rounded-2xl">
              <Users className="h-6 w-6 text-brand dark:text-brand-light" />
            </div>
            <span className={`flex items-center text-sm font-medium px-2.5 py-1 rounded-full ${leadsTag.className}`}>
              <leadsTag.Icon className="h-4 w-4 mr-1" />
              {leadsTag.text}
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Novos Leads</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.newLeads.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className={`flex items-center text-sm font-medium px-2.5 py-1 rounded-full ${conversionTag.className}`}>
              <conversionTag.Icon className="h-4 w-4 mr-1" />
              {conversionTag.text}
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Conversao</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.conversionRate}%</p>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-2xl">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className={`flex items-center text-sm font-medium px-2.5 py-1 rounded-full ${cycleTag.className}`}>
              <cycleTag.Icon className="h-4 w-4 mr-1" />
              {cycleTag.text}
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tempo Medio Ciclo</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.avgCycleDays}d</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Semanal</h2>
            <div className="flex gap-2">
              <span className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-brand mr-2" />
                Vendas
              </span>
              <span className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2" />
                Prospectos
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f9fafb', opacity: 0.1 }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 6, 6]} barSize={32} />
                <Bar dataKey="prospects" fill="#34d399" radius={[6, 6, 6, 6]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Evolucao do Funil</h2>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="relative">
              <div className="w-full bg-brand/10 dark:bg-blue-900/20 rounded-xl p-4 flex justify-between items-center border border-blue-100 dark:border-blue-800/30">
                <div>
                  <p className="text-xs font-bold text-brand dark:text-brand-light tracking-wider">PROSPECCAO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Leads Ativos</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{pipelineProspeccao.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
              <div className="w-full bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex justify-between items-center border border-purple-100 dark:border-purple-800/30">
                <div>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wider">QUALIFICACAO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SQLs</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{pipelineQualificacao.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="relative pl-8">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
              <div className="w-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex justify-between items-center border border-orange-100 dark:border-orange-800/30">
                <div>
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider">PROPOSTA</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Negociacoes</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{pipelineProposta.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
              <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex justify-between items-center border border-emerald-100 dark:border-emerald-800/30">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">FECHAMENTO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Este Mes</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{pipelineFechamento.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 dark:bg-surface-deep rounded-xl p-4 flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-purple-500 tracking-wider mb-1">INSIGHT DO FUNIL</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Taxa de conversao geral em {data.summary.conversionRate}% com {data.summary.followupsOverdue} follow-ups vencidos no tenant atual.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hot Leads</h2>
              <p className="text-xs font-bold text-red-500 tracking-wider mt-1">ALTA PRIORIDADE</p>
            </div>
            <button onClick={() => navigate('/crm')} className="text-sm font-medium text-brand dark:text-brand-light hover:text-brand-dark">
              Ver todos
            </button>
          </div>

          <div className="space-y-4">
            {hotLeads.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-surface-deep rounded-xl text-sm text-gray-500 dark:text-gray-400">
                Nenhum hot lead encontrado neste momento.
              </div>
            ) : (
              hotLeads.map((lead, index) => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-deep rounded-xl hover:bg-gray-100 dark:hover:bg-surface-input transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-gray-900 dark:text-white">{lead.company}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{currency(lead.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Performance</h2>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {topVendors.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-surface-deep rounded-xl text-sm text-gray-500 dark:text-gray-400">
                Ainda nao ha vendedores com conversas registradas.
              </div>
            ) : (
              topVendors.map(vendor => {
                const score = Math.round((vendor.conversations / maxConversations) * 100);

                return (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-deep rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/15 text-brand dark:text-brand-light flex items-center justify-center text-sm font-bold">
                        {initials(vendor.name)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white block">{vendor.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{vendor.messages.toLocaleString('pt-BR')} mensagens</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                      {score}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Acoes Rapidas</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/crm')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-brand/10 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-brand dark:text-brand-light" />
              </div>
              <span className="font-medium text-blue-900 dark:text-blue-300">Novo Lead</span>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-purple-900 dark:text-purple-300">Relatorio</span>
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Ultima atualizacao: {new Date(data.generatedAt).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
