"use client";

import { useState } from "react";
import { ExternalLink, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteProductionOrderArtLink,
  useSetProductionOrderArtLink,
} from "@/api/production-orders/production-orders.patch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { normalizeArtLink } from "./production-order-art-file";

type Props = {
  itemId: string;
  url: string | null;
  readOnly?: boolean;
};

export function ProductionOrderArtLink({ itemId, url, readOnly = false }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteMutation = useDeleteProductionOrderArtLink();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success("Enlace eliminado.");
      setConfirmDeleteOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el enlace.",
      );
    }
  }

  if (isEditing) {
    return (
      <ArtLinkForm
        itemId={itemId}
        initialUrl={url ?? ""}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  if (!url) {
    if (readOnly) return null;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        onClick={() => setIsEditing(true)}
      >
        <Plus className="size-3.5" aria-hidden />
        Agregar enlace (WeTransfer, Drive…)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background/60 p-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] text-muted-foreground">Enlace del arte</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            className="block truncate text-xs font-medium text-primary hover:underline"
          >
            {url}
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" aria-hidden />
            Abrir
          </a>
        </Button>
        {readOnly ? null : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              loading={deleteMutation.isPending}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Eliminar
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar el enlace del arte?"
        description="El enlace se quitará de esta valla."
        pending={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

function ArtLinkForm({
  itemId,
  initialUrl,
  onDone,
}: {
  itemId: string;
  initialUrl: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const setMutation = useSetProductionOrderArtLink();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeArtLink(value);
    if (!normalized) {
      setError("Ingresa un enlace válido (http o https).");
      return;
    }
    try {
      await setMutation.mutateAsync({ itemId, url: normalized });
      toast.success("Enlace guardado.");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar el enlace.",
      );
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Input
          type="url"
          value={value}
          autoFocus
          placeholder="https://we.tl/t-..."
          aria-label="Enlace del arte"
          aria-invalid={error ? true : undefined}
          disabled={setMutation.isPending}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
        {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      </div>
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="sm" loading={setMutation.isPending}>
          Guardar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={setMutation.isPending}
          onClick={onDone}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
