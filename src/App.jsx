import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import './App.css';

// Code-split pages via dynamic imports
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ClientsProjectsPage = lazy(() => import('./pages/ClientsProjectsPage.jsx'));
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'));
const AccessPage = lazy(() => import('./pages/access/AccessPage.jsx'));
const TimesheetsPage = lazy(() => import('./pages/TimesheetsPage.jsx'));
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'));
const TimeOffPage = lazy(() => import('./pages/TimeOffPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const EmailLogPage = lazy(() => import('./pages/EmailLogPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage.jsx'));
const NotAuthorisedPage = lazy(() => import('./pages/NotAuthorisedPage.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center gap-2.5 text-xs text-slate-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      <span>Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
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
                <ProtectedRoute capability="MANAGE_CLIENTS_PROJECTS">
                  <ClientsProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute anyCapabilities={['MANAGE_USERS', 'ASSIGN_PROJECTS']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/access"
              element={
                <ProtectedRoute adminOnly>
                  <AccessPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/timesheet"
              element={
                <ProtectedRoute>
                  <TimesheetsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/review"
              element={
                <ProtectedRoute capability="REVIEW_TIME">
                  <ReviewPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/time-off"
              element={
                <ProtectedRoute>
                  <TimeOffPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute capability="VIEW_REPORTS">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute capability="VIEW_ANALYTICS">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emails"
              element={
                <ProtectedRoute adminOnly>
                  <EmailLogPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute adminOnly>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/access-logs"
              element={<Navigate to="/audit-logs" replace />}
            />

            <Route
              path="/unauthorized"
              element={
                <ProtectedRoute>
                  <NotAuthorisedPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
