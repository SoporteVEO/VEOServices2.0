"use client";

import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { getFeatureRequestAttachmentUrl } from "@/api/feature-requests/feature-requests.get";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "./const";

type Props = {
  requestId: string;
  attachment: { fileName: string; fileSize: number };
};

type Action = "view" | "download";

export function FeatureRequestFileCard({ requestId, attachment }: Props) {
  const [pending, setPending] = useState<Action | null>(null);

  async function handle(action: Action) {
    // Opened before the request so popup blockers see a direct click.
    const tab = action === "view" ? window.open("", "_blank") : null;
    setPending(action);
    try {
      const url = await getFeatureRequestAttachmentUrl(
        requestId,
        action === "download",
      );
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.fileName;
        link.click();
      }
    } catch (error) {
      tab?.close();
      toast.error(
        error instanceof Error ? error.message : "No se pudo abrir el archivo",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-3">
      <div className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
        <FileText className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-xs text-muted-foreground">
          PDF · {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={Eye}
          loading={pending === "view"}
          onClick={() => handle("view")}
        >
          Ver
        </Button>
        <Button
          sizeVariant="sm"
          icon={Download}
          loading={pending === "download"}
          onClick={() => handle("download")}
        >
          Descargar
        </Button>
      </div>
    </div>
  );
}
