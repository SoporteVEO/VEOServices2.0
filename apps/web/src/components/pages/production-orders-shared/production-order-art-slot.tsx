"use client";

import { useRef, useState } from "react";
import { ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteProductionOrderArt,
  useUploadProductionOrderArt,
} from "@/api/production-orders/production-orders.patch";
import type { ProductionOrderItem } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductionOrderArtDropzone } from "./production-order-art-dropzone";
import { ProductionOrderArtLink } from "./production-order-art-link";
import {
  PRODUCTION_ART_ACCEPT,
  validateProductionArt,
} from "./production-order-art-file";
import { ProductionOrderArtPreview } from "./production-order-art-preview";

type Props = {
  item: ProductionOrderItem;
  readOnly?: boolean;
  emptyReadOnlyHint?: string;
};

export function ProductionOrderArtSlot({
  item,
  readOnly = false,
  emptyReadOnlyHint = "Aún no se ha cargado el arte.",
}: Props) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const uploadMutation = useUploadProductionOrderArt();
  const deleteMutation = useDeleteProductionOrderArt();
  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  async function handleUpload(file: File) {
    try {
      await uploadMutation.mutateAsync({ itemId: item.id, file });
      toast.success("Arte cargado correctamente.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cargar el arte.",
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success("Arte eliminado.");
      setConfirmDeleteOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el arte.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-medium">Arte</p>
        {item.art || item.artLinkUrl ? (
          <span className="bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Cargado
          </span>
        ) : (
          <span className="bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Pendiente
          </span>
        )}
      </div>

      {item.art ? (
        <ProductionOrderArtPreview
          itemId={item.id}
          billboardCode={item.billboardCode}
          art={item.art}
          actions={
            readOnly ? null : (
              <>
                <ReplaceArtButton
                  disabled={isBusy}
                  loading={uploadMutation.isPending}
                  onFileSelected={(file) => void handleUpload(file)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={isBusy}
                  loading={deleteMutation.isPending}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Eliminar
                </Button>
              </>
            )
          }
        />
      ) : readOnly ? (
        item.artLinkUrl ? null : (
          <p className="text-[11px] text-muted-foreground">{emptyReadOnlyHint}</p>
        )
      ) : uploadMutation.isPending ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          Subiendo arte…
        </p>
      ) : (
        <ProductionOrderArtDropzone
          disabled={isBusy}
          onFileSelected={(file) => void handleUpload(file)}
        />
      )}

      <ProductionOrderArtLink
        itemId={item.id}
        url={item.artLinkUrl}
        readOnly={readOnly}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar el arte de esta valla?"
        description="El archivo se eliminará de la orden de producción."
        pending={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

function ReplaceArtButton({
  disabled,
  loading,
  onFileSelected,
}: {
  disabled: boolean;
  loading: boolean;
  onFileSelected: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const validationError = validateProductionArt(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    onFileSelected(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCTION_ART_ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Reemplazar
      </Button>
    </>
  );
}
