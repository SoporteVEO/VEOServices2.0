"use client";

import { Flame, GripVertical, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import type { PrintBacklogItem } from "@/api/printing/printing.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  COLOR_TEST_LABEL,
  COLOR_TEST_SWATCH,
  formatArea,
  formatDay,
  formatMinutes,
  formatSize,
} from "./printing-calendar-utils";

type Props = {
  items: PrintBacklogItem[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  draggingItemId: string | null;
  onDragStart: (item: PrintBacklogItem) => void;
  onDragEnd: () => void;
  onDeleteColorTest: (item: PrintBacklogItem) => void;
};

export function PrintingBacklogPanel({
  items,
  isLoading,
  search,
  onSearchChange,
  draggingItemId,
  onDragStart,
  onDragEnd,
  onDeleteColorTest,
}: Props) {
  return (
    <div className="flex min-h-0 w-full flex-col gap-3 rounded-xl border bg-card p-3 @5xl/main:w-72">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Sin agendar</h3>
        <p className="text-xs text-muted-foreground">
          Arrastra una valla o prueba de color a una máquina para reservar su
          tiempo de impresión.
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
              onDeleteColorTest={onDeleteColorTest}
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
  onDeleteColorTest,
}: {
  item: PrintBacklogItem;
  isDragging: boolean;
  onDragStart: (item: PrintBacklogItem) => void;
  onDragEnd: () => void;
  onDeleteColorTest: (item: PrintBacklogItem) => void;
}) {
  const isColorTest = item.kind === "COLOR_TEST";

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
        isColorTest && "border-fuchsia-300 dark:border-fuchsia-800",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isColorTest ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-400">
            <span
              className={cn("size-2 rounded-sm", COLOR_TEST_SWATCH)}
              aria-hidden
            />
            {COLOR_TEST_LABEL}
          </span>
        ) : null}
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
        {isColorTest ? (
          <>
            <span className="text-[11px] font-medium text-fuchsia-700 dark:text-fuchsia-400">
              {formatMinutes(item.durationMinutes)}
            </span>
            {item.notes ? (
              <span className="line-clamp-2 text-[11px] text-muted-foreground">
                {item.notes}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400">
            {formatArea(item.areaM2)} m²
          </span>
        )}
        {!isColorTest && item.pendingReschedule ? (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              item.pendingReschedule.isUrgent
                ? "text-red-700 dark:text-red-400"
                : "text-violet-700 dark:text-violet-400",
            )}
          >
            <Flame className="size-3 shrink-0" aria-hidden />
            {item.pendingReschedule.isUrgent ? "Prioridad" : "Reprogramación"}
            {item.pendingReschedule.preferredDate
              ? ` · ${formatDay(item.pendingReschedule.preferredDate)}`
              : ""}
          </span>
        ) : null}
      </div>
      {isColorTest ? (
        <Button
          variant="ghost"
          icon={Trash2}
          aria-label="Eliminar prueba de color"
          className="size-7 shrink-0 px-0 text-muted-foreground hover:text-destructive"
          iconClassName="size-3.5"
          onClick={() => onDeleteColorTest(item)}
        />
      ) : null}
    </div>
  );
}
