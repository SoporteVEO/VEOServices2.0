"use client";

import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import {
  ATTACHMENT_ACCEPT,
  attachmentExtension,
  MAX_ATTACHMENTS,
} from "@/api/feature-requests/feature-requests.const";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { formatFileSize, MAX_FILE_BYTES } from "./const";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  max?: number;
};

export function attachmentProblem(file: File): string | null {
  if (!attachmentExtension(file.name)) {
    return "Solo se admiten archivos PDF, Excel o PowerPoint.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return `Debe pesar menos de ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

export function attachmentsProblem(files: File[]): string | null {
  return files.map(attachmentProblem).find(Boolean) ?? null;
}

export function FeatureRequestAttachmentsField({
  files,
  onChange,
  disabled,
  max = MAX_ATTACHMENTS,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = files.length >= max;

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    onChange([...files, ...selected].slice(0, max));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-semibold text-foreground/85">
        Archivos adicionales (opcional)
      </Label>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={handleSelect}
      />
      {files.map((file, index) => {
        const problem = attachmentProblem(file);
        return (
          <div key={`${file.name}-${index}`} className="flex flex-col gap-1">
            <div className="flex items-center gap-3 border border-border bg-card p-3">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                sizeVariant="sm"
                icon={X}
                aria-label="Quitar archivo"
                disabled={disabled}
                onClick={() =>
                  onChange(files.filter((_, current) => current !== index))
                }
              />
            </div>
            {problem ? (
              <p className="text-xs text-destructive">{problem}</p>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        icon={Paperclip}
        className="justify-center border-dashed"
        disabled={disabled || isFull}
        onClick={() => inputRef.current?.click()}
      >
        {isFull
          ? `Máximo ${MAX_ATTACHMENTS} archivos`
          : "Agregar PDF, Excel o PowerPoint"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Hasta {MAX_ATTACHMENTS} archivos de {MAX_FILE_BYTES / (1024 * 1024)} MB
        como material de apoyo.
      </p>
    </div>
  );
}
