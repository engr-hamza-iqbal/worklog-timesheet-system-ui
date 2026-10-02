import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({
  children,
  adminOnly = false,
  capability = null,
  anyCapabilities = null,
  fallbackTo = '/dashboard',
}) {
  const { isAuthenticated, loading, isAdmin, capabilities } = useAuth();
  const location = useLocation();
  const lastAlertedRef = useRef(null);

  // Check authorization
  let isDenied = false;
  let reason = '';

  if (!loading && isAuthenticated && !isAdmin) {
    if (adminOnly) {
      isDenied = true;
      reason = 'This section requires administrator privileges.';
    } else if (capability && !capabilities[capability]) {
      isDenied = true;
      reason = `Access permission for "${capability}" has been revoked.`;
    } else if (anyCapabilities && Array.isArray(anyCapabilities)) {
      const hasAny = anyCapabilities.some((cap) => Boolean(capabilities[cap]));
      if (!hasAny) {
        isDenied = true;
        reason = 'Access permissions for this section have been revoked.';
      }
    }
  }

  // Notify and fall back smoothly without page reload
  useEffect(() => {
    if (isDenied && location.pathname !== fallbackTo) {
      if (lastAlertedRef.current !== location.pathname) {
        lastAlertedRef.current = location.pathname;
        window.dispatchEvent(
          new CustomEvent('app:notify', {
            detail: {
              type: 'warn',
              title: 'Access Revoked',
              message: `${reason} Redirected to Dashboard.`,
            },
          })
        );
      }
    }
  }, [isDenied, location.pathname, fallbackTo, reason]);

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

  // If permission revoked, automatically fallback to default tab (dashboard)
  if (isDenied) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children;
}

