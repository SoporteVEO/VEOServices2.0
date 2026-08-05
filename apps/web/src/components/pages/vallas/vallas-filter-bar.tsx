"use client";

import { DateRangeSelect } from "@/components/pages/shop";
import { VallasLocationSelect } from "./vallas-location-select";

interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

interface VallasFilterBarProps {
  from: string;
  to: string;
  states: AvailableState[];
  effectiveDepartmentId: number | null;
  onRangeChange: (from: string, to: string) => void;
  buildParams: () => URLSearchParams;
}

export function VallasFilterBar({
  from,
  to,
  states,
  effectiveDepartmentId,
  onRangeChange,
  buildParams,
}: VallasFilterBarProps) {
  return (
    <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-3 py-2 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-end">
          <DateRangeSelect
            from={from}
            to={to}
            onRangeChange={onRangeChange}
          />

          {states.length > 0 && (
            <>
              <div className="mx-2 mb-1 hidden h-10 w-px self-end bg-border/50 lg:block" />

              <VallasLocationSelect
                states={states}
                selectedDepartmentId={effectiveDepartmentId}
                buildParams={buildParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
