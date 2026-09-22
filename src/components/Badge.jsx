import React from 'react';

const VARIANTS = {
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  inactive:  { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400' },
  closed:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  pending:   { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  granted:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  revoked:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  admin:     { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
  employee:  { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};

/**
 * Status badge.
 * Props:
 *   variant — keyof VARIANTS
 *   label   — string (defaults to capitalised variant name)
 *   dot     — boolean, show leading dot (default false)
 */
export default function Badge({ variant = 'active', label, dot = false }) {
  const v = VARIANTS[variant] || VARIANTS.inactive;
  const text = label ?? (variant.charAt(0).toUpperCase() + variant.slice(1));

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${v.bg} ${v.text} ${v.border}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />}
      {text}
    </span>
  );
}
