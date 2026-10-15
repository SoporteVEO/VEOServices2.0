"use client";

import type { ClientType } from "@/api/clients/clients.types";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { EditFieldShell } from "@/components/ui/edit-field";

import {
  CLIENT_TYPE_DESCRIPTIONS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_ORDER,
} from "./const";

interface ClientTypeToggleFieldProps {
  value: ClientType;
  isPending: boolean;
  onChange: (type: ClientType) => void;
}

export function ClientTypeToggleField({
  value,
  isPending,
  onChange,
}: ClientTypeToggleFieldProps) {
  return (
    <EditFieldShell
      label="Tipo de cliente"
      required
      description={CLIENT_TYPE_DESCRIPTIONS[value]}
    >
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={value}
        disabled={isPending}
        onValueChange={(next) => {
          if (next && next !== value) onChange(next as ClientType);
        }}
        className="w-full"
      >
        {CLIENT_TYPE_ORDER.map((type) => (
          <ToggleGroupItem
            key={type}
            value={type}
            className="flex-1 data-[state=on]:bg-accent data-[state=on]:text-foreground"
          >
            {CLIENT_TYPE_LABELS[type]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </EditFieldShell>
  );
}
