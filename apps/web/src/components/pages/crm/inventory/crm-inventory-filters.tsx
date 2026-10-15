"use client";

import type { CrmSiteKind } from "@/api/crm/crm-ooh.types";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_KIND_ICONS, SITE_KIND_LABELS } from "../crm-ooh-const";
import { ALL, type InventoryFilters } from "./inventory-state";

const KINDS: CrmSiteKind[] = ["STATIC", "DIGITAL"];

interface Props {
  value: InventoryFilters;
  onChange: (patch: Partial<InventoryFilters>) => void;
  departments: string[];
}

export function CrmInventoryFilters({ value, onChange, departments }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DatePicker
          label="Inicio de exhibición"
          value={value.from}
          onChange={(from) =>
            onChange({
              from: from ?? null,
              ...(from && value.to && value.to < from ? { to: from } : {}),
            })
          }
        />
        <DatePicker
          label="Fin de exhibición"
          value={value.to}
          minDate={value.from ?? undefined}
          onChange={(to) => onChange({ to: to ?? null })}
        />
        <Select
          label="Departamento"
          value={value.department}
          onValueChange={(department) => onChange({ department })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          label="Buscar"
          isSearch
          placeholder="Código, dirección, ciudad..."
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={value.kind}
          onValueChange={(kind) => {
            if (kind) onChange({ kind: kind as InventoryFilters["kind"] });
          }}
        >
          <ToggleGroupItem value={ALL} className="px-3 data-[state=on]:bg-accent">
            Todo
          </ToggleGroupItem>
          {KINDS.map((kind) => {
            const Icon = SITE_KIND_ICONS[kind];
            return (
              <ToggleGroupItem
                key={kind}
                value={kind}
                className="gap-1.5 px-3 data-[state=on]:bg-accent"
              >
                <Icon className="size-3.5" />
                {SITE_KIND_LABELS[kind]}s
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Switch
            id="inventory-only-available"
            checked={value.onlyAvailable}
            onCheckedChange={(onlyAvailable) => onChange({ onlyAvailable })}
          />
          <Label htmlFor="inventory-only-available" className="text-xs">
            Solo disponibles
          </Label>
        </div>
      </div>
    </div>
  );
}
