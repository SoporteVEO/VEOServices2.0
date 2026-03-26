"use client";

import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { SpotsCalendarDayButton } from "./spots-calendar-day-button";

type SpotsCalendarGridProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  spotsByDay: Map<string, number>;
  maxSpots: number;
  onDaySelect: (date: Date) => void;
};

export function SpotsCalendarGrid({
  month,
  onMonthChange,
  spotsByDay,
  maxSpots,
  onDaySelect,
}: SpotsCalendarGridProps) {
  return (
    <div>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        required={false}
        locale={es}
        className="w-full [--cell-size:2.75rem] sm:[--cell-size:3.5rem] md:[--cell-size:5rem]"
        classNames={{
          day: "w-full p-1.5 aspect-video",
          month_caption: "w-full text-center capitalize mb-8",
        }}
        components={{
          DayButton: (props) => (
            <SpotsCalendarDayButton
              {...props}
              spotsByDay={spotsByDay}
              maxSpots={maxSpots}
              onDaySelect={onDaySelect}
            />
          ),
        }}
      />
    </div>
  );
}
