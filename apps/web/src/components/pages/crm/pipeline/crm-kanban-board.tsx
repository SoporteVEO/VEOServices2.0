"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMoveCrmDeal } from "@/api/crm/crm.mutations";
import type { CrmBoard, CrmDeal } from "@/api/crm/crm.types";
import { errorMessage } from "../crm-format";
import { CrmKanbanColumn, type DropTarget } from "./crm-kanban-column";
import { CrmLostReasonDialog } from "./crm-lost-reason-dialog";

interface CrmKanbanBoardProps {
  board: CrmBoard;
  onOpenDeal: (dealId: string) => void;
  onAddDeal: (stageId: string) => void;
}

interface PendingMove {
  deal: CrmDeal;
  target: DropTarget;
}

export function CrmKanbanBoard({ board, onOpenDeal, onAddDeal }: CrmKanbanBoardProps) {
  const moveDeal = useMoveCrmDeal();
  const [dragging, setDragging] = useState<CrmDeal | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingMove | null>(null);

  const columns = useMemo(() => {
    const byStage = new Map<string, CrmDeal[]>();
    for (const deal of board.deals) {
      const list = byStage.get(deal.stage.id) ?? [];
      list.push(deal);
      byStage.set(deal.stage.id, list);
    }
    for (const list of byStage.values()) list.sort((a, b) => a.position - b.position);
    return board.pipeline.stages.map((stage) => ({
      stage,
      deals: byStage.get(stage.id) ?? [],
    }));
  }, [board]);

  function resetDrag() {
    setDragging(null);
    setDropTarget(null);
  }

  function isNoOp(deal: CrmDeal, target: DropTarget): boolean {
    if (target.beforeDealId === deal.id) return true;
    if (target.stageId !== deal.stage.id) return false;
    const column = columns.find((c) => c.stage.id === target.stageId)?.deals ?? [];
    const index = column.findIndex((d) => d.id === deal.id);
    return (column[index + 1]?.id ?? null) === target.beforeDealId;
  }

  function commitMove(deal: CrmDeal, target: DropTarget, lostReason?: string) {
    moveDeal.mutate(
      {
        id: deal.id,
        stageId: target.stageId,
        beforeDealId: target.beforeDealId,
        lostReason,
      },
      {
        onSuccess: (saved) => {
          setPendingLost(null);
          if (saved.status === "WON" && deal.status !== "WON") {
            toast.success(`¡${saved.title} ganado! 🎉`);
          }
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo mover el negocio.")),
      },
    );
  }

  function handleDrop() {
    const deal = dragging;
    const target = dropTarget;
    resetDrag();
    if (!deal || !target || isNoOp(deal, target)) return;

    const stage = board.pipeline.stages.find((s) => s.id === target.stageId);
    if (stage?.kind === "LOST" && deal.stage.id !== stage.id) {
      setPendingLost({ deal, target });
      return;
    }
    commitMove(deal, target);
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map(({ stage, deals }) => (
          <CrmKanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals}
            draggingId={dragging?.id ?? null}
            dropTarget={dropTarget}
            onOpenDeal={onOpenDeal}
            onAddDeal={onAddDeal}
            onDragStart={setDragging}
            onDragEnd={resetDrag}
            onDragOver={(target) => {
              if (
                dropTarget?.stageId !== target.stageId ||
                dropTarget.beforeDealId !== target.beforeDealId
              ) {
                setDropTarget(target);
              }
            }}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <CrmLostReasonDialog
        open={pendingLost !== null}
        onOpenChange={(open) => {
          if (!open) setPendingLost(null);
        }}
        dealTitle={pendingLost?.deal.title}
        pending={moveDeal.isPending}
        onConfirm={(reason) => {
          if (pendingLost) commitMove(pendingLost.deal, pendingLost.target, reason);
        }}
      />
    </>
  );
}
