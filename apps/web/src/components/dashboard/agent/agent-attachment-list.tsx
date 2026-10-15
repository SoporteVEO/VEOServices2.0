"use client";

import type { FileUIPart } from "ai";
import { FileSpreadsheet, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

function FileIcon({ part }: { part: FileUIPart }) {
  const Icon = part.mediaType === "text/csv" ? FileSpreadsheet : FileText;
  return <Icon className="size-4 shrink-0 text-muted-foreground" />;
}

export function AgentAttachmentList({
  files,
  onRemove,
  className,
}: {
  files: FileUIPart[];
  onRemove?: (index: number) => void;
  className?: string;
}) {
  if (files.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {files.map((file, index) => (
        <li
          key={`${file.filename}-${index}`}
          className="group relative flex h-12 max-w-48 items-center gap-2 border border-border bg-muted/50 pe-2 text-xs"
        >
          {file.mediaType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.filename ?? "Imagen adjunta"}
              className="size-12 shrink-0 object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center bg-card">
              <FileIcon part={file} />
            </span>
          )}
          <span className="truncate" title={file.filename}>
            {file.filename ?? file.mediaType}
          </span>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Quitar ${file.filename ?? "archivo"}`}
              className="absolute -end-1.5 -top-1.5 flex size-4 cursor-pointer items-center justify-center bg-foreground text-background opacity-80 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
