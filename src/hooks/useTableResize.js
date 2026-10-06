import { useCallback } from 'react';

/**
 * Safe, backward-compatible hook for table column headers.
 * Column resizing has been safely retired in favor of fluid, responsive CSS layouts.
 */
export function useTableResize(defaultWidths = {}, minColWidth = 50) {
  const startResize = useCallback(() => {}, []);

  return {
    columnWidths: {},
    colWidths: {},
    startResize,
    setColWidths: () => {},
    totalWidth: 0,
    tableStyle: {},
  };
}

export default useTableResize;
