"use client";

import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { formatFileSize, isPdfFile, MAX_FILE_BYTES } from "./const";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export function fileProblem(file: File | null): string | null {
  if (!file) return null;
  if (!isPdfFile(file)) return "El archivo debe estar en formato PDF.";
  if (file.size > MAX_FILE_BYTES) {
    return `El PDF debe pesar menos de ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

export function FeatureRequestPdfField({ file, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const problem = fileProblem(file);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-semibold text-foreground/85">
        Formato llenado en PDF
        <span className="-ml-1 text-destructive">*</span>
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleSelect}
      />
      {file ? (
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
            onClick={() => onChange(null)}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          icon={Upload}
          className="h-auto justify-center border-dashed py-6"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Elegir el PDF del formato
        </Button>
      )}
      {problem ? <p className="text-xs text-destructive">{problem}</p> : null}
    </div>
  );
}
