import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import Table, { TableHead, TableBody, TableRow } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { exportToCsv } from '../utils/reportUtils.js';

export default function MetricTable({ title, rows = [], columns = [], filename, onExport, defaultPageSize = 10 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = defaultPageSize;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const valA = col.value ? col.value(a) : a[sortKey];
      const valB = col.value ? col.value(b) : b[sortKey];
      const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace(/[^0-9.-]/g, ''));
      const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc'
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }, [rows, columns, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil((sortedRows?.length || 0) / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  const handleCsvClick = () => {
    if (onExport) {
      onExport(sortedRows);
    } else {
      const defaultFilename = (filename || title || 'report').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      exportToCsv(defaultFilename, columns, sortedRows);
    }
  };

  return (
    <section className="flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0">
        <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{rows.length} rows</span>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={handleCsvClick}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              title="Export as CSV"
            >
              <Download size={12} />
              CSV
            </button>
          )}
        </div>
      </div>
      {sortedRows && sortedRows.length ? (
        <>
          <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
            <Table>
              <TableHead className="bg-slate-50/40">
                <tr>
                  {columns.map((column) => (
                    <ResizableTh
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="px-3.5 sm:px-5 py-2.5 sm:py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{column.label}</span>
                        {sortKey === column.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                          ) : (
                            <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-50 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                  ))}
                </tr>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, index) => (
                  <TableRow
                    key={row.projectId || row.clientId || row.userId || row.periodDate || row.status || index}
                  >
                    {columns.map((column, idx) => (
                      <td
                        key={column.key}
                        className={`px-3.5 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap text-xs ${
                          idx === 0 ? 'font-medium text-slate-800' : 'text-slate-600'
                        }`}
                      >
                        <div title={String(typeof column.value === 'function' ? column.value(row) : (row[column.key] ?? ''))}>
                          {typeof column.value === 'function' ? column.value(row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 border-t border-slate-200/90">
            <Pagination
              currentPage={safePage}
              totalItems={sortedRows.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              className="border-t-0"
            />
          </div>
        </>
      ) : (
        <p className="px-5 py-10 text-center text-xs sm:text-sm text-slate-500">No data found for this selection.</p>
      )}
    </section>
  );
}
