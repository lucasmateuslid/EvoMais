import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout, PrivateRoute } from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminTenantsPage from './pages/AdminTenantsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/tenants" element={<AdminTenantsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}