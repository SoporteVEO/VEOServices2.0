"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateFeatureRequestStatus } from "@/api/feature-requests/feature-requests.mutations";
import type {
  FeatureRequestDetail,
  UpdateFeatureRequestStatusInput,
} from "@/api/feature-requests/feature-requests.types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_LENGTH, STATUS_LABELS } from "./const";

type DevStatus = UpdateFeatureRequestStatusInput["status"];

const DEV_STATUSES: DevStatus[] = [
  "IN_REVIEW",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

const DEV_STATUS_LABELS: Record<DevStatus, string> = {
  ...STATUS_LABELS,
  COMPLETED: "Completada (pedir firma)",
};

function isDevStatus(value: string): value is DevStatus {
  return DEV_STATUSES.includes(value as DevStatus);
}

export function FeatureRequestStatusForm({
  request,
}: {
  request: FeatureRequestDetail;
}) {
  const [status, setStatus] = useState<DevStatus | "">(
    isDevStatus(request.status) ? request.status : "",
  );
  const [message, setMessage] = useState("");
  const update = useUpdateFeatureRequestStatus(request.id);

  const trimmed = message.trim();
  const isNote = status === request.status;
  const needsMessage = status === "REJECTED" || isNote;
  const canSubmit = status !== "" && (!needsMessage || trimmed.length > 0);

  function handleSubmit() {
    if (status === "") return;
    update.mutate(
      { status, message: trimmed || undefined },
      {
        onSuccess: () => {
          setMessage("");
          toast.success(
            status === "COMPLETED"
              ? "Marcada como completada. Se pidió la firma a los participantes"
              : `${request.ticket} actualizada`,
          );
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Select
        label="Estado"
        value={status}
        onValueChange={(value) => setStatus(value as DevStatus)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Elige un estado" />
        </SelectTrigger>
        <SelectContent>
          {DEV_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {DEV_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        label={
          status === "REJECTED"
            ? "Motivo del rechazo (obligatorio)"
            : isNote
              ? "Nota para los participantes (obligatoria)"
              : "Nota para los participantes (opcional)"
        }
        placeholder="Lo verán el solicitante y los colaboradores."
        rows={2}
        maxLength={MAX_MESSAGE_LENGTH}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button
        icon={Save}
        className="self-end"
        loading={update.isPending}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {isNote ? "Enviar nota" : "Actualizar estado"}
      </Button>
    </div>
  );
}
