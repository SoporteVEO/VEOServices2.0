"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addMonths,
  buildMonthOptions,
  formatMonthLabel,
  monthFromKey,
  monthKey,
  REPORT_MONTHS_BACK,
} from "./report-period";

type Props = {
  /** First day of the selected month. */
  value: Date;
  onChange: (month: Date) => void;
};

export function ReportMonthSelector({ value, onChange }: Props) {
  const options = useMemo(() => buildMonthOptions(), []);
  const oldest = options[options.length - 1];
  const newest = options[0];

  const selectedKey = monthKey(value);
  const isAtOldest = selectedKey === monthKey(oldest);
  const isAtNewest = selectedKey === monthKey(newest);

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        sizeVariant="md"
        icon={ChevronLeft}
        aria-label="Mes anterior"
        disabled={isAtOldest}
        onClick={() => onChange(addMonths(value, -1))}
        className="px-2"
      />

      <Select
        value={selectedKey}
        onValueChange={(key) => onChange(monthFromKey(key))}
      >
        <SelectTrigger className="h-8 w-45" aria-label="Mes del reporte">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((month) => (
            <SelectItem key={monthKey(month)} value={monthKey(month)}>
              {formatMonthLabel(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        sizeVariant="md"
        icon={ChevronRight}
        aria-label="Mes siguiente"
        disabled={isAtNewest}
        onClick={() => onChange(addMonths(value, 1))}
        className="px-2"
      />
    </div>
  );
}

export { REPORT_MONTHS_BACK };
