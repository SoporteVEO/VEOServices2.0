"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAgentThreads } from "@/api/agent/agent.get";
import { useDeleteAgentThread } from "@/api/agent/agent.mutations";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AgentThreadListProps {
  activeId: string;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
}

export function AgentThreadList({
  activeId,
  onSelect,
  onDeleted,
}: AgentThreadListProps) {
  const { data: threads, isLoading, isError } = useAgentThreads();
  const deleteThread = useDeleteAgentThread();

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta conversación?")) return;
    deleteThread.mutate(id, {
      onSuccess: () => onDeleted(id),
      onError: () => toast.error("No se pudo eliminar la conversación."),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        No se pudo cargar el historial.
      </p>
    );
  }

  if (!threads?.length) {
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
        <MessageSquare className="size-6" />
        Aún no tienes conversaciones.
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {threads.map((thread) => (
        <li
          key={thread.id}
          className={cn(
            "group flex items-center gap-1 rounded-md hover:bg-accent",
            thread.id === activeId && "bg-accent",
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(thread.id)}
            className="min-w-0 flex-1 px-3 py-2 text-left"
          >
            <p className="truncate text-sm font-medium">{thread.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatShortDate(new Date(thread.updatedAt))}
            </p>
          </button>
          <Button
            variant="ghost"
            sizeVariant="sm"
            icon={Trash2}
            className="mr-1 border-0 opacity-0 shadow-none group-hover:opacity-100 focus-visible:opacity-100"
            disabled={deleteThread.isPending}
            onClick={() => handleDelete(thread.id)}
            aria-label="Eliminar conversación"
          />
        </li>
      ))}
    </ul>
  );
}
