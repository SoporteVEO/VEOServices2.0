"use client";

import { toast } from "sonner";
import {
  useCreateMentorshipSession,
  useUpdateMentorshipSession,
} from "@/api/mentorships/mentorships.mutations";
import type {
  MentorshipCollaboratorProfile,
  MentorshipDraft,
  MentorshipSessionDetail,
} from "@/api/mentorships/mentorships.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseYYYYMMDD } from "@/lib/format";
import { formatDay, quarterRange } from "./const";
import { SessionForm } from "./session-form";
import {
  emptySessionValues,
  sessionToValues,
  valuesToInput,
} from "./session-form-values";

function latest(...dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((d): d is Date => !!d);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function earliest(...dates: (Date | null | undefined)[]): Date {
  const valid = dates.filter((d): d is Date => !!d);
  return new Date(Math.min(...valid.map((d) => d.getTime())));
}

type CreateProps = {
  profile: MentorshipCollaboratorProfile;
  draft: MentorshipDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
};

export function CreateSessionDialog({
  profile,
  draft,
  open,
  onOpenChange,
  onCreated,
}: CreateProps) {
  const create = useCreateMentorshipSession();
  const { collaborator, quarter } = profile;
  const today = parseYYYYMMDD(draft.today) ?? new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Registrar mentoría · {quarter.label}</DialogTitle>
          <DialogDescription>
            Fecha límite: {formatDay(quarter.deadline)}. Al guardar,{" "}
            {collaborator.name} recibirá los acuerdos y deberá confirmar de
            recibido.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SessionForm
            header={{
              collaboratorName: collaborator.name,
              position: collaborator.position,
              department: collaborator.department?.name ?? null,
              mentorName: draft.mentorName,
              sessionNumber: draft.sessionNumber,
            }}
            defaultValues={emptySessionValues(draft.today)}
            previousStart={draft.previousStart}
            minSessionDate={latest(
              parseYYYYMMDD(quarter.start),
              parseYYYYMMDD(draft.minSessionDate),
            )}
            maxSessionDate={today}
            requireReason={false}
            isPending={create.isPending}
            submitLabel="Guardar y notificar"
            onCancel={() => onOpenChange(false)}
            onSubmit={(values) =>
              create.mutate(
                {
                  collaboratorId: collaborator.userId,
                  ...valuesToInput(values, !!draft.previousStart),
                },
                {
                  onSuccess: (session) => {
                    toast.success(
                      `Mentoría N.º ${session.sessionNumber} registrada. Notificamos a ${collaborator.name}.`,
                    );
                    onOpenChange(false);
                    onCreated(session.id);
                  },
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type EditProps = {
  session: MentorshipSessionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditSessionDialog({ session, open, onOpenChange }: EditProps) {
  const update = useUpdateMentorshipSession(session.id);
  const range = quarterRange(session.quarter);
  const requireReason = session.permissions.editRequiresReason;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            {requireReason ? "Corregir" : "Editar"} mentoría N.º{" "}
            {session.sessionNumber}
          </DialogTitle>
          <DialogDescription>
            {requireReason
              ? "El colaborador ya confirmó esta sesión. Cada cambio queda registrado en el historial de auditoría."
              : "Puedes ajustar los acuerdos hasta que el colaborador confirme de recibido."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SessionForm
            header={{
              collaboratorName: session.collaborator.name,
              position: session.collaborator.position,
              department: session.collaborator.department,
              mentorName: session.mentor.name,
              sessionNumber: session.sessionNumber,
            }}
            defaultValues={sessionToValues(session)}
            previousStart={session.previousStart}
            minSessionDate={latest(
              range?.start,
              parseYYYYMMDD(session.previousStart?.sessionDate),
            )}
            maxSessionDate={earliest(range?.end, new Date())}
            requireReason={requireReason}
            isPending={update.isPending}
            submitLabel={requireReason ? "Guardar corrección" : "Guardar cambios"}
            onCancel={() => onOpenChange(false)}
            onSubmit={(values) =>
              update.mutate(
                {
                  ...valuesToInput(values, !!session.previousStart),
                  ...(requireReason ? { reason: values.reason.trim() } : {}),
                },
                {
                  onSuccess: () => {
                    toast.success("Cambios guardados");
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
