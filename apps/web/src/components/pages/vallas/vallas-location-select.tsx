"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

interface AvailableState {
  departmentId: number;
  departmentName: string;
  availableCount: number;
}

interface VallasLocationSelectProps {
  states: AvailableState[];
  selectedDepartmentId: number | null;
  buildParams: () => URLSearchParams;
}

export function VallasLocationSelect({
  states,
  selectedDepartmentId,
  buildParams,
}: VallasLocationSelectProps) {
  const router = useRouter();

  const options: ComboboxOption[] = useMemo(
    () =>
      states.map((s) => ({
        value: s.departmentId,
        filterValue: `${s.departmentName} ${s.departmentId} ${s.availableCount}`,
        label: (
          <div className="flex w-full items-center justify-between gap-4">
            <span className="truncate font-medium">{s.departmentName}</span>
            <span className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {s.availableCount} disponibles
            </span>
          </div>
        ),
      })),
    [states],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:min-w-[220px] sm:gap-1.5">
      <label className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 sm:text-xs">
        Ubicación
      </label>
      <Combobox
        options={options}
        value={selectedDepartmentId ?? undefined}
        preserveOptionOrder
        required
        size="lg"
        placeholder="Selecciona municipio"
        leadingIcon={<MapPin className="size-3.5 shrink-0 sm:size-4" />}
        triggerClassName="h-9 min-h-9 sm:h-12 sm:min-h-12 rounded-lg sm:rounded-xl border-border/50 bg-background/50 shadow-sm hover:bg-accent/30 text-xs sm:text-sm font-medium text-foreground"
        onChange={(next) => {
          if (next === undefined) return;
          const params = buildParams();
          params.set("stateId", String(next));
          router.push(`/vallas?${params}`);
        }}
      />
    </div>
  );
}
