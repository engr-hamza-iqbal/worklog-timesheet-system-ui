import React from 'react';
import AppHeader from './AppHeader.jsx';
import Sidebar from './Sidebar.jsx';
import AppLayout from './AppLayout.jsx';

// ─── Tooltip wrapper (re-exported for DashboardPage and other components) ───
export function Tooltip({ text, children, side = 'bottom' }) {
  const posClass =
    side === 'top'
      ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
      : side === 'left'
      ? 'right-full mr-1.5 top-1/2 -translate-y-1/2'
      : side === 'right'
      ? 'left-full ml-1.5 top-1/2 -translate-y-1/2'
      : 'top-full mt-1.5 left-1/2 -translate-x-1/2';

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`pointer-events-none absolute ${posClass} z-50 whitespace-nowrap px-2 py-1 rounded text-[11px] font-medium bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md`}
        role="tooltip"
      >
        {text}
      </div>
    </div>
  );
}

export { Sidebar, AppHeader, AppLayout };

export default function Navbar(props) {
  return <AppHeader {...props} />;
}
