"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  pageSizeOptions: number[];
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  pageSizeOptions,
  canPreviousPage,
  canNextPage,
  onPageIndexChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {totalRows === 0
          ? "Sin resultados"
          : `Mostrando ${rangeStart}-${rangeEnd} de ${totalRows}`}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger sizeVariant="sm" className="w-[72px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          Página {pageCount === 0 ? 0 : pageIndex + 1} de {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            sizeVariant="sm"
            className="size-8 p-0"
            aria-label="Primera página"
            onClick={() => onPageIndexChange(0)}
            disabled={!canPreviousPage}
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            sizeVariant="sm"
            className="size-8 p-0"
            aria-label="Página anterior"
            onClick={() => onPageIndexChange(pageIndex - 1)}
            disabled={!canPreviousPage}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            sizeVariant="sm"
            className="size-8 p-0"
            aria-label="Página siguiente"
            onClick={() => onPageIndexChange(pageIndex + 1)}
            disabled={!canNextPage}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            sizeVariant="sm"
            className="size-8 p-0"
            aria-label="Última página"
            onClick={() => onPageIndexChange(pageCount - 1)}
            disabled={!canNextPage}
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
