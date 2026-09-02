"use client";

import { useState } from "react";
import { Archive, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceCategories } from "@/api/maintenance/maintenance.get";
import {
  useCreateMaintenanceCategory,
  useDeleteMaintenanceCategory,
  useUpdateMaintenanceCategory,
} from "@/api/maintenance/maintenance.mutations";
import type { MaintenanceCategory } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaintenanceCategoryBadge } from "./maintenance-category-badge";

const PRESET_COLORS = [
  "#0bbac8",
  "#e3326b",
  "#a8cf3a",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#64748b",
];

export function MaintenanceCategoriesPanel() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const { data: categories = [], isLoading } = useMaintenanceCategories(true);
  const createCategory = useCreateMaintenanceCategory();

  function handleCreate() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    createCategory.mutate(
      { name: trimmed, color },
      {
        onSuccess: () => {
          toast.success(`Categoría "${trimmed}" creada.`);
          setName("");
        },
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo crear la categoría.",
          ),
      },
    );
  }

  const active = categories.filter((category) => !category.archived);
  const archived = categories.filter((category) => category.archived);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Nueva categoría</h3>
        <p className="pt-0.5 text-xs text-muted-foreground">
          Agrupa las órdenes por tipo de falla, por ejemplo estructura,
          iluminación o lona.
        </p>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-end">
          <Input
            label="Nombre"
            type="text"
            placeholder="Ej. Iluminación"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Color
            </span>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Color ${preset}`}
                  aria-pressed={color === preset}
                  onClick={() => setColor(preset)}
                  className="size-7 rounded-md border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: `${preset}33`,
                    borderColor: color === preset ? preset : "transparent",
                  }}
                >
                  <span
                    className="mx-auto block size-3 rounded-full"
                    style={{ backgroundColor: preset }}
                  />
                </button>
              ))}
            </div>
          </div>
          <Button
            icon={Plus}
            onClick={handleCreate}
            disabled={createCategory.isPending}
          >
            Agregar
          </Button>
        </div>
      </section>

      <section>
        <h3 className="pb-2 text-sm font-semibold">
          Categorías activas{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({active.length})
          </span>
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : active.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
            Aún no hay categorías. Crea la primera arriba.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 ? (
        <section>
          <h3 className="pb-2 text-sm font-semibold text-muted-foreground">
            Archivadas ({archived.length})
          </h3>
          <p className="pb-2 text-xs text-muted-foreground">
            Las categorías con órdenes registradas se archivan en lugar de
            borrarse, para que el historial conserve su etiqueta.
          </p>
          <ul className="flex flex-col gap-2">
            {archived.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function CategoryRow({ category }: { category: MaintenanceCategory }) {
  const updateCategory = useUpdateMaintenanceCategory();
  const deleteCategory = useDeleteMaintenanceCategory();
  const isBusy = updateCategory.isPending || deleteCategory.isPending;

  function toggleArchived() {
    updateCategory.mutate(
      { id: category.id, archived: !category.archived },
      {
        onSuccess: () =>
          toast.success(
            category.archived
              ? "Categoría restaurada."
              : "Categoría archivada.",
          ),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo actualizar la categoría.",
          ),
      },
    );
  }

  function handleDelete() {
    deleteCategory.mutate(
      { id: category.id },
      {
        onSuccess: (result) =>
          toast.success(
            result.deleted
              ? "Categoría eliminada."
              : "La categoría tiene órdenes, se archivó en su lugar.",
          ),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo eliminar la categoría.",
          ),
      },
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <MaintenanceCategoryBadge category={category} />
      <Badge variant="secondary" className="text-[11px]">
        {category.jobCount} {category.jobCount === 1 ? "orden" : "órdenes"}
      </Badge>

      <div className="ml-auto flex items-center gap-1">
        <PrimitiveButton
          variant="ghost"
          size="icon"
          aria-label={category.archived ? "Restaurar" : "Archivar"}
          disabled={isBusy}
          onClick={toggleArchived}
        >
          {category.archived ? (
            <RotateCcw className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </PrimitiveButton>
        {category.jobCount === 0 ? (
          <PrimitiveButton
            variant="ghost"
            size="icon"
            aria-label="Eliminar"
            disabled={isBusy}
            onClick={handleDelete}
          >
            <Trash2 className="size-4 text-destructive" />
          </PrimitiveButton>
        ) : null}
      </div>
    </li>
  );
}
