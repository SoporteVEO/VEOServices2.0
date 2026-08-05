"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteProductionOrderDocument,
  useUploadProductionOrderDocument,
} from "@/api/production-orders/production-orders.patch";
import type { ProductionDocumentKind } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";
import { ProductionOrderDocumentPreviewButton } from "./production-order-document-preview";

const MAX_PDF_SIZE = 15 * 1024 * 1024;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

type Props = {
  itemId: string;
  kind: ProductionDocumentKind;
  title: string;
  hasDocument: boolean;
  readOnly?: boolean;
};

export function ProductionOrderDocumentSlot({
  itemId,
  kind,
  title,
  hasDocument,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadMutation = useUploadProductionOrderDocument();
  const deleteMutation = useDeleteProductionOrderDocument();

  async function handleFileSelected(file: File | null | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF.");
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      toast.error(
        `El archivo supera el tamaño máximo permitido (${MAX_PDF_SIZE / (1024 * 1024)}MB).`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBase64 = await fileToBase64(file);
      await uploadMutation.mutateAsync({ itemId, kind, pdfBase64 });
      toast.success("Documento cargado correctamente.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cargar el documento.",
      );
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el documento "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ itemId, kind });
      toast.success("Documento eliminado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el documento.",
      );
    }
  }

  const isBusy =
    isProcessing || uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-medium">{title}</p>
        {hasDocument ? (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Cargado
          </span>
        ) : (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Pendiente
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          void handleFileSelected(event.target.files?.[0]);
        }}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {hasDocument ? (
          <ProductionOrderDocumentPreviewButton
            itemId={itemId}
            kind={kind}
            label="Ver PDF"
          />
        ) : null}

        {readOnly ? null : (
          <>
            <Button
              type="button"
              variant={hasDocument ? "outline" : "default"}
              size="sm"
              className="gap-1.5"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {isProcessing || uploadMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-3.5" aria-hidden />
              )}
              {hasDocument ? "Reemplazar" : "Cargar PDF"}
            </Button>

            {hasDocument ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                disabled={isBusy}
                onClick={() => void handleDelete()}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-3.5" aria-hidden />
                )}
                Eliminar
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
