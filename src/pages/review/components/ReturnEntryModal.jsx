import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';

export default function ReturnEntryModal({
  returningId,
  setReturningId,
  comment,
  setComment,
  returnEntry,
  isProcessing,
}) {
  return (
    <Modal
      isOpen={Boolean(returningId)}
      onClose={() => {
        if (!isProcessing) {
          setReturningId(null);
          setComment("");
        }
      }}
      title="Return Time Entry to Employee"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Explain what needs correcting on this timesheet entry. A descriptive comment of at least 5 characters is required.
        </p>
        <textarea
          autoFocus
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3 text-xs sm:text-sm focus:border-slate-900 focus:outline-none transition shadow-2xs resize-none"
          placeholder="Correction required: e.g. Please verify duration hours or add more details on task deliverables..."
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            onClick={() => {
              setReturningId(null);
              setComment("");
            }}
            disabled={Boolean(isProcessing)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={comment.trim().length < 5 || Boolean(isProcessing)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-700 hover:bg-rose-800 text-white disabled:opacity-40 inline-flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
            onClick={returnEntry}
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Send size={13} />}
            <span>{isProcessing ? "Returning..." : "Return Entry"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
