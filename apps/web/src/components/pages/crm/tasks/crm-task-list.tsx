"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCrmTasks } from "@/api/crm/crm.get";
import { useDeleteCrmTask, useUpdateCrmTask } from "@/api/crm/crm.mutations";
import type { CrmTask, CrmTasksQuery } from "@/api/crm/crm.types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { errorMessage } from "../crm-format";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";
import { CrmTaskFormDialog } from "./crm-task-form-dialog";
import { CrmTaskItem } from "./crm-task-item";

interface CrmTaskListProps {
  query: CrmTasksQuery;
  emptyMessage?: string;
  showAssignee?: boolean;
  showDeal?: boolean;
  onOpenDeal?: (dealId: string) => void;
}

export function CrmTaskList({
  query,
  emptyMessage = "No hay tareas.",
  showAssignee = false,
  showDeal = true,
  onOpenDeal,
}: CrmTaskListProps) {
  const { data: tasks = [], isLoading } = useCrmTasks(query);
  const updateTask = useUpdateCrmTask();
  const deleteTask = useDeleteCrmTask();
  const [editing, setEditing] = useState<CrmTask | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CrmTask | null>(null);

  function handleToggle(task: CrmTask, completed: boolean) {
    updateTask.mutate(
      { id: task.id, completed },
      {
        onSuccess: () =>
          toast.success(completed ? "Tarea completada" : "Tarea reabierta"),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo actualizar la tarea.")),
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteTask.mutate(
      { id: pendingDelete.id },
      {
        onSuccess: () => {
          toast.success("Tarea eliminada");
          setPendingDelete(null);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar la tarea.")),
      },
    );
  }

  if (isLoading) return <ListSkeleton rows={4} />;
  if (tasks.length === 0) return <EmptyList message={emptyMessage} />;

  return (
    <>
      <ul className="flex flex-col divide-y">
        {tasks.map((task) => (
          <CrmTaskItem
            key={task.id}
            task={task}
            busy={updateTask.isPending && updateTask.variables?.id === task.id}
            showAssignee={showAssignee}
            showDeal={showDeal}
            onToggle={handleToggle}
            onEdit={setEditing}
            onDelete={setPendingDelete}
            onOpenDeal={onOpenDeal}
          />
        ))}
      </ul>

      <CrmTaskFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        task={editing}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar tarea"
        description={pendingDelete ? `Se eliminará "${pendingDelete.title}".` : undefined}
        pending={deleteTask.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
