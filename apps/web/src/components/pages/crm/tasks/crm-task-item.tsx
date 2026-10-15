"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import type { CrmTask } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_STYLES, TASK_TYPE_ICONS, TASK_TYPE_LABELS } from "../crm-const";
import { personName } from "../crm-format";

interface CrmTaskItemProps {
  task: CrmTask;
  busy?: boolean;
  showAssignee?: boolean;
  showDeal?: boolean;
  onToggle: (task: CrmTask, completed: boolean) => void;
  onEdit: (task: CrmTask) => void;
  onDelete: (task: CrmTask) => void;
  onOpenDeal?: (dealId: string) => void;
}

export function CrmTaskItem({
  task,
  busy = false,
  showAssignee = false,
  showDeal = true,
  onToggle,
  onEdit,
  onDelete,
  onOpenDeal,
}: CrmTaskItemProps) {
  const Icon = TASK_TYPE_ICONS[task.type];
  const done = task.completedAt !== null;

  return (
    <li className="group flex items-start gap-3 py-3">
      <Checkbox
        className="mt-0.5"
        checked={done}
        disabled={busy}
        aria-label={done ? "Marcar como pendiente" : "Completar tarea"}
        onCheckedChange={(checked) => onToggle(task, checked === true)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
          {task.priority === "HIGH" && !done ? (
            <Badge variant="outline" className={cn("h-5", PRIORITY_STYLES.HIGH)}>
              {PRIORITY_LABELS.HIGH}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon className="size-3" />
            {TASK_TYPE_LABELS[task.type]}
          </span>
          <span
            className={cn(
              "tabular-nums",
              task.isOverdue && "font-medium text-red-600 dark:text-red-400",
            )}
          >
            {format(new Date(task.dueAt), "EEE d MMM, HH:mm", { locale: es })}
          </span>
          {showDeal && task.deal ? (
            onOpenDeal ? (
              <button
                type="button"
                className="cursor-pointer truncate underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => onOpenDeal(task.deal!.id)}
              >
                {task.deal.title}
              </button>
            ) : (
              <span className="truncate">{task.deal.title}</span>
            )
          ) : null}
          {showAssignee ? <span>{personName(task.assignee)}</span> : null}
        </div>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
            {task.description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <PrimitiveButton
          variant="ghost"
          size="icon-xs"
          aria-label="Editar tarea"
          onClick={() => onEdit(task)}
        >
          <Pencil />
        </PrimitiveButton>
        <PrimitiveButton
          variant="ghost"
          size="icon-xs"
          aria-label="Eliminar tarea"
          onClick={() => onDelete(task)}
        >
          <Trash2 />
        </PrimitiveButton>
      </div>
    </li>
  );
}
