import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { disconnectRealtimeSocket, getRealtimeSocket } from './services/realtimeService';

import { AppLayout, PrivateRoute } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import CRMPage from './pages/CRMPage';
import MetricsPage from './pages/MetricsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TeamPage from './pages/TeamPage';
import ChatPage from './pages/ChatPage';

const queryClient = new QueryClient();
const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL?.replace(/\/$/, '') || '';

function AdminRedirect() {
  const location = useLocation();

  useEffect(() => {
    if (!adminAppUrl) {
      return;
    }

    const adminPath = location.pathname.replace(/^\/admin/, '') || '/';
    const target = `${adminAppUrl}${adminPath}${location.search}${location.hash}`;
    window.location.replace(target);
  }, [location]);

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { initialize, accessToken } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (accessToken) {
      getRealtimeSocket();
      return;
    }

    disconnectRealtimeSocket();
  }, [accessToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/*" element={<AdminRedirect />} />

          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/chat/:vendorId/:conversationId" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
