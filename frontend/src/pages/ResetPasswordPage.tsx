import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);

    const accessTokenFromHash = hashParams.get('access_token');
    const refreshTokenFromHash = hashParams.get('refresh_token');
    const codeFromHash = hashParams.get('code');
    const tokenHashFromHash = hashParams.get('token_hash');
    const typeFromHash = hashParams.get('type');

    const accessTokenFromQuery = null;
    const refreshTokenFromQuery = null;
    const codeFromQuery = searchParams.get('code');
    const tokenHashFromQuery = searchParams.get('token_hash');
    const typeFromQuery = searchParams.get('type');

    const supabaseError = searchParams.get('error_description') || hashParams.get('error_description');

    const resolvedAccessToken = accessTokenFromHash || accessTokenFromQuery;
    const resolvedRefreshToken = refreshTokenFromHash || refreshTokenFromQuery;
    const resolvedCode = codeFromHash || codeFromQuery;
    const resolvedTokenHash = tokenHashFromHash || tokenHashFromQuery;
    const resolvedType = typeFromHash || typeFromQuery;

    if (supabaseError) {
      setError(decodeURIComponent(supabaseError));
      return;
    }

    if (!resolvedAccessToken && !resolvedCode && !resolvedTokenHash) {
      setError('Token inválido. Link expirado ou corrompido.');
      return;
    }

    if (searchParams.get('access_token') || searchParams.get('refresh_token') || searchParams.get('token')) {
      setError('Link de redefinição inválido. Refaça a recuperação de senha.');
      return;
    }

    setAccessToken(resolvedAccessToken);
    setRefreshToken(resolvedRefreshToken);
    setCode(resolvedCode);
    setTokenHash(resolvedTokenHash);
    setOtpType(resolvedType);
  }, [searchParams]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      navigate('/login');
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: accessToken,
          accessToken,
          refreshToken,
          code,
          tokenHash,
          otpType,
          password,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Erro ao redefinir senha');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir senha');
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
                Nova Senha
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Digite uma nova senha para sua conta.
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <div className="bg-gray-100 p-1.5 rounded-full">
                          <Lock className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="appearance-none block w-full pl-14 pr-12 py-4 border border-gray-200 rounded-full bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm hover:bg-gray-50"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <div className="bg-gray-100 p-1.5 rounded-full">
                          <Lock className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="appearance-none block w-full pl-14 pr-12 py-4 border border-gray-200 rounded-full bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent sm:text-sm transition-all shadow-sm hover:bg-gray-50"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || ((!accessToken || !refreshToken) && !code && !tokenHash)}
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar Senha'
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Senha redefinida com sucesso!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Você pode fazer login com sua nova senha.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Redirecionando para o login...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all"
              >
                Ir para Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-brand to-brand-dark items-center justify-center p-12">
        <div className="text-center text-white">
          <Lock className="h-24 w-24 mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold mb-4">Sua Segurança</h3>
          <p className="text-lg opacity-90 max-w-md">
            Use uma senha forte e única para manter sua conta segura.
          </p>
        </div>
      </div>
    </div>
  );
}
