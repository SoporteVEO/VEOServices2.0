"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export interface MultiImageUploaderProps {
  /** Currently selected files. */
  value: File[];
  /** Called whenever the selection changes. */
  onChange: (files: File[]) => void;
  /** Maximum number of files allowed. Defaults to `10`. */
  maxFiles?: number;
  /** Maximum size per file in bytes. Defaults to `25MB`. */
  maxSize?: number;
  /** Allowed mime types. */
  acceptedFileTypes?: readonly string[];
  /** Optional label rendered above the dropzone. */
  label?: React.ReactNode;
  /** Optional helper hint under the dropzone. */
  hint?: React.ReactNode;
  className?: string;
  /** Disable interactions (e.g. while submitting). */
  disabled?: boolean;
}

function formatMb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function MultiImageUploader({
  value,
  onChange,
  maxFiles = 10,
  maxSize = 25 * 1024 * 1024,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  label,
  hint,
  className,
  disabled = false,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const urlMapRef = useRef<Map<File, string>>(new Map());

  const previewUrls = useMemo(() => {
    const next = new Map<File, string>();
    for (const file of value) {
      next.set(file, urlMapRef.current.get(file) ?? URL.createObjectURL(file));
    }
    for (const [file, url] of urlMapRef.current) {
      if (!next.has(file)) URL.revokeObjectURL(url);
    }
    urlMapRef.current = next;
    return value.map((file) => ({ file, previewUrl: next.get(file) ?? "" }));
  }, [value]);

  useEffect(() => {
    return () => {
      urlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlMapRef.current.clear();
    };
  }, []);

  const acceptAttribute = useMemo(
    () => acceptedFileTypes.join(","),
    [acceptedFileTypes],
  );

  const handleFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (disabled || !incoming) return;
      setError(null);

      const next: File[] = [...value];
      let lastError: string | null = null;

      for (const file of Array.from(incoming)) {
        if (!acceptedFileTypes.includes(file.type)) {
          lastError = `Tipo no permitido: ${file.name}`;
          continue;
        }
        if (file.size > maxSize) {
          lastError = `${file.name} supera el tamaño máximo de ${formatMb(maxSize)}`;
          continue;
        }
        if (next.length >= maxFiles) {
          lastError = `Solo puedes subir hasta ${maxFiles} imágenes`;
          break;
        }
        next.push(file);
      }

      if (lastError) setError(lastError);

      if (next.length !== value.length) {
        onChange(next);
      }
    },
    [acceptedFileTypes, disabled, maxFiles, maxSize, onChange, value],
  );

  function removeAt(index: number) {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== index));
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const canAddMore = value.length < maxFiles;
  const remaining = maxFiles - value.length;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={value.length === 0 ? openPicker : undefined}
        onKeyDown={(e) => {
          if (value.length === 0 && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border-2 border-dashed bg-accent/30 p-3 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-accent/50",
          value.length === 0 && !disabled && "cursor-pointer",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="hidden"
          accept={acceptAttribute}
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
          disabled={disabled}
        />

        {value.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground/80">
              Hasta {maxFiles} archivos · {formatMb(maxSize)} máx.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {previewUrls.map(({ file, previewUrl }, index) => (
              <div
                key={previewUrl}
                className="group relative size-20 overflow-hidden rounded-md border bg-background"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Eliminar ${file.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                  className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 ring-1 ring-border transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={disabled}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {canAddMore ? (
              <button
                type="button"
                onClick={openPicker}
                aria-label="Agregar más imágenes"
                className="inline-flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                disabled={disabled}
              >
                <ImagePlus className="size-5" />
                <span className="text-[10px]">Agregar</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {value.length > 0 && canAddMore ? (
        <p className="text-xs text-muted-foreground">
          Puedes agregar {remaining} {remaining === 1 ? "imagen" : "imágenes"}{" "}
          más.
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
