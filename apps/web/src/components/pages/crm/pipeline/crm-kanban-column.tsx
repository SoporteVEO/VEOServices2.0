"use client";

import { Plus } from "lucide-react";
import type { CrmDeal, CrmStage } from "@/api/crm/crm.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CrmDealCard } from "./crm-deal-card";

export interface DropTarget {
  stageId: string;
  beforeDealId: string | null;
}

interface CrmKanbanColumnProps {
  stage: CrmStage;
  deals: CrmDeal[];
  draggingId: string | null;
  dropTarget: DropTarget | null;
  onOpenDeal: (dealId: string) => void;
  onAddDeal?: (stageId: string) => void;
  onDragStart: (deal: CrmDeal) => void;
  onDragEnd: () => void;
  onDragOver: (target: DropTarget) => void;
  onDrop: () => void;
}

export function CrmKanbanColumn({
  stage,
  deals,
  draggingId,
  dropTarget,
  onOpenDeal,
  onAddDeal,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CrmKanbanColumnProps) {
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);
  const isTarget = dropTarget?.stageId === stage.id;
  const closed = stage.kind !== "OPEN";

  function handleCardOver(deal: CrmDeal, placeAfter: boolean) {
    if (!placeAfter) {
      onDragOver({ stageId: stage.id, beforeDealId: deal.id });
      return;
    }
    const index = deals.findIndex((d) => d.id === deal.id);
    onDragOver({ stageId: stage.id, beforeDealId: deals[index + 1]?.id ?? null });
  }

  return (
    <section
      aria-label={stage.name}
      onDragOver={(e) => {
        if (!draggingId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isTarget) onDragOver({ stageId: stage.id, beforeDealId: null });
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col border border-border bg-muted/30 transition-colors",
        isTarget && "border-veo-dark/40 bg-veo-ice/40 dark:border-veo-lime/40 dark:bg-veo-dark-80/40",
      )}
    >
      <header
        className="flex flex-col gap-1 border-t-[3px] bg-card px-3 py-2.5"
        style={{ borderTopColor: stage.color ?? undefined }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{stage.name}</h3>
          <div className="flex items-center gap-1">
            <span className="rounded-sm bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
              {deals.length}
            </span>
            {onAddDeal && !closed ? (
              <PrimitiveButton
                variant="ghost"
                size="icon-xs"
                aria-label={`Agregar negocio en ${stage.name}`}
                onClick={() => onAddDeal(stage.id)}
              >
                <Plus />
              </PrimitiveButton>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatMoney(total)}
          {closed ? " · últimos 30 días" : ` · ${stage.probability}%`}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {deals.map((deal) => (
          <div key={deal.id} className="flex flex-col gap-2">
            {isTarget && dropTarget?.beforeDealId === deal.id ? <DropIndicator /> : null}
            <CrmDealCard
              deal={deal}
              dragging={draggingId === deal.id}
              onOpen={onOpenDeal}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverCard={handleCardOver}
            />
          </div>
        ))}
        {isTarget && dropTarget?.beforeDealId === null ? <DropIndicator /> : null}
        {deals.length === 0 && !isTarget ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {closed ? "Sin negocios recientes" : "Arrastra negocios aquí"}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function DropIndicator() {
  return <div className="h-1 shrink-0 rounded-full bg-veo-lime" />;
}
