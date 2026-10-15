"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MAX_PRODUCTION_ART_SIZE,
  PRODUCTION_ART_ACCEPT,
  PRODUCTION_ART_FORMATS_LABEL,
  validateProductionArt,
} from "./production-order-art-file";

type Props = {
  disabled?: boolean;
  label?: string;
  onFileSelected: (file: File) => void;
};

export function ProductionOrderArtDropzone({
  disabled,
  label = "Cargar arte",
  onFileSelected,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | null | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file || disabled) return;
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
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-background/60 px-3 py-4 text-center transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-60",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <ImageUp className="size-5 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">
          Arrastra el archivo o haz clic · {PRODUCTION_ART_FORMATS_LABEL} hasta{" "}
          {MAX_PRODUCTION_ART_SIZE / (1024 * 1024)}MB
        </span>
      </button>
    </>
  );
}
