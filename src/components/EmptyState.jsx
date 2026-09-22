import React from 'react';

/**
 * Empty state placeholder.
 * Props:
 *   icon    — React node (optional SVG/Lucide icon element)
 *   title   — string
 *   message — string (optional)
 *   action  — React node (optional button/link)
 */
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-3 text-slate-300">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {message && (
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
