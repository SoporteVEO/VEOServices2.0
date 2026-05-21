"use client";
"use no memo";

import { useMemo, type ReactNode } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSideButtons } from "./data-table-side-buttons";

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

export type DataTableRowSelection<TData> = {
  getRowId?: (row: TData, index: number) => string;
  state: RowSelectionState;
  onChange: (state: RowSelectionState) => void;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
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
  rowSelection?: DataTableRowSelection<TData>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  isLoading = false,
  skeletonRowCount = 20,
  rowSize = "md",
  onRowClick,
  emptyMessage = "No results.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  sideButtons,
  pagination,
  manualPagination,
  rowSelection,
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

  const tableColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!rowSelection) return columns;
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "__select__",
      enableSorting: false,
      enableHiding: false,
      size: 36,
      header: ({ table }) => (
        <div
          className="flex h-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            aria-label="Seleccionar todas las filas"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          className="flex h-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            aria-label="Seleccionar fila"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        </div>
      ),
    };
    return [selectionColumn, ...columns];
  }, [columns, rowSelection]);

  const table = useReactTable({
    data: isLoading ? [] : data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(rowSelection
      ? {
          state: { rowSelection: rowSelection.state },
          onRowSelectionChange: (updater) => {
            const next =
              typeof updater === "function"
                ? updater(rowSelection.state)
                : updater;
            rowSelection.onChange(next);
          },
          enableRowSelection: rowSelection.enableRowSelection ?? true,
          ...(rowSelection.getRowId ? { getRowId: rowSelection.getRowId } : {}),
        }
      : {}),
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

  const showPagination = Boolean(
    (paginationConfig && !isLoading) || manualPagination,
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-md",
        className,
      )}
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading table" : undefined}
    >
      {(onSearchChange || sideButtons) && (
        <div className="flex min-w-0 shrink-0 items-center gap-2 py-2">
          {onSearchChange && (
            <div className="ml-1 w-full max-w-sm min-w-0 shrink-0">
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
            <DataTableSideButtons>{sideButtons}</DataTableSideButtons>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        <Table containerClassName="overflow-visible border-0">
          <TableHeader className="sticky top-0 z-10 bg-muted [&_th]:bg-muted [&_th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
                  {tableColumns.map((_, colIndex) => (
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
              table.getRowModel().rows.map((row: Row<TData>, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    index % 2 === 0
                      ? "bg-background hover:bg-muted"
                      : "bg-muted/50 hover:bg-muted",
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
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
      </div>
      {showPagination && paginationConfig && (
        <div className="shrink-0 border-t border-border">
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
        </div>
      )}
      {showPagination && manualPagination && (
        <div className="shrink-0 border-t border-border">
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
        </div>
      )}
    </div>
  );
}
