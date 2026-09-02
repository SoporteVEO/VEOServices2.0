"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  /** Selected time as `HH:mm` in 24-hour form, or an empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Optional label rendered above the trigger. */
  label?: string;
  /** When true, shows a required indicator next to the label. */
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Minutes between the offered slots. Defaults to 15. */
  step?: number;
  /** Class applied to the wrapper. */
  className?: string;
  /** Class applied to the trigger. */
  triggerClassName?: string;
}

function buildSlots(step: number, value: string): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    slots.push(`${hours}:${String(minutes % 60).padStart(2, "0")}`);
  }
  // A stored time can sit off the grid (an actual start of 10:07, say), so it
  // has to remain selectable or the trigger would render blank.
  if (value && !slots.includes(value)) {
    slots.push(value);
    slots.sort();
  }
  return slots;
}

export function TimePicker({
  value,
  onChange,
  label,
  required = false,
  placeholder = "--:--",
  disabled = false,
  step = 15,
  className,
  triggerClassName,
}: TimePickerProps) {
  const slots = React.useMemo(() => buildSlots(step, value), [step, value]);

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
      label={label}
      required={required}
      className={cn("w-full", className)}
    >
      <SelectTrigger className={triggerClassName}>
        <span className="flex min-w-0 items-center gap-2">
          <Clock
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground/70"
          />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {slots.map((slot) => (
          <SelectItem key={slot} value={slot} className="tabular-nums">
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
