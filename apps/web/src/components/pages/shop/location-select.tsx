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

interface LocationSelectProps {
  states: AvailableState[];
  selectedDepartamentoId: number | null;
  buildParams: () => URLSearchParams;
}

export function LocationSelect({
  states,
  selectedDepartamentoId,
  buildParams,
}: LocationSelectProps) {
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
    <div className="flex w-full min-w-[220px] flex-col gap-1.5 sm:w-auto">
      <label className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Ubicación
      </label>
      <Combobox
        options={options}
        value={selectedDepartamentoId ?? undefined}
        preserveOptionOrder
        required
        size="lg"
        placeholder="Selecciona municipio"
        leadingIcon={<MapPin className="size-4 shrink-0" />}
        triggerClassName="h-12 min-h-12 rounded-xl border-border/50 bg-background/50 shadow-sm hover:bg-accent/30 font-medium text-foreground"
        onChange={(next) => {
          if (next === undefined) return;
          const params = buildParams();
          params.set("stateId", String(next));
          router.push(`/shop?${params}`);
        }}
      />
    </div>
  );
}
