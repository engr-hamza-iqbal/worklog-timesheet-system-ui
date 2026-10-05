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

/**
 * Convert a YYYY-MM-DD input string to an ISO timestamp representing
 * the end of that day in the user's local timezone (23:59:59.999).
 * Prevents UTC timezone shift from adding a day on display.
 */
export function toLocalEndOfDayIso(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return new Date(dateStr).toISOString();
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  return localDate.toISOString();
}

/**
 * Format a Date or ISO timestamp into YYYY-MM-DD using local timezone
 * for <input type="date" /> values, preventing UTC shifts.
 */
export function toLocalDateString(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
