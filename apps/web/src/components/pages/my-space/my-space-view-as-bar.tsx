"use client";

import { useMemo } from "react";
import { Eye, TriangleAlert, UserCheck } from "lucide-react";
import { useUsersLookup } from "@/api/users/users.get";
import type { UserLookupItem } from "@/api/users/users.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const VIEW_AS_PLACEHOLDER = "Ver como otro usuario";

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

export function MySpaceViewAsBar() {
  const { isAdmin, viewAsUserId, setViewAsUserId } = useMySpaceViewAs();
  const { data: users, isLoading } = useUsersLookup({ enabled: isAdmin });

  const options = useMemo<ComboboxOption[]>(() => {
    if (!users) return [];
    return users.map(userToOption);
  }, [users]);

  const selectedUser = useMemo<UserLookupItem | null>(() => {
    if (!viewAsUserId || !users) return null;
    return users.find((u) => u.id === viewAsUserId) ?? null;
  }, [users, viewAsUserId]);

  // The stored user no longer exists (deleted/disabled). We surface a banner
  // letting the admin clear the stale selection manually.
  const hasStaleSelection = Boolean(
    viewAsUserId && users && users.length > 0 && !selectedUser,
  );

  if (!isAdmin) return null;

  function handleChange(next: string | number | undefined) {
    setViewAsUserId(typeof next === "string" ? next : null);
  }

  function handleReset() {
    setViewAsUserId(null);
  }

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
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Eye className="size-3.5" />
        <span>Vista de administrador</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Combobox
          options={options}
          value={viewAsUserId ?? null}
          onChange={handleChange}
          placeholder={VIEW_AS_PLACEHOLDER}
          emptyLabel={
            isLoading ? "Cargando usuarios..." : "No hay usuarios disponibles."
          }
          isLoading={isLoading}
          size="sm"
          className="w-72"
          triggerClassName="h-8"
          leadingIcon={<UserCheck className="size-3.5" />}
          renderOption={renderOption}
        />
        {viewAsUserId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleReset}
          >
            Volver a mi espacio
          </Button>
        ) : null}
      </div>

      {selectedUser ? (
        <p className="basis-full text-xs text-muted-foreground">
          Estás viendo Mi Espacio como{" "}
          <span className="font-medium text-foreground">
            {formatUserLabel(selectedUser)}
          </span>
          . Las acciones de edición están deshabilitadas.
        </p>
      ) : hasStaleSelection ? (
        <p className="basis-full inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <TriangleAlert className="size-3.5" aria-hidden />
          El usuario seleccionado ya no está disponible. Usa &ldquo;Volver a mi
          espacio&rdquo; para limpiar la selección.
        </p>
      ) : null}
    </div>
  );
}
