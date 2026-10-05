import React from 'react';

/**
 * Resizable table header cell (<th>).
 * Displays a column header with a right-edge drag handle, Excel-like truncation,
 * and column width constraints.
 */
export default function ResizableTh({
  colKey,
  width,
  onResize,
  onResizeStart,
  resizable = true,
  className = '',
  style = {},
  children,
  onClick,
  align = 'left',
  title,
  ...props
}) {
  const handleResize = onResizeStart || onResize;
  const inlineStyle = {
    ...style,
    ...(width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : {}),
  };

  return (
    <th
      style={inlineStyle}
      onClick={onClick}
      className={`relative select-none group/th overflow-hidden ${className}`}
      {...props}
    >
      <div
        className={`w-full overflow-hidden text-ellipsis whitespace-nowrap flex items-center ${
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        }`}
        title={title}
      >
        {children}
      </div>

      {resizable && handleResize && (
        <div
          onMouseDown={(e) => handleResize(colKey || e, e)}
          onTouchStart={(e) => handleResize(colKey || e, e)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize flex items-center justify-center hover:bg-indigo-400/40 active:bg-indigo-600 transition-colors z-20"
          title="Drag to resize column"
        >
          <div className="w-[1px] h-3.5 bg-slate-300 group-hover/th:bg-indigo-500" />
        </div>
      )}
    </th>
  );
}
