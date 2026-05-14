"use client";

import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/primitives/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  /** Currently selected date. */
  value?: Date | null;
  /** Called with the newly selected date (or undefined when cleared). */
  onChange: (date: Date | undefined) => void;
  /** Optional label rendered above the trigger. */
  label?: React.ReactNode;
  /** When true, shows a required indicator next to the label. */
  required?: boolean;
  /** Placeholder shown when no date is selected. */
  placeholder?: string;
  /** Disable interactions. */
  disabled?: boolean;
  /** When true and a date is selected, shows an action to clear the value. */
  allowClear?: boolean;
  /** Disable any date strictly before this one. */
  minDate?: Date;
  /** Disable any date strictly after this one. */
  maxDate?: Date;
  /** ARIA invalid state forwarded to the trigger button. */
  "aria-invalid"?: boolean;
  /** Class applied to the wrapper. */
  className?: string;
  /** Class applied to the trigger button. */
  buttonClassName?: string;
  /** Popover alignment. Defaults to `"start"`. */
  align?: "start" | "center" | "end";
}

export function DatePicker({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Selecciona una fecha",
  disabled = false,
  allowClear = false,
  minDate,
  maxDate,
  className,
  buttonClassName,
  align = "start",
  ...rest
}: DatePickerProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label ? (
        <Label
          htmlFor={generatedId}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={generatedId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={rest["aria-invalid"]}
            icon={CalendarIcon}
            className={cn(
              "w-full justify-start bg-accent/50 px-3 font-normal",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
          >
            {value ? formatDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date);
              if (date) setOpen(false);
            }}
            disabled={(date) => {
              if (minDate && date < stripTime(minDate)) return true;
              if (maxDate && date > stripTime(maxDate)) return true;
              return false;
            }}
            captionLayout="dropdown"
          />
          {allowClear && value ? (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                sizeVariant="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Quitar fecha
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
