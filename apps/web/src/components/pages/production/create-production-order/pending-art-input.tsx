"use client";

import { ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductionOrderArtDropzone } from "@/components/pages/production-orders-shared/production-order-art-dropzone";
import {
  artFormatLabel,
  formatArtFileSize,
} from "@/components/pages/production-orders-shared/production-order-art-file";

type Props = {
  file: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

/**
 * Local counterpart of `ProductionOrderArtSlot` for an order that does not
 * exist yet: the file is held in memory and uploaded after creation.
 */
export function PendingArtInput({ file, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-medium">Arte</p>
        {file ? (
          <span className="bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Listo
          </span>
        ) : (
          <span className="bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Opcional
          </span>
        )}
      </div>

      {file ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-[11px] font-medium" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {artFormatLabel(file.type)}
              </Badge>
              <span>{formatArtFileSize(file.size)}</span>
            </div>
          </div>
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
        <ProductionOrderArtDropzone disabled={disabled} onFileSelected={onChange} />
      )}
    </div>
  );
}
