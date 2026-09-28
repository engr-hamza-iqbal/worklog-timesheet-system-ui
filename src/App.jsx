import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
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
import LandingPage from './pages/LandingPage.jsx';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />

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
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
