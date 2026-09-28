import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';
import NotAuthorisedPage from '../pages/NotAuthorisedPage.jsx';

export default function ProtectedRoute({
  children,
  adminOnly = false,
  capability = null,
  anyCapabilities = null,
}) {
  const { isAuthenticated, loading, isAdmin, capabilities } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin access bypasses all capability restrictions
  if (isAdmin) {
    return children;
  }

  if (adminOnly) {
    return (
      <NotAuthorisedPage
        message="This screen is restricted to system administrators."
      />
    );
  }

  if (capability && !capabilities[capability]) {
    return (
      <NotAuthorisedPage
        requiredCapability={capability}
        message={`This screen requires the "${capability}" capability.`}
      />
    );
  }

  if (anyCapabilities && Array.isArray(anyCapabilities)) {
    const hasAny = anyCapabilities.some((cap) => Boolean(capabilities[cap]));
    if (!hasAny) {
      return (
        <NotAuthorisedPage
          message={`This screen requires one of the following capabilities: ${anyCapabilities.join(', ')}.`}
        />
      );
    }
  }

  return children;
}

