import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

import { Logo, LogoIcon } from '../components/ui/Logo';
import { getAdminBackendUrl } from '../services/httpClient';
import { setAdminSession } from '../lib/session';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getAdminBackendUrl()}/api/auth/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Acesso super admin negado');
      }

      const data = await response.json() as {
        accessToken: string;
        refreshToken?: string;
        user: unknown;
        profile: { role?: string } | null;
      };

      setAdminSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        profile: data.profile,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-divider-subtle bg-surface shadow-[0_30px_120px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <Logo />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acesso restrito
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-primary">Painel Super Admin</h1>
            <p className="mt-2 text-sm text-secondary">Gerenciamento global de tenants, usuarios e operacao.</p>

            <form className="mt-10 space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-divider-subtle bg-surface-input py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-emerald-500/40 focus:bg-white"
                    placeholder="admin@evomais.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">Senha</span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-divider-subtle bg-surface-input py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-emerald-500/40 focus:bg-white"
                    placeholder="Senha"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Autenticando...' : 'Acessar painel'}
              </button>
            </form>
          </div>
        </div>

        <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),transparent_35%),linear-gradient(135deg,#081018_0%,#0f1720_100%)] p-10 text-white lg:flex lg:items-center lg:justify-center">
          <div className="max-w-xl text-center">
            <div className="mb-8 flex justify-center">
              <LogoIcon className="h-24 w-24" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Controle total da plataforma</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-slate-300">
              Monitore tenants, usuarios e a operacao global em uma instancia dedicada, sem misturar com a experiencia principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}