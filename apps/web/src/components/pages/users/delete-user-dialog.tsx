"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { User } from "@/api/users/users.types";
import { useDeleteUser } from "@/api/users/users.mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onDeleted?: () => void;
};

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onDeleted,
}: DeleteUserDialogProps) {
  const deleteMutation = useDeleteUser();

  function handleDelete() {
    if (!user) return;
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success("Usuario eliminado");
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (err: Error) => toast.error(err.message || "Error al eliminar"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </span>{" "}
            ({user?.email})?
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
