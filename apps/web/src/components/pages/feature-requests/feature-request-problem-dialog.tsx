"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useReportFeatureRequestProblem } from "@/api/feature-requests/feature-requests.mutations";
import type { FeatureRequestDetail } from "@/api/feature-requests/feature-requests.types";
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
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_LENGTH, MIN_PROBLEM_LENGTH } from "./const";

type Props = {
  request: FeatureRequestDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeatureRequestProblemDialog({
  request,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open ? (
          <ProblemForm request={request} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProblemForm({
  request,
  onDone,
}: {
  request: FeatureRequestDetail;
  onDone: () => void;
}) {
  const [message, setMessage] = useState("");
  const report = useReportFeatureRequestProblem(request.id);
  const trimmed = message.trim();

  function handleSubmit() {
    report.mutate(trimmed, {
      onSuccess: () => {
        toast.success("Problema enviado. La solicitud volvió a desarrollo");
        onDone();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reportar un problema</DialogTitle>
        <DialogDescription>
          {request.ticket} volverá a desarrollo y avisaremos a los demás
          participantes.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Textarea
          label="¿Qué no funciona como esperabas?"
          placeholder="Describe qué hiciste y qué pasó."
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={report.isPending}>
          Cancelar
        </Button>
        <Button
          icon={TriangleAlert}
          loading={report.isPending}
          disabled={trimmed.length < MIN_PROBLEM_LENGTH}
          onClick={handleSubmit}
        >
          Enviar a desarrollo
        </Button>
      </DialogFooter>
    </>
  );
}
