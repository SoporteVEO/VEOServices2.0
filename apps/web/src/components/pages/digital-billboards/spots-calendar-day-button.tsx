"use client";

import type { ComponentProps } from "react";
import { format } from "date-fns";
import { CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getSpotDayStyle, spotStyleClass } from "./spots-calendar-utils";

export type SpotsCalendarDayButtonProps = ComponentProps<
  typeof CalendarDayButton
> & {
  spotsByDay: Map<string, number>;
  maxSpots: number;
  onDaySelect: (date: Date) => void;
};

export function SpotsCalendarDayButton({
  day,
  className,
  children: _ignored,
  onClick,
  spotsByDay,
  maxSpots,
  onDaySelect,
  ...rest
}: SpotsCalendarDayButtonProps) {
  const key = format(day.date, "yyyy-MM-dd");
  const spots = spotsByDay.get(key) ?? 0;
  const style = getSpotDayStyle(spots, maxSpots);
  const toneClass = spotStyleClass[style];

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onDaySelect(day.date);
    onClick?.(e);
  }

  return (
    <CalendarDayButton
      {...rest}
      day={day}
      onClick={handleClick}
      className={cn(
        "flex min-h-(--cell-size) flex-col gap-0.5 py-1",
        className,
        toneClass,
      )}
    >
      <span className="text-sm font-medium leading-none">
        {day.date.getDate()}
      </span>
      {spots > 0 ? (
        <span className="text-[10px] font-semibold leading-none opacity-90">
          {spots} sp
        </span>
      ) : (
        <span className="text-[10px] opacity-40">·</span>
      )}
    </CalendarDayButton>
  );
}
