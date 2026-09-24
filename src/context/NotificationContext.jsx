import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

let nextId = 1;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(({
    type = 'info',
    title,
    message,
    duration = 4500,
  }) => {
    const id = nextId++;
    const newNotification = {
      id,
      type: type === 'warning' ? 'warn' : type,
      title,
      message,
      duration,
      createdAt: Date.now(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    return id;
  }, []);

  // Listen for global custom events so non-React files or interceptors can also emit notifications
  useEffect(() => {
    function handleCustomEvent(e) {
      if (e.detail) {
        addNotification(e.detail);
      }
    }
    window.addEventListener('app:notify', handleCustomEvent);
    return () => window.removeEventListener('app:notify', handleCustomEvent);
  }, [addNotification]);

  const notify = useCallback(
    (opts) => {
      if (typeof opts === 'string') {
        return addNotification({ message: opts, type: 'info' });
      }
      return addNotification(opts);
    },
    [addNotification]
  );

  notify.info = useCallback((message, title, duration) => {
    return addNotification({ type: 'info', message, title, duration });
  }, [addNotification]);

  notify.success = useCallback((message, title, duration) => {
    return addNotification({ type: 'success', message, title, duration });
  }, [addNotification]);

  notify.warn = useCallback((message, title, duration) => {
    return addNotification({ type: 'warn', message, title, duration });
  }, [addNotification]);

  notify.warning = notify.warn;

  notify.error = useCallback((message, title, duration) => {
    return addNotification({ type: 'error', message, title, duration });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notify, addNotification, removeNotification, notifications }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
}

// Global helper that can be called anywhere (even outside React tree)
export function showNotification({ type = 'info', message, title, duration = 4500 }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:notify', {
        detail: { type, message, title, duration },
      })
    );
  }
}

function NotificationItem({ notification, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const { id, type, title, message, duration } = notification;

  useEffect(() => {
    if (!duration || duration <= 0) return;

    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(interval);
            onDismiss(id);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [id, duration, isPaused, onDismiss]);

  const styleConfig = {
    success: {
      bg: 'bg-white border-emerald-200',
      iconColor: 'text-emerald-600',
      progressBar: 'bg-emerald-500',
      titleColor: 'text-emerald-950',
      textColor: 'text-emerald-900',
      icon: CheckCircle2,
      defaultTitle: 'Success',
    },
    error: {
      bg: 'bg-white border-rose-200',
      iconColor: 'text-rose-600',
      progressBar: 'bg-rose-500',
      titleColor: 'text-rose-950',
      textColor: 'text-rose-900',
      icon: XCircle,
      defaultTitle: 'Error',
    },
    warn: {
      bg: 'bg-white border-amber-200',
      iconColor: 'text-amber-600',
      progressBar: 'bg-amber-500',
      titleColor: 'text-amber-950',
      textColor: 'text-amber-900',
      icon: AlertTriangle,
      defaultTitle: 'Warning',
    },
    info: {
      bg: 'bg-white border-blue-200',
      iconColor: 'text-blue-600',
      progressBar: 'bg-blue-500',
      titleColor: 'text-blue-950',
      textColor: 'text-blue-900',
      icon: Info,
      defaultTitle: 'Notice',
    },
  }[type] || {
    bg: 'bg-white border-slate-200',
    iconColor: 'text-slate-600',
    progressBar: 'bg-slate-500',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-800',
    icon: Info,
    defaultTitle: 'Notice',
  };

  const IconComponent = styleConfig.icon;

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${styleConfig.bg} backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <div className={`mt-0.5 shrink-0 ${styleConfig.iconColor}`}>
          <IconComponent size={20} className="stroke-[2.2]" />
        </div>

        <div className="min-w-0 flex-1 pr-1">
          {title && (
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${styleConfig.titleColor}`}>
              {title}
            </h4>
          )}
          <div className={`text-sm leading-relaxed break-words font-medium ${styleConfig.textColor}`}>
            {message}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Close notification"
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {duration > 0 && (
        <div className="h-1 w-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${styleConfig.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function NotificationContainer({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none transition-all"
    >
      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          notification={item}
          onDismiss={onDismiss}
        />
      ))}
    </aside>
  );
}
