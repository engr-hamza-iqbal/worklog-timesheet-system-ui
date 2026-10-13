import React from 'react';
import { RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import ReviewerEntriesTable from './ReviewerEntriesTable.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { exportToCsv } from '../utils/reportUtils.js';

export default function ReviewQueueTab({
  reviewQueueData,
  loadingReviewQueue,
  expandedReviewerId,
  setExpandedReviewerId,
  reviewerPage,
  setReviewerPage,
  reviewerPageSize,
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Entries Waiting for Review by Reviewer
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Submitted work entries grouped by managers and administrators authorized to review them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 sm:px-3 py-1.5 rounded-md">
            Total Pending Work: {reviewQueueData?.totalPendingEntries ?? 0} entries
          </span>
          {reviewQueueData?.reviewers?.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const rows = reviewQueueData.reviewers.flatMap((r) =>
                  r.entries.map((e) => ({
                    reviewerName: r.reviewerName,
                    reviewerEmail: r.reviewerEmail,
                    reviewerRole: r.role,
                    scopeType: r.scopeType,
                    userName: e.userName,
                    projectName: e.projectName,
                    clientName: e.clientName,
                    workDate: e.workDate,
                    hours: e.hours,
                    description: e.description,
                  }))
                );
                exportToCsv('unreviewed_entries_by_reviewer', [
                  { key: 'reviewerName', label: 'Reviewer' },
                  { key: 'reviewerRole', label: 'Role' },
                  { key: 'scopeType', label: 'Scope' },
                  { key: 'userName', label: 'Employee' },
                  { key: 'projectName', label: 'Project' },
                  { key: 'clientName', label: 'Client' },
                  { key: 'workDate', label: 'Date' },
                  { key: 'hours', label: 'Hours' },
                  { key: 'description', label: 'Description' },
                ], rows);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download size={13} />
              Export All CSV
            </button>
          )}
        </div>
      </div>

      {loadingReviewQueue ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-8">
          <RefreshCw className="animate-spin" size={20} />
          Evaluating reviewer capabilities and scopes...
        </div>
      ) : reviewQueueData?.reviewers?.length ? (
        <div className="space-y-4">
          {reviewQueueData.reviewers
            .slice((reviewerPage - 1) * reviewerPageSize, reviewerPage * reviewerPageSize)
            .map((rev) => {
              const isExpanded = expandedReviewerId === rev.reviewerId;
              return (
                <div
                  key={rev.reviewerId}
                  className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedReviewerId(isExpanded ? null : rev.reviewerId)}
                    className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                        {rev.reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{rev.reviewerName}</h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              rev.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rev.role}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            {rev.scopeType}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 truncate">{rev.reviewerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-left sm:right text-right">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">{rev.waitingEntryCount} entries</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">{rev.waitingHours} hours waiting</p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-2.5 sm:p-5 bg-slate-50/40">
                      <ReviewerEntriesTable entries={rev.entries} />
                    </div>
                  )}
                </div>
              );
            })}

          <Pagination
            currentPage={reviewerPage}
            totalItems={reviewQueueData.reviewers.length}
            itemsPerPage={reviewerPageSize}
            onPageChange={setReviewerPage}
            className="rounded-xl border border-slate-200"
          />
        </div>
      ) : (
        <div className="p-12 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-lg">
          <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
          Review queue is clear! No entries currently waiting for review.
        </div>
      )}
    </section>
  );
}
