import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import AppHeader from './AppHeader.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function AppLayout({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Explicitly check for authentication pages (Login and Register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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

  // If on login/register pages OR not authenticated, NEVER show sidebar. Render clean top header and centered content.
  if (isAuthPage || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AppHeader
          sidebarOpen={false}
          onToggleSidebar={() => {}}
          onOpenMobile={() => {}}
          onRequestLogout={() => {}}
        />
        <div className="flex-1 flex flex-col justify-center">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* ── Collapsible Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
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
