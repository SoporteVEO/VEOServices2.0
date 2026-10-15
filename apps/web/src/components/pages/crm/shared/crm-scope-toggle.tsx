"use client";

import { User, Users } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";

export type CrmScope = "mine" | "team";

interface CrmScopeToggleProps {
  value: CrmScope;
  onChange: (scope: CrmScope) => void;
  mineLabel?: string;
  teamLabel?: string;
}

export function CrmScopeToggle({
  value,
  onChange,
  mineLabel = "Mis datos",
  teamLabel = "Equipo",
}: CrmScopeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as CrmScope);
      }}
    >
      <ToggleGroupItem
        value="mine"
        className="gap-1.5 px-3 data-[state=on]:bg-accent data-[state=on]:text-foreground"
      >
        <User className="size-3.5" />
        {mineLabel}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="team"
        className="gap-1.5 px-3 data-[state=on]:bg-accent data-[state=on]:text-foreground"
      >
        <Users className="size-3.5" />
        {teamLabel}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
