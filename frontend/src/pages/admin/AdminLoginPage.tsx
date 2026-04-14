import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-react';
import { Logo, LogoIcon } from '../../components/ui/Logo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Acesso super admin negado');
      }

      const data = await response.json() as { accessToken: string; user: any; profile: any };
      
      // Store token in memory (or sessionStorage for persistence across page reload)
      sessionStorage.setItem('authToken', data.accessToken);
      sessionStorage.setItem('userProfile', JSON.stringify(data.profile));
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 lg:px-20 xl:px-24 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-10 rounded-r-3xl">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center mb-12">
            <Logo className="h-10" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold tracking-wide uppercase mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Acesso Restrito
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Painel Super Admin
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Gerenciamento global de tenants e assinaturas.
          </p>

          <div className="mt-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none block w-full pl-14 pr-4 py-4 border border-gray-200 rounded-full bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm hover:bg-gray-50"
                      placeholder="E-mail de Administrador"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="appearance-none block w-full pl-14 pr-4 py-4 border border-gray-200 rounded-full bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm hover:bg-gray-50"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-full shadow-md shadow-emerald-600/20 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Acessar Painel
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between px-2 text-sm">
                <a href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">
                  Dica: admin@evoplus.com / admin123
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Image/Decoration */}
      <div className="hidden lg:block relative w-0 flex-1 bg-[#f8f9fc]">
        <div className="absolute inset-0 h-full w-full flex items-center justify-center p-12">
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center justify-center mb-8">
              <LogoIcon className="h-24 w-24" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              Controle Total da Plataforma
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              Gerencie todas as empresas, acompanhe métricas globais e administre assinaturas em um único lugar.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6 text-left max-w-lg mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="text-emerald-600 font-semibold mb-2">Gestão de Tenants</div>
                <div className="text-gray-500 text-sm">Controle de acesso, limites e configurações por empresa.</div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="text-emerald-600 font-semibold mb-2">Métricas Globais</div>
                <div className="text-gray-500 text-sm">Acompanhe MRR, usuários ativos e crescimento da plataforma.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
