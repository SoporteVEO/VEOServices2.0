"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCrmDeal, useCrmPipelines } from "@/api/crm/crm.get";
import {
  useChangeCrmDealStatus,
  useDeleteCrmDeal,
  useMoveCrmDeal,
} from "@/api/crm/crm.mutations";
import type { CrmDealDetail } from "@/api/crm/crm.types";
import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmDrawerPanel } from "../shared/crm-drawer-panel";
import { AGENT_NAME } from "@/lib/agent-brand";
import { formatMoney } from "@/lib/format";
import { CrmActivityComposer } from "../activity/crm-activity-composer";
import { CrmActivityTimeline } from "../activity/crm-activity-timeline";
import { DEAL_STATUS_LABELS, DEAL_STATUS_STYLES } from "../crm-const";
import { clientLabel, errorMessage } from "../crm-format";
import { dealProposalPrompt } from "../crm-nexo-prompts";
import { CrmMessageThread } from "../messages/crm-message-thread";
import { CrmDealFormDialog } from "../pipeline/crm-deal-form-dialog";
import { CrmLostReasonDialog } from "../pipeline/crm-lost-reason-dialog";
import { CrmUserAvatar } from "../shared/crm-user-avatar";
import { CrmTaskFormDialog } from "../tasks/crm-task-form-dialog";
import { CrmTaskList } from "../tasks/crm-task-list";
import { CrmDealExecutionTab } from "./crm-deal-execution-tab";
import { CrmDealInventoryTab } from "./crm-deal-inventory-tab";
import { CrmDealOffersTab } from "./crm-deal-offers-tab";
import { CrmDealStageBar } from "./crm-deal-stage-bar";
import { CrmDealSummaryTab } from "./crm-deal-summary-tab";

