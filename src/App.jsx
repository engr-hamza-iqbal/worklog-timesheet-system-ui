import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './App.css';

// Robust lazy loader that auto-reloads if an old chunk is requested after a new production deployment
function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkError =
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Expected a JavaScript-or-Wasm module script') ||
        error?.message?.includes('Failed to fetch') ||
        error?.name === 'ChunkLoadError';

      const lastReload = parseInt(sessionStorage.getItem('worklog_chunk_reload') || '0', 10);
      const canReload = Date.now() - lastReload > 15000;

      if (isChunkError && canReload) {
        sessionStorage.setItem('worklog_chunk_reload', Date.now().toString());
        window.location.reload();
        return new Promise(() => {}); // Keep loader active until window finishes reloading
      }
      throw error;
    }
  });
}

// Code-split pages via resilient dynamic imports
const LandingPage = lazyRetry(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazyRetry(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazyRetry(() => import('./pages/RegisterPage.jsx'));
const DashboardPage = lazyRetry(() => import('./pages/dashboard/DashboardPage.jsx'));
const ClientsProjectsPage = lazyRetry(() => import('./pages/clients-projects/ClientsProjectsPage.jsx'));
const UsersPage = lazyRetry(() => import('./pages/users/UsersPage.jsx'));
const AccessPage = lazyRetry(() => import('./pages/access/AccessPage.jsx'));
const TimesheetsPage = lazyRetry(() => import('./pages/timesheets/TimesheetsPage.jsx'));
const ReviewPage = lazyRetry(() => import('./pages/review/ReviewPage.jsx'));
const TimeOffPage = lazyRetry(() => import('./pages/TimeOffPage.jsx'));
const ReportsPage = lazyRetry(() => import('./pages/reports/ReportsPage.jsx'));
const AnalyticsPage = lazyRetry(() => import('./pages/analytics/AnalyticsPage.jsx'));
const EmailLogPage = lazyRetry(() => import('./pages/EmailLogPage.jsx'));
const AuditLogsPage = lazyRetry(() => import('./pages/AuditLogsPage.jsx'));
const NotAuthorisedPage = lazyRetry(() => import('./pages/NotAuthorisedPage.jsx'));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage.jsx'));


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
            <ErrorBoundary level="page">
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
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
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
                    path="/clients-projects"
                    element={<Navigate to="/clients" replace />}
                  />
                  <Route
                    path="/projects"
                    element={<Navigate to="/clients" replace />}
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
            </ErrorBoundary>
          </AppLayout>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
