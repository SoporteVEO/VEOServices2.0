"use client";

import { useMemo } from "react";
import { UserCheck } from "lucide-react";
import { useUsersLookup } from "@/api/users/users.get";
import type { UserLookupItem } from "@/api/users/users.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

function formatUserLabel(user: UserLookupItem): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName.length > 0 ? fullName : user.email;
}

function userToOption(user: UserLookupItem): ComboboxOption {
  const label = formatUserLabel(user);
  return {
    value: user.id,
    label,
    filterValue: `${label} ${user.email}`,
    data: user,
  };
}

interface AnalyticsUserFilterProps {
  value: string | null;
  onChange: (next: string | null) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Shared analytics filter that lists every active user (including the admin
 * themselves) so admin dashboards can scope reports to a specific user.
 */
export function AnalyticsUserFilter({
  value,
  onChange,
  className,
  placeholder = "Todos los usuarios",
}: AnalyticsUserFilterProps) {
  const { data: users, isLoading } = useUsersLookup({ includeSelf: true });

  const options = useMemo<ComboboxOption[]>(() => {
    if (!users) return [];
    return users.map(userToOption);
  }, [users]);

  function renderOption(option: ComboboxOption) {
    const user = option.data as UserLookupItem | undefined;
    if (!user) return option.label;
    return (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {formatUserLabel(user)}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
    );
  }

  return (
    <Combobox
      options={options}
      value={value}
      onChange={(next) => onChange(typeof next === "string" ? next : null)}
      placeholder={placeholder}
      emptyLabel={
        isLoading ? "Cargando usuarios..." : "No hay usuarios disponibles."
      }
      isLoading={isLoading}
      size="default"
      className={className}
      leadingIcon={<UserCheck className="size-4" />}
      renderOption={renderOption}
    />
  );
}
