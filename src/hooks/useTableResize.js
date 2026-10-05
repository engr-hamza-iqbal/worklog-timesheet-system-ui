import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage dynamic column widths and interactive dragging for tables.
 * Emulates Excel/spreadsheet behavior: columns can be resized wider to see truncated content
 * or narrower, with strict width bounds and non-wrapping cell content.
 *
 * @param {Object} defaultWidths - Map of column keys to initial width in pixels
 * @param {number} minColWidth - Minimum allowed width in pixels
 */
export function useTableResize(defaultWidths = {}, minColWidth = 50) {
  const [colWidths, setColWidths] = useState(() => (typeof defaultWidths === 'function' ? defaultWidths() : (defaultWidths || {})));
  const resizeInfoRef = useRef(null);

  const startResize = useCallback((colKey, e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const thElement = e.target.closest('th');
    const startWidth = colWidths[colKey] || (thElement ? thElement.offsetWidth : 120);

    resizeInfoRef.current = {
      colKey,
      startX: clientX,
      startWidth,
    };

    const onPointerMove = (moveEvt) => {
      if (!resizeInfoRef.current) return;
      const currentX = moveEvt.clientX ?? (moveEvt.touches && moveEvt.touches[0] ? moveEvt.touches[0].clientX : 0);
      const deltaX = currentX - resizeInfoRef.current.startX;
      const newWidth = Math.max(minColWidth, Math.round(resizeInfoRef.current.startWidth + deltaX));

      setColWidths((prev) => ({
        ...prev,
        [resizeInfoRef.current.colKey]: newWidth,
      }));
    };

    const onPointerUp = () => {
      resizeInfoRef.current = null;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }, [colWidths, minColWidth]);

  return {
    columnWidths: colWidths || {},
    colWidths: colWidths || {},
    startResize,
    setColWidths,
  };
}

export default useTableResize;
