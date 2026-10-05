import React from 'react';
import { AlertCircle } from 'lucide-react';

export function broadcastAuthSync() {
  try {
    const channel = new BroadcastChannel('worklog_auth_sync');
    channel.postMessage({ type: 'REFRESH_CAPABILITIES' });
    channel.close();
  } catch {
    // BroadcastChannel unsupported
  }
  // Also signal local window context so current tab syncs immediately
  try {
    window.dispatchEvent(new Event('auth:permission-denied'));
  } catch {
    // ignore
  }
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">✕</button>}
    </div>
  );
}
