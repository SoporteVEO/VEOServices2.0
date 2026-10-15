"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Kanban, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCrmPipelines } from "@/api/crm/crm.get";
import {
  useDeleteCrmPipeline,
  useUpdateCrmPipeline,
} from "@/api/crm/crm.mutations";
import type { CrmPipeline } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { errorMessage } from "../crm-format";
import { CrmPipelineFormDialog } from "./crm-pipeline-form-dialog";

export function CrmPipelinesCard() {
  const { data: pipelines = [], isLoading } = useCrmPipelines(true);
  const updatePipeline = useUpdateCrmPipeline();
  const deletePipeline = useDeleteCrmPipeline();
  const [editing, setEditing] = useState<CrmPipeline | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CrmPipeline | null>(null);

  function openForm(pipeline: CrmPipeline | null) {
    setEditing(pipeline);
    setFormOpen(true);
  }

  function toggleArchive(pipeline: CrmPipeline) {
    updatePipeline.mutate(
      { id: pipeline.id, archived: !pipeline.archived },
      {
        onSuccess: () =>
          toast.success(pipeline.archived ? "Pipeline restaurado" : "Pipeline archivado"),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo actualizar el pipeline.")),
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deletePipeline.mutate(
      { id: pendingDelete.id },
      {
        onSuccess: ({ deleted }) => {
          toast.success(
            deleted ? "Pipeline eliminado" : "El pipeline tiene negocios; se archivó en su lugar",
          );
          setPendingDelete(null);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar el pipeline.")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Kanban className="size-4" />
          Pipelines
        </CardTitle>
        <CardDescription>
          Compartidos por todo el equipo de Ventas. Crea uno por línea de negocio si lo
          necesitas.
        </CardDescription>
        <CardAction>
          <Button sizeVariant="sm" icon={Plus} onClick={() => openForm(null)}>
            Nuevo pipeline
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : pipelines.map((pipeline) => {
              const open = pipeline.stages.reduce((sum, s) => sum + s.openDeals, 0);
              const value = pipeline.stages.reduce((sum, s) => sum + s.openValue, 0);
              return (
                <div
                  key={pipeline.id}
                  className={cn(
                    "flex flex-col gap-3 border border-border p-3",
                    pipeline.archived && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold">{pipeline.name}</h4>
                        {pipeline.isDefault ? (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="size-3" />
                            Principal
                          </Badge>
                        ) : null}
                        {pipeline.archived ? <Badge variant="outline">Archivado</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {open} negocios abiertos · {formatMoney(value)}
                        {pipeline.description ? ` · ${pipeline.description}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <PrimitiveButton
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Editar"
                        onClick={() => openForm(pipeline)}
                      >
                        <Pencil />
                      </PrimitiveButton>
                      {!pipeline.isDefault ? (
                        <>
                          <PrimitiveButton
                            variant="ghost"
                            size="icon-xs"
                            aria-label={pipeline.archived ? "Restaurar" : "Archivar"}
                            onClick={() => toggleArchive(pipeline)}
                          >
                            {pipeline.archived ? <ArchiveRestore /> : <Archive />}
                          </PrimitiveButton>
                          <PrimitiveButton
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Eliminar"
                            onClick={() => setPendingDelete(pipeline)}
                          >
                            <Trash2 />
                          </PrimitiveButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pipeline.stages.map((stage) => (
                      <span
                        key={stage.id}
                        className="flex items-center gap-1.5 border border-border px-2 py-0.5 text-[11px]"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: stage.color ?? undefined }}
                        />
                        {stage.name}
                        {stage.kind === "OPEN" ? (
                          <span className="text-muted-foreground">{stage.probability}%</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
      </CardContent>

      <CrmPipelineFormDialog open={formOpen} onOpenChange={setFormOpen} pipeline={editing} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar pipeline"
        description="Si tiene negocios se archivará en lugar de eliminarse."
        pending={deletePipeline.isPending}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
