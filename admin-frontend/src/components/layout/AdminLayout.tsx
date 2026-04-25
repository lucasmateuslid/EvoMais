import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';

import { clearAdminSession, getAdminSession } from '../../lib/session';
import { Logo } from '../ui/Logo';

export function PrivateRoute() {
  const session = getAdminSession();

  if (!session?.accessToken || session.profile?.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAdminSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!session?.accessToken || session.profile?.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    clearAdminSession();
    navigate('/login', { replace: true });
    setIsLoggingOut(false);
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-surface-deep text-primary transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-divider-subtle bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 md:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Painel global
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-full border border-divider-subtle bg-surface px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        <nav className="border-t border-divider-subtle bg-surface-input">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-3">
              {navigation.map(item => {
                const isActive = location.pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'border-emerald-500/20 bg-white text-emerald-600 shadow-sm'
                        : 'border-transparent bg-transparent text-secondary hover:bg-surface hover:text-primary'
                    }`}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-secondary'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}