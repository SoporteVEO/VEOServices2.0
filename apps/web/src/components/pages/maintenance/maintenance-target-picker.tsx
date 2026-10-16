"use client";

import { useMemo, useState } from "react";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { useAvailableBillboardsInRange } from "@/api/billboards/billboards.get";
import {
  useDigitalBillboards,
  type DigitalBillboard,
} from "@/api/digital-billboards/digital-billboards.get";
import type { MaintenanceJobKind } from "@/api/maintenance/maintenance.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toYYYYMMDD } from "@/lib/format";
import { MAINTENANCE_KIND_COPY } from "./maintenance-const";

export type MaintenanceTarget =
  | { kind: "STATIC"; billboard: AvailableBillboardListing }
  | { kind: "DIGITAL"; screen: DigitalBillboard };

type Props = {
  kind: MaintenanceJobKind;
  value: MaintenanceTarget | null;
  onChange: (target: MaintenanceTarget | null) => void;
};

/** Brilo static billboard or Pantallas screen, depending on the module. */
export function MaintenanceTargetPicker({ kind, value, onChange }: Props) {
  return kind === "DIGITAL" ? (
    <DigitalScreenPicker value={value} onChange={onChange} />
  ) : (
    <StaticBillboardPicker value={value} onChange={onChange} />
  );
}

/** 60-day catalog window, wide enough to cover any billboard in the picker. */
function billboardRange(): { from: string; to: string } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 60);
  return { from: toYYYYMMDD(from), to: toYYYYMMDD(to) };
}

function StaticBillboardPicker({
  value,
  onChange,
}: Omit<Props, "kind">) {
  const copy = MAINTENANCE_KIND_COPY.STATIC;
  const [range] = useState(billboardRange);
  const { data: billboards = [], isLoading } = useAvailableBillboardsInRange({
    from: range.from,
    to: range.to,
    includeUnavailable: true,
  });

  const options = useMemo<ComboboxOption[]>(
    () =>
      billboards.map((b) => ({
        value: b.billboardId,
        label: (
          <OptionLabel
            title={b.billboardCode ?? `#${b.billboardId}`}
            subtitle={`${b.address ?? "—"}${
              [b.cityName, b.departmentName].filter(Boolean).length > 0
                ? ` · ${[b.cityName, b.departmentName].filter(Boolean).join(", ")}`
                : ""
            }`}
          />
        ),
        filterValue: `${b.billboardCode ?? ""} ${b.address ?? ""} ${b.cityName ?? ""} ${b.departmentName ?? ""}`,
      })),
    [billboards],
  );

  return (
    <Combobox
      label={copy.target}
      required
      placeholder={copy.targetPlaceholder}
      emptyLabel={isLoading ? copy.targetLoading : "Sin resultados."}
      options={options}
      value={value?.kind === "STATIC" ? value.billboard.billboardId : null}
      isLoading={isLoading}
      onChange={(next) => {
        const found = billboards.find((b) => b.billboardId === Number(next));
        onChange(found ? { kind: "STATIC", billboard: found } : null);
      }}
    />
  );
}

function DigitalScreenPicker({ value, onChange }: Omit<Props, "kind">) {
  const copy = MAINTENANCE_KIND_COPY.DIGITAL;
  const { data: screens = [], isLoading } = useDigitalBillboards();

  const options = useMemo<ComboboxOption[]>(
    () =>
      screens.map((screen) => ({
        value: screen.id,
        label: (
          <OptionLabel
            title={`${screen.code} · ${screen.name}`}
            subtitle={screen.address || "—"}
          />
        ),
        filterValue: `${screen.code} ${screen.name} ${screen.address}`,
      })),
    [screens],
  );

  return (
    <Combobox
      label={copy.target}
      required
      placeholder={copy.targetPlaceholder}
      emptyLabel={isLoading ? copy.targetLoading : "Sin resultados."}
      options={options}
      value={value?.kind === "DIGITAL" ? value.screen.id : null}
      isLoading={isLoading}
      onChange={(next) => {
        const found = screens.find((screen) => screen.id === next);
        onChange(found ? { kind: "DIGITAL", screen: found } : null);
      }}
    />
  );
}

function OptionLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-medium">{title}</span>
      <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}
