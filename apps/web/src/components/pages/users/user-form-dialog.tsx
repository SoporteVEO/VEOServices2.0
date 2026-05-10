"use client";

import { toast } from "sonner";
import type { User } from "@/api/users/users.types";
import { useCreateUser, useUpdateUser } from "@/api/users/users.mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserForm, type UserFormValues } from "./user-form";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: UserFormValues) {
    if (isEdit && user) {
      updateMutation.mutate(
        {
          id: user.id,
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          email: values.email,
          role: values.role,
          subRoles: values.subRoles,
          ...(values.password ? { password: values.password } : {}),
        },
        {
          onSuccess: () => {
            toast.success("Usuario actualizado");
            onOpenChange(false);
          },
          onError: (err: Error) =>
            toast.error(err.message || "Error al actualizar"),
        },
      );
    } else {
      createMutation.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          email: values.email,
          password: values.password,
          role: values.role,
          subRoles: values.subRoles,
        },
        {
          onSuccess: () => {
            toast.success("Usuario creado");
            onOpenChange(false);
          },
          onError: (err: Error) =>
            toast.error(err.message || "Error al crear usuario"),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
        </DialogHeader>

        <UserForm
          key={user?.id}
          isEdit={isEdit}
          isPending={isPending}
          defaultValues={
            user
              ? {
                  firstName: user.firstName,
                  lastName: user.lastName ?? "",
                  email: user.email,
                  role: user.role,
                  subRoles: user.subRoles ?? [],
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
