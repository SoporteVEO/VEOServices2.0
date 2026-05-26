"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { buildYearOptions } from "./my-space-home-utils";

interface YearSelectProps {
  value: number;
  onChange: (year: number) => void;
  count?: number;
}

export function YearSelect({ value, onChange, count }: YearSelectProps) {
  const options = buildYearOptions(count);
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger sizeVariant="sm" className="h-7 w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
