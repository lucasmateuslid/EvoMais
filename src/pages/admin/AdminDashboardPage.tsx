import React, { useState } from 'react';
import { 
  Building2, AlertCircle, Activity, DollarSign, 
  TrendingDown, Users, MessageSquare, Zap, Calendar, CreditCard,
  Filter, ChevronDown
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// --- Mock Data ---
const KPI_DATA = {
  activeCompanies: 142,
  defaultingCompanies: 12,
  trialCompanies: 28,
  estimatedRevenue: 45200,
  defaultingRevenue: 3450,
};

const PLAN_DATA = [
  { name: 'Enterprise', value: 15, color: '#8b5cf6' },
  { name: 'Pro', value: 85, color: '#10b981' },
  { name: 'Basic', value: 42, color: '#64748b' },
];

const FUNNEL_DATA = [
  { name: 'Visitantes', value: 5000, color: '#94a3b8' },
  { name: 'Leads', value: 1200, color: '#60a5fa' },
  { name: 'Trials', value: 300, color: '#34d399' },
  { name: 'Clientes Ativos', value: 142, color: '#10b981' },
];

const MOCK_COMPANIES = [
  { id: '1', name: 'TechCorp Solutions' },
  { id: '2', name: 'Vendas Rápidas Ltda' },
  { id: '3', name: 'StartUp Inovadora' },
];

const COMPANY_DETAILS = {
  '1': {
    users: 45,
    maxUsers: 50,
    tokens: '2.4M',
    activationDate: '15/01/2023',
    nextBilling: '15/05/2026',
    planValue: 999,
    messages: {
      'Hora': 120,
      'Dia': 2800,
      'Mês': 84000,
      'Trimestre': 252000,
      'Ano': 1008000
    }
  },
  '2': {
    users: 12,
    maxUsers: 15,
    tokens: '450K',
    activationDate: '22/05/2023',
    nextBilling: '22/05/2026',
    planValue: 299,
    messages: {
      'Hora': 45,
      'Dia': 950,
      'Mês': 28500,
      'Trimestre': 85500,
      'Ano': 342000
    }
  },
  '3': {
    users: 3,
    maxUsers: 5,
    tokens: '50K',
    activationDate: '01/10/2023',
    nextBilling: '01/11/2023',
    planValue: 0,
    messages: {
      'Hora': 5,
      'Dia': 120,
      'Mês': 3600,
      'Trimestre': 10800,
      'Ano': 43200
    }
  }
};

export default function AdminDashboardPage() {
  const [selectedCompany, setSelectedCompany] = useState('1');
  const [messageTimeframe, setMessageTimeframe] = useState<'Hora' | 'Dia' | 'Mês' | 'Trimestre' | 'Ano'>('Mês');

  const companyData = COMPANY_DETAILS[selectedCompany as keyof typeof COMPANY_DETAILS];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral do negócio, faturamento e análise detalhada por cliente.</p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Empresas Ativas</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{KPI_DATA.activeCompanies}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Inadimplentes</h3>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{KPI_DATA.defaultingCompanies}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Em Teste (Trial)</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{KPI_DATA.trialCompanies}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-brand" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Fat. Estimado</h3>
          </div>
          <p className="text-2xl font-bold text-primary">R$ {KPI_DATA.estimatedRevenue.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Fat. Inadimplente</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">R$ {KPI_DATA.defaultingRevenue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empresas por Plano */}
        <div className="bg-surface border border-divider-subtle rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">Empresas por Plano</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PLAN_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PLAN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funil de Vendas */}
        <div className="bg-surface border border-divider-subtle rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">Funil de Vendas (Geral)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FUNNEL_DATA}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {FUNNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Company Specific Analysis */}
      <div className="bg-surface border border-divider-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold text-primary">Análise por Empresa</h3>
            <p className="text-sm text-secondary mt-1">Selecione um tenant para ver métricas detalhadas.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full appearance-none bg-surface-input border border-divider-subtle rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            >
              {MOCK_COMPANIES.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>
        </div>

        {companyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-semibold text-primary">Usuários</h4>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{companyData.users}</span>
                <span className="text-secondary mb-1">/ {companyData.maxUsers} licenças</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${companyData.users / companyData.maxUsers > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${(companyData.users / companyData.maxUsers) * 100}%` }}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-brand" />
                  </div>
                  <h4 className="font-semibold text-primary">Mensagens</h4>
                </div>
                <select 
                  value={messageTimeframe}
                  onChange={(e) => setMessageTimeframe(e.target.value as any)}
                  className="bg-surface border border-divider-subtle rounded-lg px-2 py-1 text-xs font-medium text-primary focus:outline-none"
                >
                  <option value="Hora">Por Hora</option>
                  <option value="Dia">Por Dia</option>
                  <option value="Mês">Por Mês</option>
                  <option value="Trimestre">Por Trimestre</option>
                  <option value="Ano">Por Ano</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">
                  {companyData.messages[messageTimeframe].toLocaleString('pt-BR')}
                </span>
                <span className="text-secondary mb-1">mensagens / {messageTimeframe.toLowerCase()}</span>
              </div>
            </div>

            {/* Tokens */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="font-semibold text-primary">Uso de IA (Tokens)</h4>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{companyData.tokens}</span>
                <span className="text-secondary mb-1">tokens processados</span>
              </div>
            </div>

            {/* Activation Date */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="font-semibold text-primary">Data de Ativação</h4>
              </div>
              <div className="text-xl font-bold text-primary">{companyData.activationDate}</div>
            </div>

            {/* Next Billing */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className="font-semibold text-primary">Próxima Mensalidade</h4>
              </div>
              <div className="text-xl font-bold text-primary">{companyData.nextBilling}</div>
            </div>

            {/* Plan Value */}
            <div className="bg-surface-input rounded-xl p-5 border border-divider-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="font-semibold text-primary">Valor do Plano</h4>
              </div>
              <div className="text-xl font-bold text-primary">
                {companyData.planValue === 0 ? 'Gratuito (Trial)' : `R$ ${companyData.planValue.toLocaleString('pt-BR')}/mês`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
