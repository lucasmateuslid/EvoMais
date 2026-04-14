import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Erro ao enviar email de recuperação');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação');
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

          {!success ? (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Recuperar Senha
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Digite seu email para receber um link de redefinição de senha.
              </p>

              <div className="mt-10">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-start gap-3">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <div className="bg-gray-100 p-1.5 rounded-full">
                          <Mail className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <input
                        type="email"
                        required
                        className="appearance-none block w-full pl-14 pr-4 py-4 border border-gray-200 rounded-full bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm hover:bg-gray-50"
                        placeholder="seu.email@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Link de Recuperação'
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email enviado com sucesso!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Verifique sua caixa de entrada. Você receberá um link para redefinir sua senha.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                O link expira em 24 horas.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-brand to-brand-dark items-center justify-center p-12">
        <div className="text-center text-white">
          <Mail className="h-24 w-24 mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold mb-4">Redefinir sua Senha</h3>
          <p className="text-lg opacity-90 max-w-md">
            Nós enviaremos um email com instruções para redefinir sua senha com segurança.
          </p>
        </div>
      </div>
    </div>
  );
}
