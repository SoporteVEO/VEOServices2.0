"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import type { TeamMember } from "@/api/team-members/team-members.types";
import {
  useCreateTeamMember,
  useUpdateTeamMember,
} from "@/api/team-members/team-members.mutations";
import { useUsers } from "@/api/users/users.get";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamMemberForm, type TeamMemberFormValues } from "./team-member-form";

type TeamMemberFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember?: TeamMember | null;
  existingUserIds: string[];
};

export function TeamMemberFormDialog({
  open,
  onOpenChange,
  teamMember,
  existingUserIds,
}: TeamMemberFormDialogProps) {
  const isEdit = !!teamMember;
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const { data: users = [] } = useUsers();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const availableUsers = useMemo(() => {
    if (isEdit && teamMember) {
      return users.filter(
        (u) =>
          u.id === teamMember.userId || !existingUserIds.includes(u.id),
      );
    }
    return users.filter((u) => !existingUserIds.includes(u.id));
  }, [users, existingUserIds, isEdit, teamMember]);

  function handleSubmit(values: TeamMemberFormValues) {
    const payload = {
      userId: values.userId,
      firstName: values.firstName,
      lastName: values.lastName || undefined,
      businessEmail: values.businessEmail,
      position: values.position,
      salary: values.salary,
      vacations: values.vacations,
      usedVacations: values.usedVacations,
    };

    if (isEdit && teamMember) {
      updateMutation.mutate(
        { id: teamMember.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Miembro actualizado");
            onOpenChange(false);
          },
          onError: (err: Error) =>
            toast.error(err.message || "Error al actualizar"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Miembro agregado a la plantilla");
          onOpenChange(false);
        },
        onError: (err: Error) =>
          toast.error(err.message || "Error al agregar miembro"),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar miembro" : "Agregar miembro a plantilla"}
          </DialogTitle>
        </DialogHeader>

        <TeamMemberForm
          key={teamMember?.id}
          isEdit={isEdit}
          isPending={isPending}
          users={availableUsers}
          defaultValues={
            teamMember
              ? {
                  userId: teamMember.userId,
                  firstName: teamMember.firstName,
                  lastName: teamMember.lastName ?? "",
                  businessEmail: teamMember.businessEmail,
                  position: teamMember.position,
                  salary: teamMember.salary,
                  vacations: teamMember.vacations,
                  usedVacations: teamMember.usedVacations,
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
