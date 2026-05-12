"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { TeamMember } from "@/api/team-members/team-members.types";
import { useDeleteTeamMember } from "@/api/team-members/team-members.mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteTeamMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember: TeamMember | null;
};

export function DeleteTeamMemberDialog({
  open,
  onOpenChange,
  teamMember,
}: DeleteTeamMemberDialogProps) {
  const deleteMutation = useDeleteTeamMember();

  function handleDelete() {
    if (!teamMember) return;
    deleteMutation.mutate(teamMember.id, {
      onSuccess: () => {
        toast.success("Miembro eliminado");
        onOpenChange(false);
      },
      onError: (err: Error) => toast.error(err.message || "Error al eliminar"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Eliminar miembro</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-medium text-foreground">
              {teamMember?.firstName} {teamMember?.lastName}
            </span>{" "}
            de la plantilla?
          </p>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            icon={deleteMutation.isPending ? Loader2 : undefined}
            iconClassName={
              deleteMutation.isPending ? "animate-spin" : undefined
            }
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