interface CrmDealDrawerProps {
  dealId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CrmDealDrawer({ dealId, onOpenChange }: CrmDealDrawerProps) {
  return (
    <Drawer
      open={dealId !== null}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent
        size="2xl"
        className="flex max-h-dvh data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[720px] data-[vaul-drawer-direction=right]:lg:max-w-[860px]"
      >
        {dealId ? (
          <DealDrawerBody
            key={dealId}
            dealId={dealId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DealDrawerBody({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const { data: deal, isLoading, isError } = useCrmDeal(dealId);

  if (isLoading) return <DealDrawerSkeleton onClose={onClose} />;
  if (isError || !deal) {
    return (
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DrawerTitle className="text-base">Negocio</DrawerTitle>
            <DrawerDescription className="text-xs">
              No se pudo cargar el negocio. Puede que haya sido eliminado.
            </DrawerDescription>
          </div>
          <CloseButton onClose={onClose} />
        </div>
      </DrawerHeader>
    );
  }
  return <DealDrawerContent deal={deal} onClose={onClose} />;
}

function DealDrawerContent({
  deal,
  onClose,
}: {
  deal: CrmDealDetail;
  onClose: () => void;
}) {
  const { data: pipelines = [] } = useCrmPipelines();
  const stages = pipelines.find((p) => p.id === deal.pipelineId)?.stages ?? [];
  const moveDeal = useMoveCrmDeal();
  const changeStatus = useChangeCrmDealStatus();
  const deleteDeal = useDeleteCrmDeal();

  const [editOpen, setEditOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const context = { dealId: deal.id };
  const busy = moveDeal.isPending || changeStatus.isPending;

  function handleMove(stageId: string) {
    moveDeal.mutate(
      { id: deal.id, stageId },
      {
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo mover el negocio.")),
      },
    );
  }

  function handleStatus(status: "WON" | "OPEN" | "LOST", lostReason?: string) {
    changeStatus.mutate(
      { id: deal.id, status, lostReason },
      {
        onSuccess: () => {
          setLostOpen(false);
          toast.success(
            status === "WON"
              ? "¡Negocio ganado! 🎉"
              : status === "LOST"
                ? "Negocio marcado como perdido"
                : "Negocio reabierto",
          );
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo actualizar el negocio.")),
      },
    );
  }

  function handleDelete() {
    deleteDeal.mutate(
      { id: deal.id },
      {
        onSuccess: () => {
          toast.success("Negocio eliminado");
          setDeleteOpen(false);
          onClose();
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar el negocio.")),
      },
    );
  }

  return (
    <>
      <DrawerHeader className="shrink-0 gap-4 border-b md:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DrawerTitle className="truncate text-base font-semibold">
                {deal.title}
              </DrawerTitle>
              <Badge variant="outline" className={DEAL_STATUS_STYLES[deal.status]}>
                {DEAL_STATUS_LABELS[deal.status]}
              </Badge>
            </div>
            <DrawerDescription className="flex flex-wrap items-center gap-x-2 text-xs">
              <span className="font-semibold text-foreground tabular-nums">
                {formatMoney(deal.value)}
              </span>
              {clientLabel(deal.client) ? <span>· {clientLabel(deal.client)}</span> : null}
              <span>· {deal.stage.name}</span>
            </DrawerDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <CrmUserAvatar user={deal.owner} size="default" />
            {deal.status === "OPEN" ? (
              <AskNexoButton
                sizeVariant="sm"
                label="Propuesta"
                hint={`${AGENT_NAME} investiga la marca y arma una propuesta con las vallas ideales`}
                prompt={dealProposalPrompt(deal)}
                onAsk={onClose}
              />
            ) : null}
            {deal.status === "OPEN" ? (
              <>
                <Button
                  sizeVariant="sm"
                  icon={Trophy}
                  className="bg-success text-background hover:bg-success/85 dark:hover:bg-success/85"
                  disabled={busy}
                  onClick={() => handleStatus("WON")}
                >
                  Ganado
                </Button>
                <Button
                  sizeVariant="sm"
                  variant="destructive"
                  icon={XCircle}
                  disabled={busy}
                  onClick={() => setLostOpen(true)}
                >
                  Perdido
                </Button>
              </>
            ) : (
              <Button
                sizeVariant="sm"
                variant="outline"
                icon={RotateCcw}
                disabled={busy}
                onClick={() => handleStatus("OPEN")}
              >
                Reabrir
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PrimitiveButton variant="ghost" size="icon-sm" aria-label="Más acciones">
                  <MoreHorizontal />
                </PrimitiveButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {stages.length > 0 ? (
          <CrmDealStageBar
            deal={deal}
            stages={stages}
            disabled={busy}
            onMove={handleMove}
          />
        ) : null}
      </DrawerHeader>

      <Tabs defaultValue="resumen" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="inventario">
            Sitios
            {deal.siteCount > 0 ? (
              <span className="ml-1.5 text-[10px] tabular-nums text-muted-foreground">
                {deal.siteCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="tareas">
            Tareas
            {deal.openTaskCount > 0 ? (
              <span className="ml-1.5 text-[10px] tabular-nums text-muted-foreground">
                {deal.openTaskCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
          <TabsTrigger value="cotizaciones">
            Cotizaciones
            {deal.offers.length > 0 ? (
              <span className="ml-1.5 text-[10px] tabular-nums text-muted-foreground">
                {deal.offers.length}
              </span>
            ) : null}
          </TabsTrigger>
          {deal.offers.length > 0 ? (
            <TabsTrigger value="ejecucion">Ejecución</TabsTrigger>
          ) : null}
        </TabsList>

        <CrmDrawerPanel value="resumen">
          <CrmDealSummaryTab deal={deal} />
        </CrmDrawerPanel>
        <CrmDrawerPanel value="inventario">
          <CrmDealInventoryTab deal={deal} />
        </CrmDrawerPanel>
        <CrmDrawerPanel value="actividad">
          <div className="flex flex-col gap-5 p-4">
            <CrmActivityComposer context={context} />
            <CrmActivityTimeline context={context} />
          </div>
        </CrmDrawerPanel>
        <CrmDrawerPanel value="tareas">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-end">
              <Button sizeVariant="sm" icon={Plus} onClick={() => setTaskOpen(true)}>
                Nueva tarea
              </Button>
            </div>
            <CrmTaskList
              query={{ ...context, assigneeId: "all", bucket: "open" }}
              emptyMessage="No hay tareas pendientes para este negocio."
              showAssignee
              showDeal={false}
            />
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Ver completadas
              </summary>
              <CrmTaskList
                query={{ ...context, assigneeId: "all", bucket: "completed" }}
                emptyMessage="Sin tareas completadas."
                showAssignee
                showDeal={false}
              />
            </details>
          </div>
        </CrmDrawerPanel>
        <CrmDrawerPanel value="mensajes">
          <div className="p-4">
            <CrmMessageThread
              context={context}
              recipient={{
                email: deal.contact?.email,
                whatsapp: deal.contact?.whatsapp ?? deal.contact?.phone,
              }}
            />
          </div>
        </CrmDrawerPanel>
        <CrmDrawerPanel value="cotizaciones">
          <CrmDealOffersTab deal={deal} />
        </CrmDrawerPanel>
        {deal.offers.length > 0 ? (
          <CrmDrawerPanel value="ejecucion">
            <CrmDealExecutionTab dealId={deal.id} />
          </CrmDrawerPanel>
        ) : null}
      </Tabs>

      <CrmDealFormDialog open={editOpen} onOpenChange={setEditOpen} deal={deal} />
      <CrmTaskFormDialog open={taskOpen} onOpenChange={setTaskOpen} context={context} />
      <CrmLostReasonDialog
        open={lostOpen}
        onOpenChange={setLostOpen}
        dealTitle={deal.title}
        pending={changeStatus.isPending}
        onConfirm={(reason) => handleStatus("LOST", reason)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar negocio"
        description={`Se eliminará "${deal.title}" junto con sus tareas y actividades. Los mensajes enviados se conservan en el historial del cliente.`}
        pending={deleteDeal.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <PrimitiveButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
      <X />
    </PrimitiveButton>
  );
}

function DealDrawerSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader className="shrink-0 gap-4 border-b md:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <Skeleton className="h-7 w-full" />
      </DrawerHeader>
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </>
  );
}
