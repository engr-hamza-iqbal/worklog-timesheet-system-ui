import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems <= itemsPerPage && totalPages <= 1) {
    return (
      <div className={`px-4 py-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500 ${className}`}>
        <span>Showing all {totalItems} {totalItems === 1 ? 'entry' : 'entries'}</span>
      </div>
    );
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`px-4 py-3 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}>
      {/* Counter text */}
      <div className="text-slate-500 font-medium text-center sm:text-left">
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> entries
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-mono">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <span className="sm:hidden text-xs text-slate-600 px-2 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
