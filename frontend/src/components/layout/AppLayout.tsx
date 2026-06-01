import { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { 
  LayoutDashboard, Users, BarChart3, Inbox, BrainCircuit, 
  FileText, Settings, LogOut, MessageSquare, 
  Bell, Search, Moon, Sun, ChevronDown 
} from 'lucide-react';
import { AIAnalysisModal } from '../ai/AIAnalysisModal';

import { Logo, LogoIcon } from '../ui/Logo';

export function PrivateRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#f8f9fc] dark:bg-surface-deep dark:text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AppLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM', href: '/crm', icon: Inbox },
    { name: 'Vendedores', href: '/vendors', icon: Users },
    { name: 'Equipe', href: '/team', icon: MessageSquare },
    { name: 'Métricas', href: '/metrics', icon: BarChart3 },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const MOCK_NOTIFICATIONS = [
    { id: 1, title: 'Novo lead quente', message: 'João Silva demonstrou interesse no plano Pro.', time: 'Há 5 min', unread: true },
    { id: 2, title: 'Follow-up atrasado', message: 'Você tem 3 follow-ups pendentes para hoje.', time: 'Há 1 hora', unread: true },
    { id: 3, title: 'Meta atingida', message: 'Parabéns! A equipe bateu a meta semanal.', time: 'Ontem', unread: false },
  ];

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col transition-colors duration-200">
      {/* Topbar & Sub-bar Container */}
      <header className="bg-surface border-b border-divider-subtle sticky top-0 z-50 transition-colors duration-200">
        
        {/* Main Topbar */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side: Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Logo className="h-8 sm:h-10" />
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="hidden lg:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-1.5 bg-surface-input border border-divider-subtle rounded-full focus:ring-2 focus:ring-brand text-sm w-48 xl:w-64 text-primary placeholder:text-secondary transition-colors duration-200 focus:outline-none"
                />
              </div>
              
              {/* AI Analysis Button */}
              <button 
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-brand/10 text-brand dark:text-brand-light hover:bg-brand/20 transition-colors duration-200 flex-shrink-0 text-sm font-bold"
                title="Análise IA"
              >
                <BrainCircuit className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Análise IA</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-secondary hover:bg-surface-input hover:text-primary transition-colors duration-200 flex-shrink-0"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-full text-secondary hover:bg-surface-input hover:text-primary transition-colors duration-200 flex-shrink-0 focus:outline-none"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-surface"></span>
                </button>

                {isNotificationsOpen && (
                  <div className="absolute -right-16 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-surface rounded-2xl shadow-lg border border-divider-subtle py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-divider-subtle flex justify-between items-center">
                      <h3 className="text-sm font-bold text-primary">Notificações</h3>
                      <button className="text-xs text-brand hover:text-brand-hover font-medium">Marcar todas como lidas</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                      {MOCK_NOTIFICATIONS.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 border-b border-divider-subtle last:border-0 hover:bg-surface-input transition-colors cursor-pointer ${notif.unread ? 'bg-brand/5 dark:bg-brand/10' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm ${notif.unread ? 'font-bold text-primary' : 'font-medium text-secondary'}`}>{notif.title}</p>
                            <span className="text-[11px] font-medium text-secondary whitespace-nowrap ml-2">{notif.time}</span>
                          </div>
                          <p className="text-xs text-secondary line-clamp-2">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-divider-subtle text-center">
                      <button className="text-xs font-bold text-brand hover:text-brand-hover transition-colors">
                        Ver todas as notificações
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative ml-1 sm:ml-2" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full border border-divider-subtle hover:bg-surface-input transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-brand-dark dark:text-brand-light font-bold text-sm">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-secondary transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-lg border border-divider-subtle py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-divider-subtle mb-1">
                      <p className="text-sm font-medium text-primary truncate">
                        {profile?.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-secondary truncate">
                        {profile?.role || 'Admin'}
                      </p>
                    </div>
                    
                    <Link 
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-primary hover:bg-surface-input transition-colors"
                    >
                      <Settings className="mr-3 h-4 w-4 text-secondary" />
                      Configurações
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-bar / Quick Buttons Navbar (Desktop only) */}
        <div className="hidden sm:block border-t border-divider-subtle bg-surface-input">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 py-3">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
                      isActive
                        ? 'bg-surface text-brand dark:text-brand-light border-divider-subtle shadow-sm'
                        : 'bg-transparent text-secondary border-transparent hover:bg-surface hover:text-primary'
                    }`}
                  >
                    <item.icon className={`mr-2 h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand dark:text-brand-light' : 'text-secondary'}`} />
                    {item.name}
                  </Link>
                );
              })}
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

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-divider-subtle z-50 pb-safe">
        <nav className="flex justify-around items-center h-16 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive 
                    ? 'text-brand dark:text-brand-light' 
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'fill-brand/10' : ''}`} />
                <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global Modals */}
      <AIAnalysisModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </div>
  );
}
