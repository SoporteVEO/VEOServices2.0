"use client";

import { TypeSelect } from "./type-select";
import { DateRangeSelect } from "./date-range-select";
import { LocationSelect } from "./location-select";
import { SpotsSelect } from "./spots-select";
import { DigitalSpotOption } from "@/lib/digital-spots";

interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

interface FilterBarProps {
  mode: "estatica" | "digital";
  from: string;
  to: string;
  digitalSpots: DigitalSpotOption;
  states: AvailableState[];
  effectiveDepartmentId: number | null;
  onRangeChange: (from: string, to: string) => void;
  buildParams: () => URLSearchParams;
}

export function FilterBar({
  mode,
  from,
  to,
  digitalSpots,
  states,
  effectiveDepartmentId,
  onRangeChange,
  buildParams,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <TypeSelect value={mode} />
          
          <div className="h-10 w-px bg-border/50 hidden lg:block mx-2 self-end mb-1" />
          
          <DateRangeSelect 
            from={from} 
            to={to} 
            onRangeChange={onRangeChange} 
          />
          
          <div className="h-10 w-px bg-border/50 hidden lg:block mx-2 self-end mb-1" />
          
          {states.length > 0 && (
            <LocationSelect
              states={states}
              selectedDepartamentoId={effectiveDepartmentId}
              buildParams={buildParams}
            />
          )}

          {mode === "digital" && (
            <>
              <div className="h-10 w-px bg-border/50 hidden lg:block mx-2 self-end mb-1" />
              <SpotsSelect value={digitalSpots} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
