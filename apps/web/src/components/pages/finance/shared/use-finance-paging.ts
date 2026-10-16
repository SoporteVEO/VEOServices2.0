import { useState } from "react";
import type { DataTableManualPagination } from "@/components/ui/data-table/data-table";

const DEFAULT_PAGE_SIZE = 25;

export function useFinancePaging(defaultPageSize = DEFAULT_PAGE_SIZE) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  return {
    page: pageIndex + 1,
    pageSize,
    reset: () => setPageIndex(0),
    pagination: (total: number): DataTableManualPagination => ({
      pageIndex,
      pageSize,
      total,
      onPageIndexChange: setPageIndex,
      onPageSizeChange: (size) => {
        setPageSize(size);
        setPageIndex(0);
      },
    }),
  };
}
