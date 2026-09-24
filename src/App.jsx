import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ClientsProjectsPage from './pages/ClientsProjectsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AccessPage from './pages/AccessPage.jsx';
import TimesheetsPage from './pages/TimesheetsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import TimeOffPage from './pages/TimeOffPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import EmailLogPage from './pages/EmailLogPage.jsx';
import './App.css';

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/access"
              element={
                <ProtectedRoute>
                  <AccessPage />
                </ProtectedRoute>
              }
            />

            <Route path="/timesheet" element={<ProtectedRoute><TimesheetsPage /></ProtectedRoute>} />
            <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
            <Route path="/time-off" element={<ProtectedRoute><TimeOffPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/emails" element={<ProtectedRoute><EmailLogPage /></ProtectedRoute>} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
