import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MessageSquare, ArrowRight, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Logo, LogoIcon } from '../components/ui/Logo';

export default function LoginPage() {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
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
          
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Faça login para acessar o painel da sua organização.
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
                      placeholder="Email ID"
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
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-gray-500 hover:text-gray-700 transition-colors italic">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-full shadow-md shadow-brand/20 text-sm font-medium text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                    </>
                  )}
                </button>
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
              Revolucione o atendimento
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              Gerencie múltiplos vendedores, analise conversas com IA em tempo real e aumente suas taxas de conversão.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6 text-left max-w-lg mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="text-brand font-semibold mb-2">Análise de IA</div>
                <div className="text-gray-500 text-sm">Insights automáticos sobre o desempenho de cada atendimento.</div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="text-brand font-semibold mb-2">Métricas em Tempo Real</div>
                <div className="text-gray-500 text-sm">Acompanhe tempo de resposta, ociosidade e conversões.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
