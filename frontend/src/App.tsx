import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { disconnectRealtimeSocket, getRealtimeSocket } from './services/realtimeService';

import { AppLayout, PrivateRoute } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import CRMPage from './pages/CRMPage';
import MetricsPage from './pages/MetricsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTenantsPage from './pages/admin/AdminTenantsPage';

const queryClient = new QueryClient();

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
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="tenants" element={<AdminTenantsPage />} />
          </Route>

          {/* Private App Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/chat/:vendorId/:conversationId" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
