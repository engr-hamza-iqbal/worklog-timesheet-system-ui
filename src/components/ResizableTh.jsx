import React from 'react';

/**
 * Clean, responsive table header cell (<th>).
 * Displays a column header with text alignment, sorting icons support,
 * and natural fluid width. Column resizing has been safely retired for a responsive layout.
 */
export default function ResizableTh({
  colKey,
  width,
  onResize,
  onResizeStart,
  resizable,
  className = '',
  style = {},
  children,
  onClick,
  align = 'left',
  title,
  ...props
}) {
  const isRight = align === 'right' || className.includes('text-right');
  const isCenter = align === 'center' || className.includes('text-center');

  return (
    <th
      onClick={onClick}
      className={`select-none whitespace-nowrap ${className}`}
      {...props}
    >
      <div
        className={`w-full flex items-center gap-1.5 ${
          isRight ? 'justify-end' : isCenter ? 'justify-center' : 'justify-start'
        }`}
        title={title}
      >
        {children}
      </div>
    </th>
  );
}
