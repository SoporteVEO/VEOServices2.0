"use client";

import type { SubRole } from "@/api/users/users.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { SUB_ROLE_OPTIONS } from "./const";

type SubRolesFieldProps = {
  value: SubRole[];
  onChange: (next: SubRole[]) => void;
};

export function SubRolesField({ value, onChange }: SubRolesFieldProps) {
  function toggle(role: SubRole, checked: boolean) {
    if (checked) {
      if (value.includes(role)) return;
      onChange([...value, role]);
    } else {
      onChange(value.filter((r) => r !== role));
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Permisos adicionales
      </span>
      <div className="flex flex-col gap-2 rounded-md border border-input p-3">
        {SUB_ROLE_OPTIONS.map((option) => {
          const id = `sub-role-${option.value}`;
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-start gap-3"
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(next) => toggle(option.value, next === true)}
                className="mt-0.5"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium leading-none">
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
