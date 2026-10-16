"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toYYYYMMDD } from "@/lib/format";
import type { FinanceDateRangeValue } from "./finance-format";

type Props = {
  value: FinanceDateRangeValue;
  onChange: (value: FinanceDateRangeValue) => void;
};

export function FinanceDateRangeFilter({ value, onChange }: Props) {
  return (
    <DateRangePicker
      align="end"
      locale="es-ES"
      showCompare={false}
      initialDateFrom={value.from}
      initialDateTo={value.to}
      onUpdate={({ range }) =>
        onChange({
          from: toYYYYMMDD(range.from),
          to: toYYYYMMDD(range.to ?? range.from),
        })
      }
    />
  );
}
