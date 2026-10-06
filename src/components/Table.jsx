import React from 'react';

/**
 * Reusable, responsive Table component system.
 * 
 * Centralizes table styling, borders, header styling, row hovering, and spacing
 * while remaining fully composable and compatible with existing event handlers,
 * pagination, sorting, and conditional renders.
 * 
 * Usage:
 * <Table.Container>
 *   <Table>
 *     <Table.Head>
 *       <Table.Row hover={false}>
 *         <Table.Th>Name</Table.Th>
 *       </Table.Row>
 *     </Table.Head>
 *     <Table.Body>
 *       <Table.Row>
 *         <Table.Td>Value</Table.Td>
 *       </Table.Row>
 *     </Table.Body>
 *   </Table>
 * </Table.Container>
 * 
 * Also supports named imports:
 * import { Table, TableContainer, TableHead, TableBody, TableRow, TableTh, TableTd } from '../components/Table.jsx';
 */

export function TableContainer({ children, className = '', ...props }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ children, className = '', dense = false, ...props }) {
  return (
    <table
      className={`w-full text-left border-collapse ${dense ? 'text-[11px]' : 'text-xs'} ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <thead
      className={`bg-slate-50/80 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, selected = false, ...props }) {
  return (
    <tr
      className={`transition-colors ${
        selected ? 'bg-indigo-50/60' : hover ? 'hover:bg-slate-50/70' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableTh({
  children,
  className = '',
  align = 'left',
  onClick,
  ...props
}) {
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left';

  return (
    <th
      onClick={onClick}
      className={`py-3 px-4 ${alignClass} font-semibold ${
        onClick ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableTd({
  children,
  className = '',
  align = 'left',
  colSpan,
  ...props
}) {
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left';

  return (
    <td
      colSpan={colSpan}
      className={`py-3 px-4 ${alignClass} text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

Table.Container = TableContainer;
Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Th = TableTh;
Table.Td = TableTd;

export default Table;
