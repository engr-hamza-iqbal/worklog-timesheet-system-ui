import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`px-4 py-3 bg-white border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Counter summary */}
      <div className="text-slate-600 font-medium text-center sm:text-left">
        {totalItems === 0 ? (
          <span>No records found</span>
        ) : (
          <span>
            Showing <strong className="font-semibold text-slate-900">{startItem}</strong>–
            <strong className="font-semibold text-slate-900">{endItem}</strong> of{' '}
            <strong className="font-semibold text-slate-900">{totalItems}</strong> entries
          </span>
        )}
      </div>

      {/* Interactive Navigation controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page (if many pages) */}
        {totalPages > 3 && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-medium"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
          <span className="hidden md:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-mono select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[30px] h-7 px-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  safeCurrentPage === page
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={safeCurrentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-medium"
          title="Next Page"
          aria-label="Next Page"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight size={14} />
        </button>

        {/* Last Page (if many pages) */}
        {totalPages > 3 && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
