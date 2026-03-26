"use client";

import { useMemo } from "react";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { parseYYYYMMDD, toYYYYMMDD, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { Calendar } from "@/components/primitives/ui/calendar";

interface DateRangeSelectProps {
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
  disabled?: boolean;
}

export function DateRangeSelect({
  from,
  to,
  onRangeChange,
  disabled,
}: DateRangeSelectProps) {
  const fromDate = useMemo(() => parseYYYYMMDD(from), [from]);
  const toDate = useMemo(() => parseYYYYMMDD(to), [to]);

  const handleSelectFrom = (date: Date | undefined) => {
    if (!date) return;
    const nextFrom = toYYYYMMDD(date);
    const currentTo = toDate ?? date;
    const coercedTo = date.getTime() > currentTo.getTime() ? date : currentTo;
    onRangeChange(nextFrom, toYYYYMMDD(coercedTo));
  };

  const handleSelectTo = (date: Date | undefined) => {
    if (!date) return;
    const nextTo = toYYYYMMDD(date);
    const currentFrom = fromDate ?? date;
    const coercedFrom =
      date.getTime() < currentFrom.getTime() ? date : currentFrom;
    onRangeChange(toYYYYMMDD(coercedFrom), nextTo);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
        Período de campaña
      </label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full sm:w-[160px] h-12 justify-start bg-background/50 hover:bg-accent/30 border-border/50 shadow-sm rounded-xl font-medium"
            >
              <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="truncate">
                {fromDate ? formatDate(fromDate) : "Inicio"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-xl border-border/50 shadow-xl"
            align="start"
          >
            <Calendar
              mode="single"
              selected={fromDate ?? undefined}
              onSelect={handleSelectFrom}
              defaultMonth={fromDate ?? undefined}
              className="p-3"
            />
          </PopoverContent>
        </Popover>

        <ArrowRight className="size-4 text-muted-foreground/50 hidden sm:block shrink-0" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full sm:w-[160px] h-12 justify-start bg-background/50 hover:bg-accent/30 border-border/50 shadow-sm rounded-xl font-medium"
            >
              <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="truncate">
                {toDate ? formatDate(toDate) : "Fin"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-xl border-border/50 shadow-xl"
            align="start"
          >
            <Calendar
              mode="single"
              selected={toDate ?? undefined}
              onSelect={handleSelectTo}
              defaultMonth={toDate ?? fromDate ?? undefined}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
