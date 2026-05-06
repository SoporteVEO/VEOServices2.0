"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  S3_IMAGE_TYPE_OPTIONS,
  useS3ImageUploaders,
  type S3ImageType,
  type SortOrder,
} from "@/api/s3-images/s3-images.get";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/primitives/ui/sheet";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseYYYYMMDD, toYYYYMMDD } from "@/lib/format";

export interface ImagesFiltersState {
  code: string;
  uploadedUserId: string | null;
  s3ImageType: S3ImageType | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortOrder: SortOrder;
}

export const DEFAULT_IMAGES_FILTERS: ImagesFiltersState = {
  code: "",
  uploadedUserId: null,
  s3ImageType: null,
  dateFrom: null,
  dateTo: null,
  sortOrder: "desc",
};

interface ImagesFiltersProps {
  value: ImagesFiltersState;
  onChange: (next: ImagesFiltersState) => void;
  actions?: ReactNode;
}

function uploaderLabel(u: {
  firstName: string;
  lastName: string | null;
  email: string;
}) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

function isFiltered(state: ImagesFiltersState) {
  return (
    state.code.trim() !== "" ||
    state.uploadedUserId !== null ||
    state.s3ImageType !== null ||
    state.dateFrom !== null ||
    state.dateTo !== null
  );
}

function activeAdvancedFilterCount(state: ImagesFiltersState) {
  let count = 0;
  if (state.uploadedUserId !== null) count += 1;
  if (state.s3ImageType !== null) count += 1;
  if (state.dateFrom !== null || state.dateTo !== null) count += 1;
  return count;
}

export function ImagesFilters({
  value,
  onChange,
  actions,
}: ImagesFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: uploaders, isLoading: isLoadingUploaders } =
    useS3ImageUploaders();

  const uploaderOptions = useMemo(
    () =>
      (uploaders ?? []).map((u) => ({
        value: u.id,
        label: uploaderLabel(u),
      })),
    [uploaders],
  );

  const dateRangeKey = `${value.dateFrom ?? ""}-${value.dateTo ?? ""}`;
  const initialFrom = value.dateFrom
    ? (parseYYYYMMDD(value.dateFrom) ?? undefined)
    : undefined;
  const initialTo = value.dateTo
    ? (parseYYYYMMDD(value.dateTo) ?? undefined)
    : undefined;

  const filtered = isFiltered(value);
  const advancedCount = activeAdvancedFilterCount(value);

  const searchInput = (
    <Input
      isSearch
      placeholder="Buscar por código..."
      value={value.code}
      onChange={(e) => onChange({ ...value, code: e.target.value })}
      className="h-9"
    />
  );

  const dateRangePicker = (
    <DateRangePicker
      key={dateRangeKey}
      align="start"
      locale="es-ES"
      showCompare={false}
      initialDateFrom={initialFrom}
      initialDateTo={initialTo}
      onUpdate={({ range }) => {
        const to = range.to ?? range.from;
        onChange({
          ...value,
          dateFrom: toYYYYMMDD(range.from),
          dateTo: toYYYYMMDD(to),
        });
      }}
    />
  );

  const typeSelect = (
    <Select
      value={value.s3ImageType ?? "all"}
      onValueChange={(v) =>
        onChange({
          ...value,
          s3ImageType: v === "all" ? null : (v as S3ImageType),
        })
      }
    >
      <SelectTrigger sizeVariant="lg" className="w-full min-w-0">
        <SelectValue placeholder="Tipo de imagen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los tipos</SelectItem>
        {S3_IMAGE_TYPE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const uploaderCombobox = (
    <Combobox
      className="w-full"
      triggerClassName="h-9 w-full"
      placeholder="Subido por"
      emptyLabel="No hay usuarios."
      options={uploaderOptions}
      value={value.uploadedUserId}
      isLoading={isLoadingUploaders}
      onChange={(v) =>
        onChange({
          ...value,
          uploadedUserId: v == null ? null : String(v),
        })
      }
    />
  );

  const sortSelect = (
    <Select
      value={value.sortOrder}
      onValueChange={(v) => onChange({ ...value, sortOrder: v as SortOrder })}
    >
      <SelectTrigger sizeVariant="lg" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="desc">
          <ArrowDownNarrowWide className="size-3.5" />
          Más recientes primero
        </SelectItem>
        <SelectItem value="asc">
          <ArrowUpNarrowWide className="size-3.5" />
          Más antiguos primero
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const clearButton = filtered ? (
    <Button
      variant="ghost"
      icon={X}
      onClick={() =>
        onChange({ ...DEFAULT_IMAGES_FILTERS, sortOrder: value.sortOrder })
      }
    >
      Limpiar
    </Button>
  ) : null;

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 -mt-4 flex items-center gap-2 border-b border-border/60 bg-background/95 px-4 py-2 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">{searchInput}</div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              sizeVariant="lg"
              className="relative shrink-0"
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal className="size-4" />
              {advancedCount > 0 ? (
                <span className="absolute -top-1.5 -inset-e-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
                  {advancedCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-[88vw] max-w-md flex-col gap-0 p-0"
          >
            <SheetHeader className="border-b">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Rango de fechas
                </Label>
                {dateRangePicker}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Tipo de imagen
                </Label>
                {typeSelect}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Subido por
                </Label>
                {uploaderCombobox}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Orden
                </Label>
                {sortSelect}
              </div>
            </div>

            <SheetFooter className="border-t">
              {advancedCount > 0 ? (
                <Button
                  variant="outline"
                  icon={X}
                  onClick={() =>
                    onChange({
                      ...value,
                      uploadedUserId: null,
                      s3ImageType: null,
                      dateFrom: null,
                      dateTo: null,
                    })
                  }
                >
                  Limpiar filtros
                </Button>
              ) : null}
              <SheetClose asChild>
                <Button>Aplicar</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="hidden flex-row items-center gap-2 lg:flex">
        <div className="sm:w-56 md:w-full">{searchInput}</div>

        {dateRangePicker}

        <div className="w-full sm:max-w-72">{typeSelect}</div>

        <div className="w-full sm:w-56">{uploaderCombobox}</div>

        <div className="w-full sm:w-44">{sortSelect}</div>

        {clearButton}

        {actions ? <div className="ms-auto shrink-0">{actions}</div> : null}
      </div>
    </>
  );
}
