import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
}) {
  const confirmClass = tone === 'danger'
    ? 'bg-red-700 hover:bg-red-800'
    : 'bg-slate-900 hover:bg-slate-800';

  const loadingText = typeof loading === 'string' ? loading : 'Processing...';

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-amber-50 p-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm leading-6 text-slate-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(loading)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={Boolean(loading)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white ${confirmClass} disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed`}
        >
          {loading && <Loader2 className="animate-spin shrink-0" size={14} />}
          {loading ? loadingText : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
