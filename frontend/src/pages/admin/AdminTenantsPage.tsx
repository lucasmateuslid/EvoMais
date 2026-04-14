import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { tenantsService, type TenantRecord } from '../../services/tenantsService';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await tenantsService.list();
        if (!active) return;
        setTenants(data);
        setError(null);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError('Erro ao carregar tenants.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const label = `${tenant.organizations?.name || ''} ${tenant.domain} ${tenant.subdomain}`.toLowerCase();
      return label.includes(search.toLowerCase());
    });
  }, [tenants, search]);

  const activeTenants = tenants.filter(tenant => tenant.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Tenants</h1>
        <p className="text-sm text-secondary">Gerencie subdomínios e status dos tenants.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Total</p>
          <p className="mt-2 text-3xl font-bold text-primary">{tenants.length}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Ativos</p>
          <p className="mt-2 text-3xl font-bold text-primary">{activeTenants}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Inativos</p>
          <p className="mt-2 text-3xl font-bold text-primary">{tenants.length - activeTenants}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <input
          className="w-full rounded-xl border border-divider-subtle bg-surface-input py-2 pl-10 pr-4 text-sm outline-none"
          placeholder="Buscar por nome, domínio ou subdomínio"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-divider-subtle bg-surface p-4 text-sm text-secondary">Carregando tenants...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-500">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-divider-subtle bg-surface shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-input text-xs uppercase tracking-wider text-secondary">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Subdomínio</th>
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => (
                <tr key={tenant.id} className="border-t border-divider-subtle">
                  <td className="px-4 py-3 text-sm text-primary">{tenant.organizations?.name || tenant.organization_id}</td>
                  <td className="px-4 py-3 text-sm text-primary">{tenant.subdomain}</td>
                  <td className="px-4 py-3 text-sm text-secondary">{tenant.domain}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-secondary">
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
