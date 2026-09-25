"use client";

import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { validateProductionPdf } from "@/components/pages/production-orders-shared/production-order-pdf";

type Props = {
  title: string;
  file: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

/**
 * Local counterpart of `ProductionOrderDocumentSlot` for an order that does
 * not exist yet: the PDF is held in memory and uploaded after creation.
 */
export function PendingDocumentInput({ title, file, disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(selected: File | null | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!selected) return;
    const validationError = validateProductionPdf(selected);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    onChange(selected);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-medium">{title}</p>
        {file ? (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Listo
          </span>
        ) : (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Opcional
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => handleFileSelected(event.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-center gap-1.5">
          <p
            className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground"
            title={file.name}
          >
            {file.name}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" aria-hidden />
            Quitar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3.5" aria-hidden />
          Cargar PDF
        </Button>
      )}
    </div>
  );
}
