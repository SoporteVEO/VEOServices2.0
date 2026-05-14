"use client";
"use no memo";

import { useMemo, type ReactNode } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type DataTablePaginationConfig = {
  pageSize?: number;
  pageSizeOptions?: number[];
};

export type DataTableManualPagination = {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const SKELETON_CELL_WIDTHS = [
  "w-4/5",
  "w-3/5",
  "w-full",
  "w-2/3",
  "w-3/4",
] as const;

type DataTableRowSize = "sm" | "md" | "lg";

const ROW_SIZE_CELL_CLASS: Record<DataTableRowSize, string> = {
  sm: "px-2 py-1.5",
  md: "px-2 py-2.5",
  lg: "px-2 py-3.5",
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  skeletonRowCount?: number;
  rowSize?: DataTableRowSize;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  sideButtons?: ReactNode;
  pagination?: boolean | DataTablePaginationConfig;
  manualPagination?: DataTableManualPagination;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  skeletonRowCount = 8,
  rowSize = "md",
  onRowClick,
  emptyMessage = "No results.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  sideButtons,
  pagination,
  manualPagination,
}: DataTableProps<TData, TValue>) {
  const rowSizeCellClass = ROW_SIZE_CELL_CLASS[rowSize];

  const paginationConfig = useMemo<DataTablePaginationConfig | null>(() => {
    if (manualPagination || !pagination) return null;
    if (pagination === true) return {};
    return pagination;
  }, [pagination, manualPagination]);

  const pageSizeOptions = manualPagination?.pageSizeOptions ??
    paginationConfig?.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS];
  const initialPageSize =
    paginationConfig?.pageSize ?? pageSizeOptions[0] ?? 10;

  const table = useReactTable({
    data: isLoading ? [] : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(paginationConfig
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: {
            pagination: { pageIndex: 0, pageSize: initialPageSize },
          },
        }
      : {}),
  });

  const manualPageCount = manualPagination
    ? Math.max(1, Math.ceil(manualPagination.total / manualPagination.pageSize))
    : 0;

  return (
    <div
      className="overflow-hidden rounded-md"
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading table" : undefined}
    >
      {(onSearchChange || sideButtons) && (
        <div className="flex items-center gap-2 py-2">
          {onSearchChange && (
            <div className="w-full max-w-sm min-w-0 shrink-0 ml-1">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
                isSearch
              />
            </div>
          )}
          {sideButtons && (
            <div className="ml-auto flex items-center gap-2">{sideButtons}</div>
          )}
        </div>
      )}
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
              <TableRow
                key={`skeleton-${rowIndex}`}
                className={cn(
                  "hover:bg-transparent",
                  rowIndex % 2 === 0 ? "bg-background" : "bg-muted/75",
                )}
              >
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className={rowSizeCellClass}>
                    <Skeleton
                      className={cn(
                        "h-4",
                        rowIndex % 2 === 0 ? "bg-muted" : "bg-background",
                        SKELETON_CELL_WIDTHS[
                          colIndex % SKELETON_CELL_WIDTHS.length
                        ],
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  onRowClick && "cursor-pointer",
                  "hover:bg-primary/5",
                  index % 2 === 0 ? "bg-background" : "bg-muted/75",
                )}
                onClick={
                  onRowClick
                    ? () => {
                        onRowClick(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={rowSizeCellClass}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn(
                  "h-24 text-center text-muted-foreground",
                  rowSizeCellClass,
                )}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {paginationConfig && !isLoading && (
        <DataTablePagination
          pageIndex={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          pageCount={table.getPageCount()}
          totalRows={table.getFilteredRowModel().rows.length}
          pageSizeOptions={pageSizeOptions}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPageIndexChange={(i) => table.setPageIndex(i)}
          onPageSizeChange={(s) => table.setPageSize(s)}
        />
      )}
      {manualPagination && (
        <DataTablePagination
          pageIndex={manualPagination.pageIndex}
          pageSize={manualPagination.pageSize}
          pageCount={manualPageCount}
          totalRows={manualPagination.total}
          pageSizeOptions={pageSizeOptions}
          canPreviousPage={manualPagination.pageIndex > 0}
          canNextPage={manualPagination.pageIndex < manualPageCount - 1}
          onPageIndexChange={manualPagination.onPageIndexChange}
          onPageSizeChange={manualPagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
