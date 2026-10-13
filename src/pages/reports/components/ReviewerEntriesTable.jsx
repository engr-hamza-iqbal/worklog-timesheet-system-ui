import React, { useState, useEffect, useMemo } from 'react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Pagination from '../../../components/Pagination.jsx';

export default function ReviewerEntriesTable({ entries = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [entries]);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, safePage, pageSize]);

  if (!entries.length) {
    return <p className="text-xs text-slate-500 py-3 text-center">No pending entries for this reviewer.</p>;
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs flex flex-col">
      <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Employee</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Project</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Work Date</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Hours</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Description</span></ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {paginated.map((entry) => (
              <TableRow key={entry.id}>
                <TableTd className="px-3 sm:px-4 py-2 text-xs font-medium text-slate-800 whitespace-nowrap">{entry.userName}</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-600 whitespace-nowrap">
                  {entry.projectName} <span className="text-slate-400">· {entry.clientName}</span>
                </TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-600 whitespace-nowrap">{entry.workDate}</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-900 whitespace-nowrap">{entry.hours} h</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-500 max-w-[200px] sm:max-w-sm truncate" title={entry.description}>
                  {entry.description}
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {entries.length > pageSize && (
        <div className="shrink-0 border-t border-slate-200/90">
          <Pagination
            currentPage={safePage}
            totalItems={entries.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            className="border-t-0"
          />
        </div>
      )}
    </div>
  );
}
