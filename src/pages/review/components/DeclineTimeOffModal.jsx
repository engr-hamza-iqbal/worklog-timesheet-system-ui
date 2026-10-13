import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';

export default function DeclineTimeOffModal({
  declineTarget,
  setDeclineTarget,
  declineReason,
  setDeclineReason,
  confirmDeclineTimeOff,
  isProcessing,
}) {
  if (!declineTarget) return null;

  return (
    <Modal
      isOpen={Boolean(declineTarget)}
      onClose={() => {
        if (!isProcessing) {
          setDeclineTarget(null);
          setDeclineReason("");
        }
      }}
      title={`Decline Time Off — ${declineTarget.user?.name || "Employee"}`}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          When declining a time off request, an explanatory reason is mandatory.
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Request:</span> {declineTarget.type?.name || 'Leave'} ({declineTarget.startDate} to {declineTarget.endDate})
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for declining (mandatory)
          </label>
          <textarea
            autoFocus
            required
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Explain why this request cannot be approved..."
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-none transition shadow-2xs resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setDeclineTarget(null);
              setDeclineReason("");
            }}
            disabled={Boolean(isProcessing)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeclineTimeOff}
            disabled={declineReason.trim().length < 3 || Boolean(isProcessing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isProcessing ? "Declining..." : "Decline Request"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
