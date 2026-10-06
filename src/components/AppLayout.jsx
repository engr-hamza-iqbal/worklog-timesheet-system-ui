import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import AppHeader from './AppHeader.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function AppLayout({ children }) {
  const { isAuthenticated, logout, refreshUser, isAdmin, capabilities } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Explicitly check for authentication pages (Login and Register) or Landing page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  // When navigating between pages, silently sync access capabilities in background so UI stays strictly updated
  useEffect(() => {
    if (isAuthenticated && !isLandingPage && !isAuthPage && refreshUser) {
      refreshUser().catch(() => {});
    }
  }, [location.pathname, isAuthenticated, isLandingPage, isAuthPage, refreshUser]);

  // If user is on an open page whose capability was revoked, automatically fall back to default tab (dashboard)
  useEffect(() => {
    if (!isAuthenticated || isLandingPage || isAuthPage || isAdmin) return;

    const path = location.pathname;
    let unauthorized = false;
    let featureName = '';

    if (path.startsWith('/clients') && !capabilities?.['MANAGE_CLIENTS_PROJECTS']) {
      unauthorized = true;
      featureName = 'Clients & Projects';
    } else if (path.startsWith('/users') && !capabilities?.['MANAGE_USERS'] && !capabilities?.['ASSIGN_PROJECTS']) {
      unauthorized = true;
      featureName = 'Users & Assignments';
    } else if (path.startsWith('/review') && !capabilities?.['REVIEW_TIME']) {
      unauthorized = true;
      featureName = 'Review Queue';
    } else if (path.startsWith('/reports') && !capabilities?.['VIEW_REPORTS']) {
      unauthorized = true;
      featureName = 'Reports';
    } else if (path.startsWith('/analytics') && !capabilities?.['VIEW_ANALYTICS']) {
      unauthorized = true;
      featureName = 'Analytics';
    } else if (path.startsWith('/access') || path.startsWith('/emails')) {
      unauthorized = true;
      featureName = 'Administration';
    }

    if (unauthorized) {
      window.dispatchEvent(
        new CustomEvent('app:notify', {
          detail: {
            type: 'warn',
            title: 'Capability Revoked',
            message: `Your access to ${featureName} was revoked. Returned to Dashboard.`,
          },
        })
      );
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, capabilities, isAdmin, isAuthenticated, isLandingPage, isAuthPage, navigate]);

  // Default navbar/sidebar is EXPANDED (true), persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('app_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Sync sidebar preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_sidebar_open', String(sidebarOpen));
    } catch {
      // Ignore storage errors
    }
  }, [sidebarOpen]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    setLogoutOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  // If on landing, login/register pages OR not authenticated, NEVER show sidebar. Render clean top header and content.
  if (isLandingPage || isAuthPage || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AppHeader
          sidebarOpen={false}
          onToggleSidebar={() => {}}
          onOpenMobile={() => {}}
          onRequestLogout={() => setLogoutOpen(true)}
        />
        <div className="flex-1 flex flex-col">{children}</div>

        <ConfirmDialog
          isOpen={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          onConfirm={handleLogout}
          title="Sign out"
          message="Are you sure you want to sign out of Work Log?"
          confirmLabel="Sign out"
          tone="danger"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* ── Collapsible Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onRequestLogout={() => setLogoutOpen(true)}
      />

      {/* ── Main App Content Wrapper ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-clip">
        <AppHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
          onRequestLogout={() => setLogoutOpen(true)}
        />
        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </div>

      {/* ── Sign Out Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out of Work Log?"
        confirmLabel="Sign out"
        tone="danger"
      />
    </div>
  );
}
