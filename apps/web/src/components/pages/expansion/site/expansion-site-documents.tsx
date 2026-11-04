"use client";

import { useRef, useState } from "react";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { getExpansionDocumentUrl } from "@/api/expansion/expansion.get";
import {
  useDeleteExpansionDocument,
  useUploadExpansionDocument,
} from "@/api/expansion/expansion.mutations";
import type { ExpansionSiteDocument } from "@/api/expansion/expansion.types";
import { personName } from "@/components/pages/crm/crm-format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatBriloShortDate } from "@/lib/format";
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES, resolveDocumentMime } from "../expansion-const";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExpansionSiteDocuments({
  siteId,
  documents,
}: {
  siteId: string;
  documents: ExpansionSiteDocument[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ExpansionSiteDocument | null>(null);
  const upload = useUploadExpansionDocument(siteId);
  const remove = useDeleteExpansionDocument();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploadingCount(list.length);
    for (const file of list) {
      const mimeType = resolveDocumentMime(file);
      if (!mimeType) {
        toast.error(`${file.name}: tipo de archivo no permitido.`);
      } else if (file.size > MAX_DOCUMENT_BYTES) {
        toast.error(`${file.name}: supera el límite de 25 MB.`);
      } else {
        try {
          await upload.mutateAsync({ file, mimeType });
          toast.success(`${file.name} subido.`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `No se pudo subir ${file.name}.`);
        }
      }
      setUploadingCount((count) => count - 1);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function openDocument(document: ExpansionSiteDocument, download: boolean) {
    const popup = download ? null : window.open("", "_blank");
    try {
      const url = await getExpansionDocumentUrl(document.id, download);
      if (popup) popup.location.href = url;
      else window.location.assign(url);
    } catch (error) {
      popup?.close();
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Documento eliminado.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFiles(event.dataTransfer.files);
        }}
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center"
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm">Arrastra archivos aquí o</p>
        <Button
          variant="outline"
          sizeVariant="sm"
          loading={uploadingCount > 0}
          onClick={() => inputRef.current?.click()}
        >
          {uploadingCount > 0 ? `Subiendo ${uploadingCount}...` : "Seleccionar archivos"}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          PDF, imágenes, Office, CSV, KML/KMZ · máx. 25 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {documents.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">
          Sin documentos. Sube permisos, cotizaciones, fotos del sitio o planos.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 px-3 py-2">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{document.fileName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatSize(document.fileSize)} · {formatBriloShortDate(document.createdAt)}
                  {document.uploadedBy ? ` · ${personName(document.uploadedBy)}` : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="w-8 px-0"
                aria-label="Ver"
                onClick={() => openDocument(document, false)}
              >
                <Eye className="size-4" />
              </Button>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="w-8 px-0"
                aria-label="Descargar"
                onClick={() => openDocument(document, true)}
              >
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="w-8 px-0 text-destructive"
                aria-label="Eliminar"
                onClick={() => setPendingDelete(document)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar documento"
        description={`Se eliminará "${pendingDelete?.fileName ?? ""}" de forma permanente.`}
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
