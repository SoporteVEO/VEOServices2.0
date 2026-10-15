"use client";

import { useCrmEmailRender } from "@/api/crm/crm.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { errorMessage } from "../crm-format";

interface Props {
  subject: string;
  body: string;
}

/** Renders the exact HTML the API sends, signature included. */
export function CrmEmailPreviewFrame({ subject, body }: Props) {
  const debouncedBody = useDebouncedValue(body, 500);
  const { data: html, error, isError, isFetching } = useCrmEmailRender(debouncedBody);
  const outdated = isFetching || debouncedBody !== body;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="border border-border bg-card px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Asunto</p>
        <p className="truncate text-sm font-medium">{subject || "Sin asunto"}</p>
      </div>
      <div className="relative min-h-[28rem] flex-1 overflow-hidden border border-border bg-white">
        {isError ? (
          <p className="p-4 text-sm text-destructive">
            {errorMessage(error, "No se pudo generar la vista previa.")}
          </p>
        ) : html ? (
          <iframe
            title="Vista previa del correo"
            sandbox=""
            srcDoc={html}
            className={cn("size-full transition-opacity", outdated && "opacity-60")}
          />
        ) : (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
    </div>
  );
}
