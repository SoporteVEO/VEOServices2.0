"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarRange, ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/primitives/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dateRangeOverlapsOccupied,
  isDateWithinContractRanges,
  type ContractRange,
} from "../detail/billboard-detail-utils";

function formatShortDate(date: Date | null): string {
  if (!date) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

function stripTime(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export interface ItemDateRangeCellProps {
  startDate: Date | null;
  endDate: Date | null;
  minDate?: Date | null;
  occupiedRanges?: ContractRange[];
  className?: string;
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
}

export function ItemDateRangeCell({
  startDate,
  endDate,
  minDate,
  occupiedRanges = [],
  className,
  onChange,
}: ItemDateRangeCellProps) {
  const [open, setOpen] = useState(false);
  // Tracks whether the user has already clicked a date in the current popover
  // session. When the popover opens with a complete pre-filled range, the
  // first click should only reset the range (no auto-close); the second click
  // completes it and closes the popover.
  const hasPickedFirstDate = useRef(false);

  const label = useMemo(() => {
    if (!startDate && !endDate) return "Seleccionar duración";
    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  }, [startDate, endDate]);

  const selected = useMemo(
    () =>
      startDate || endDate
        ? { from: startDate ?? undefined, to: endDate ?? undefined }
        : undefined,
    [startDate, endDate],
  );

  const calendarKey = useMemo(
    () =>
      occupiedRanges
        .map(
          (range) =>
            `${range.start.getTime()}-${range.end.getTime()}`,
        )
        .join("|"),
    [occupiedRanges],
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      hasPickedFirstDate.current = false;
    }
    setOpen(nextOpen);
  }

  function handleSelect(value: { from?: Date; to?: Date } | undefined) {
    const nextStart = value?.from ?? null;
    const nextEnd = value?.to ?? null;
    if (
      nextStart &&
      nextEnd &&
      dateRangeOverlapsOccupied(nextStart, nextEnd, occupiedRanges)
    ) {
      toast.warning(
        "El rango incluye fechas con contrato activo. Elige solo días disponibles.",
      );
      return;
    }
    onChange({
      startDate: nextStart,
      endDate: nextEnd,
    });
    const isCompleteRange = !!nextStart && !!nextEnd;
    if (!isCompleteRange) {
      // user just started a fresh selection
      hasPickedFirstDate.current = true;
      return;
    }
    if (hasPickedFirstDate.current) {
      setOpen(false);
      hasPickedFirstDate.current = false;
    } else {
      // first click in this session, but resetOnSelect produces only `from`.
      // If we somehow received a complete range on the first click (shouldn't
      // happen with resetOnSelect=true), just mark first click as done.
      hasPickedFirstDate.current = true;
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={CalendarRange}
          className={cn(
            "h-7 w-full justify-start gap-1.5 px-2 text-xs font-medium",
            !startDate && !endDate && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex-1 truncate text-left">{label}</span>
          <ChevronDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          key={calendarKey}
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={handleSelect}
          resetOnSelect
          disabled={(date) => {
            if (minDate && date < stripTime(minDate)) return true;
            if (
              occupiedRanges.length > 0 &&
              isDateWithinContractRanges(date, occupiedRanges)
            ) {
              return true;
            }
            return false;
          }}
          defaultMonth={startDate ?? minDate ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
