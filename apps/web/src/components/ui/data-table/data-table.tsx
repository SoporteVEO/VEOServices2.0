"use client";

import type { ReactNode } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
}: DataTableProps<TData, TValue>) {
  const rowSizeCellClass = ROW_SIZE_CELL_CLASS[rowSize];

  const table = useReactTable({
    data: isLoading ? [] : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className="overflow-hidden rounded-md"
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading table" : undefined}
    >
      {(onSearchChange || sideButtons) && (
        <div className="flex items-center gap-2 py-2">
          {onSearchChange && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-sm"
              isSearch
            />
          )}
          {sideButtons && (
            <div className="ml-auto flex items-center gap-2">{sideButtons}</div>
          )}
        </div>
      )}
      <Table className="rounded-md">
        <TableHeader className="bg-accent/50">
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
                  "hover:bg-transparent rounded-md",
                  rowIndex % 2 === 0 ? "bg-accent/10" : "bg-accent/25",
                )}
              >
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className={rowSizeCellClass}>
                    <Skeleton
                      className={cn(
                        "h-4",
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
                  index % 2 === 0 ? "bg-accent/10" : "bg-accent/25",
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
    </div>
  );
}
