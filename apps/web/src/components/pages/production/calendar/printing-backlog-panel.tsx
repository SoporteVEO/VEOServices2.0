"use client";

import { GripVertical } from "lucide-react";
import type { DragEvent } from "react";
import type { PrintBacklogItem } from "@/api/printing/printing.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatArea, formatSize } from "./printing-calendar-utils";

type Props = {
  items: PrintBacklogItem[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  draggingItemId: string | null;
  onDragStart: (item: PrintBacklogItem) => void;
  onDragEnd: () => void;
};

export function PrintingBacklogPanel({
  items,
  isLoading,
  search,
  onSearchChange,
  draggingItemId,
  onDragStart,
  onDragEnd,
}: Props) {
  return (
    <div className="flex min-h-0 w-full flex-col gap-3 rounded-xl border bg-card p-3 lg:w-72">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Sin agendar</h3>
        <p className="text-xs text-muted-foreground">
          Arrastra una valla a una máquina para reservar su tiempo de impresión.
        </p>
      </div>

      <Input
        isSearch
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar valla o cotización..."
        className="h-8 text-xs"
      />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {search
              ? "Ninguna valla coincide con la búsqueda."
              : "Todas las vallas están agendadas."}
          </p>
        ) : (
          items.map((item) => (
            <BacklogCard
              key={item.id}
              item={item}
              isDragging={draggingItemId === item.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BacklogCard({
  item,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  item: PrintBacklogItem;
  isDragging: boolean;
  onDragStart: (item: PrintBacklogItem) => void;
  onDragEnd: () => void;
}) {
  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    onDragStart(item);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "flex cursor-grab gap-2 rounded-lg border bg-background p-2.5 shadow-sm transition active:cursor-grabbing",
        "hover:border-primary/50 hover:shadow",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs font-semibold">
          {item.billboardCode ?? "Sin código"}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {item.customerCompany ?? item.customerName}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {item.offerNumber} · {formatSize(item.width, item.height)}
          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </span>
        <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400">
          {formatArea(item.areaM2)} m²
        </span>
      </div>
    </div>
  );
}
