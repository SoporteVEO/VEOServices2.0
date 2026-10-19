"use client";

import { useState } from "react";
import { CheckCircle2, Clock, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useCollaboratorOptions } from "@/api/feature-requests/feature-requests.get";
import {
  useAddFeatureRequestCollaborator,
  useRemoveFeatureRequestCollaborator,
} from "@/api/feature-requests/feature-requests.mutations";
import type {
  FeatureRequestDetail,
  FeatureRequestParticipant,
} from "@/api/feature-requests/feature-requests.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { userName } from "./const";

type Props = { request: FeatureRequestDetail };

export function FeatureRequestParticipants({ request }: Props) {
  const canManage = request.permissions.canManageCollaborators;
  const showSignatures =
    request.completionRound > 0 &&
    (request.status === "COMPLETED" || request.status === "APPROVED");
  const [toRemove, setToRemove] =
    useState<FeatureRequestParticipant | null>(null);

  const { data: options = [], isLoading } = useCollaboratorOptions(canManage);
  const add = useAddFeatureRequestCollaborator(request.id);
  const remove = useRemoveFeatureRequestCollaborator(request.id);

  const participantIds = new Set(request.participants.map((p) => p.user.id));
  const available = options
    .filter((user) => !participantIds.has(user.id))
    .map((user) => ({
      value: user.id,
      label: (
        <span className="flex min-w-0 flex-col text-left">
          <span className="truncate">{userName(user)}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </span>
      ),
      filterValue: `${userName(user)} ${user.email}`,
    }));

  function handleAdd(value: string | number | undefined) {
    if (!value) return;
    add.mutate(String(value), {
      onSuccess: () => toast.success("Colaborador agregado y notificado"),
      onError: (error) => toast.error(error.message),
    });
  }

  function handleRemove() {
    if (!toRemove) return;
    remove.mutate(toRemove.user.id, {
      onSuccess: () => {
        toast.success("Colaborador quitado");
        setToRemove(null);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border border border-border">
        {request.participants.map((participant) => (
          <li
            key={participant.user.id}
            className="flex items-center gap-3 px-3 py-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center bg-muted text-xs font-semibold uppercase">
              {participant.user.firstName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {userName(participant.user)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {participant.user.email}
              </p>
            </div>
            <Badge variant="outline">
              {participant.isRequester ? "Solicitante" : "Colaborador"}
            </Badge>
            {showSignatures ? (
              participant.signed ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Firmó
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3.5" />
                  Pendiente
                </span>
              )
            ) : null}
            {canManage && !participant.isRequester ? (
              <Button
                variant="ghost"
                sizeVariant="sm"
                icon={UserMinus}
                aria-label={`Quitar a ${userName(participant.user)}`}
                onClick={() => setToRemove(participant)}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <Combobox
          options={available}
          value={null}
          isLoading={isLoading}
          disabled={add.isPending}
          onChange={handleAdd}
          placeholder="Agregar colaborador"
          emptyLabel="No hay más personas para agregar."
          leadingIcon={<UserPlus className="size-4" />}
        />
      ) : null}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => {
          if (!open) setToRemove(null);
        }}
        title="Quitar colaborador"
        description={
          toRemove
            ? `${userName(toRemove.user)} dejará de ver esta solicitud y ya no tendrá que firmarla.`
            : undefined
        }
        confirmLabel="Quitar"
        pending={remove.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
