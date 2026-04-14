import React, { useState } from 'react';
import { 
  Building2, Users, CreditCard, Activity, Search, 
  MoreVertical, Plus, Edit2, Ban, CheckCircle2 
} from 'lucide-react';

// Mock data for tenants
const MOCK_TENANTS = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    domain: 'techcorp.evoplus.com',
    plan: 'Enterprise',
    activeUsers: 45,
    maxUsers: 50,
    status: 'active',
    createdAt: '2023-01-15',
    mrr: 999
  },
  {
    id: '2',
    name: 'Vendas Rápidas Ltda',
    domain: 'vendasrapidas.evoplus.com',
    plan: 'Pro',
    activeUsers: 12,
    maxUsers: 15,
    status: 'active',
    createdAt: '2023-05-22',
    mrr: 299
  },
  {
    id: '3',
    name: 'StartUp Inovadora',
    domain: 'startup.evoplus.com',
    plan: 'Basic',
    activeUsers: 3,
    maxUsers: 5,
    status: 'trial',
    createdAt: '2023-10-01',
    mrr: 0
  },
  {
    id: '4',
    name: 'Comércio Antigo',
    domain: 'comercio.evoplus.com',
    plan: 'Pro',
    activeUsers: 8,
    maxUsers: 15,
    status: 'suspended',
    createdAt: '2022-11-10',
    mrr: 299
  }
];

export default function AdminTenantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tenants, setTenants] = useState(MOCK_TENANTS);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = tenants.reduce((acc, curr) => acc + curr.activeUsers, 0);
  const totalMRR = tenants.reduce((acc, curr) => acc + (curr.status === 'active' ? curr.mrr : 0), 0);
  const activeTenants = tenants.filter(t => t.status === 'active').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Ativo</span>;
      case 'trial':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-medium"><Activity className="w-3 h-3" /> Trial</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 text-xs font-medium"><Ban className="w-3 h-3" /> Suspenso</span>;
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">Enterprise</span>;
      case 'Pro':
        return <span className="px-2.5 py-1 rounded-md bg-brand/10 text-brand dark:text-brand-light text-xs font-bold uppercase tracking-wider">Pro</span>;
      case 'Basic':
        return <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">Basic</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Tenants</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitore e administre todas as empresas clientes da plataforma.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Novo Tenant
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Building2 className="w-5 h-5 text-brand" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Total de Empresas</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{tenants.length}</p>
        </div>
        
        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Empresas Ativas</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{activeTenants}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">Usuários Ativos</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{totalUsers}</p>
        </div>

        <div className="bg-surface border border-divider-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-medium text-secondary">MRR Estimado</h3>
          </div>
          <p className="text-2xl font-bold text-primary">R$ {totalMRR.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-surface border border-divider-subtle rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou domínio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-input border border-divider-subtle rounded-xl focus:ring-2 focus:ring-brand text-sm text-primary placeholder-secondary transition-colors focus:outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-surface-input border border-divider-subtle rounded-xl px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="all">Todos os Planos</option>
            <option value="enterprise">Enterprise</option>
            <option value="pro">Pro</option>
            <option value="basic">Basic</option>
          </select>
          <select className="flex-1 sm:flex-none bg-surface-input border border-divider-subtle rounded-xl px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-surface border border-divider-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-input border-b border-divider-subtle">
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Usuários</th>
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-subtle">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-surface-input/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{tenant.name}</p>
                        <p className="text-xs text-secondary">{tenant.domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(tenant.plan)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${tenant.activeUsers / tenant.maxUsers > 0.9 ? 'bg-red-500' : 'bg-brand'}`}
                          style={{ width: `${(tenant.activeUsers / tenant.maxUsers) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-secondary">
                        {tenant.activeUsers}/{tenant.maxUsers}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tenant.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors" title="Editar Tenant">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Suspender">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTenants.length === 0 && (
            <div className="p-8 text-center text-secondary">
              Nenhum tenant encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
