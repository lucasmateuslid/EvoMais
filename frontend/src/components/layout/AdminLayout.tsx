import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Logo } from '../ui/Logo';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // In a real app, clear admin session here
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col transition-colors duration-200">
      {/* Admin Topbar */}
      <header className="bg-surface border-b border-gray-200 dark:border-gray-800/50 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side: Logo & Admin Badge */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 flex items-center">
                <Logo className="h-8 sm:h-10" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-xs font-bold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair do Painel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-bar / Quick Buttons Navbar */}
        <div className="border-t border-gray-100 dark:border-gray-800/50 bg-surface-input dark:bg-surface-input">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 py-3">
              <Link
                to="/admin/dashboard"
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
                  location.pathname.includes('/admin/dashboard')
                    ? 'bg-white dark:bg-surface-input text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-gray-700 shadow-sm'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-surface hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className={`mr-2 h-4 w-4 flex-shrink-0 ${location.pathname.includes('/admin/dashboard') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                Dashboard
              </Link>
              <Link
                to="/admin/tenants"
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
                  location.pathname.includes('/admin/tenants')
                    ? 'bg-white dark:bg-surface-input text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-gray-700 shadow-sm'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-surface hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Building2 className={`mr-2 h-4 w-4 flex-shrink-0 ${location.pathname.includes('/admin/tenants') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                Gerenciar Tenants
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
