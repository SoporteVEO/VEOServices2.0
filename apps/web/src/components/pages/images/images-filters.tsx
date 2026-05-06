"use client";

import { useMemo } from "react";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, X } from "lucide-react";
import {
  S3_IMAGE_TYPE_OPTIONS,
  useS3ImageUploaders,
  type S3ImageType,
  type SortOrder,
} from "@/api/s3-images/s3-images.get";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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

export function ImagesFilters({ value, onChange }: ImagesFiltersProps) {
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

  return (
    <div className="flex flex-row items-center gap-2">
      <Input
        isSearch
        placeholder="Buscar por código..."
        value={value.code}
        onChange={(e) => onChange({ ...value, code: e.target.value })}
        className="h-9 sm:w-56 md:w-full"
      />

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

      <Select
        value={value.s3ImageType ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...value,
            s3ImageType: v === "all" ? null : (v as S3ImageType),
          })
        }
      >
        <SelectTrigger sizeVariant="lg" className="w-full min-w-0 sm:max-w-72">
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

      <Combobox
        className="w-full sm:w-56"
        triggerClassName="h-9"
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

      <Select
        value={value.sortOrder}
        onValueChange={(v) => onChange({ ...value, sortOrder: v as SortOrder })}
      >
        <SelectTrigger sizeVariant="lg" className="w-full sm:w-44">
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

      {filtered ? (
        <Button
          variant="ghost"
          icon={X}
          onClick={() =>
            onChange({ ...DEFAULT_IMAGES_FILTERS, sortOrder: value.sortOrder })
          }
        >
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
