import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, Shield, UserPlus } from 'lucide-react';

import { tenantsService, type TenantRecord } from '../services/tenantsService';
import { adminTenantsService, type TenantUserRole } from '../services/adminTenantsService';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [userRole, setUserRole] = useState<TenantUserRole>('admin');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');

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

  useEffect(() => {
    if (!organizationId && tenants.length > 0) {
      setOrganizationId(tenants[0].organization_id);
    }
  }, [organizationId, tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const label = `${tenant.organizations?.name || ''} ${tenant.domain} ${tenant.subdomain}`.toLowerCase();
      return label.includes(search.toLowerCase());
    });
  }, [tenants, search]);

  const organizationOptions = useMemo(() => {
    const uniqueOrganizations = new Map<string, { id: string; name: string; tenantCount: number }>();

    tenants.forEach(tenant => {
      const name = tenant.organizations?.name || tenant.organization_id;
      const current = uniqueOrganizations.get(tenant.organization_id);

      if (current) {
        current.tenantCount += 1;
        return;
      }

      uniqueOrganizations.set(tenant.organization_id, {
        id: tenant.organization_id,
        name,
        tenantCount: 1,
      });
    });

    return Array.from(uniqueOrganizations.values());
  }, [tenants]);

  const selectedOrganizationName = useMemo(() => {
    return organizationOptions.find(option => option.id === organizationId)?.name || 'Selecione uma empresa';
  }, [organizationId, organizationOptions]);

  const activeTenants = tenants.filter(tenant => tenant.status === 'active').length;

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingUser(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);

    try {
      if (!organizationId) {
        throw new Error('Selecione uma empresa antes de criar o usuario.');
      }

      const result = await adminTenantsService.createUser({
        organization_id: organizationId,
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword,
        phone: userPhone.trim() || undefined,
        role: userRole,
      });

      setCreateUserSuccess(`${result.profile.name} criado com sucesso para ${result.organization.name} como ${result.profile.role}.`);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserPhone('');
      setUserRole('admin');
    } catch (err) {
      console.error(err);
      setCreateUserError(err instanceof Error ? err.message : 'Erro ao criar usuario.');
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Tenants</h1>
        <p className="text-sm text-secondary">Gerencie subdominios e status dos tenants.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-divider-subtle bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                <Shield className="h-3.5 w-3.5" />
                Cadastro de acesso
              </div>
              <h2 className="mt-3 text-xl font-bold text-primary">Criar usuario com acesso real</h2>
              <p className="mt-1 text-sm text-secondary">
                O usuario sera criado no Supabase Auth e vinculado ao profile da empresa escolhida.
              </p>
            </div>
          </div>

          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleCreateUser}>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Empresa</label>
              <select
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                value={organizationId}
                onChange={event => setOrganizationId(event.target.value)}
                required
              >
                <option value="">Selecione uma empresa</option>
                {organizationOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} {option.tenantCount > 1 ? `(${option.tenantCount} tenants)` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-secondary">Empresa selecionada: {selectedOrganizationName}</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Nome</label>
              <input
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                value={userName}
                onChange={event => setUserName(event.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Telefone</label>
              <input
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                value={userPhone}
                onChange={event => setUserPhone(event.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Email</label>
              <input
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                type="email"
                value={userEmail}
                onChange={event => setUserEmail(event.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Senha inicial</label>
              <input
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                type="password"
                value={userPassword}
                onChange={event => setUserPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Perfil de acesso</label>
              <select
                className="w-full rounded-2xl border border-divider-subtle bg-surface-input px-4 py-3 text-sm text-primary outline-none"
                value={userRole}
                onChange={event => setUserRole(event.target.value as TenantUserRole)}
              >
                <option value="admin">Admin da empresa</option>
                <option value="user">Usuario</option>
                <option value="viewer">Visualizacao</option>
                <option value="super_admin">Super admin</option>
              </select>
              <p className="mt-2 text-xs text-secondary">Super admin tera acesso global ao sistema.</p>
            </div>

            {createUserError && <div className="sm:col-span-2 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{createUserError}</div>}
            {createUserSuccess && <div className="sm:col-span-2 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{createUserSuccess}</div>}

            <div className="sm:col-span-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={creatingUser}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserPlus className="h-4 w-4" />
                {creatingUser ? 'Criando...' : 'Criar usuario'}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-3xl border border-divider-subtle bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Total</p>
            <p className="mt-2 text-3xl font-bold text-primary">{tenants.length}</p>
          </div>
          <div className="rounded-3xl border border-divider-subtle bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Ativos</p>
            <p className="mt-2 text-3xl font-bold text-primary">{activeTenants}</p>
          </div>
          <div className="rounded-3xl border border-divider-subtle bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Inativos</p>
            <p className="mt-2 text-3xl font-bold text-primary">{tenants.length - activeTenants}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <input
          className="w-full rounded-2xl border border-divider-subtle bg-surface-input py-2.5 pl-10 pr-4 text-sm outline-none"
          placeholder="Buscar por nome, dominio ou subdominio"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-divider-subtle bg-surface p-4 text-sm text-secondary">Carregando tenants...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-divider-subtle bg-surface shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-input text-xs uppercase tracking-wider text-secondary">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Subdominio</th>
                <th className="px-4 py-3">Dominio</th>
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
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
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