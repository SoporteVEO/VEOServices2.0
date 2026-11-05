"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { useAcknowledgeMentorshipSession } from "@/api/mentorships/mentorships.mutations";
import type { MentorshipSessionDetail } from "@/api/mentorships/mentorships.types";
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
import { MAX_TEXT_LENGTH } from "./const";

type Props = {
  session: MentorshipSessionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AcknowledgeDialog({ session, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open ? (
          <AcknowledgeForm
            session={session}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AcknowledgeForm({
  session,
  onDone,
}: {
  session: MentorshipSessionDetail;
  onDone: () => void;
}) {
  const [comment, setComment] = useState("");
  const acknowledge = useAcknowledgeMentorshipSession(session.id);

  function handleConfirm() {
    acknowledge.mutate(comment.trim(), {
      onSuccess: () => {
        toast.success("Confirmaste de recibido tu mentoría");
        onDone();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirmar de recibido</DialogTitle>
        <DialogDescription>
          Confirmas que conversaste con {session.mentor.name} y recibiste los
          acuerdos de la sesión N.º {session.sessionNumber}. Después de
          confirmar, solo Talento Humano podrá corregirlos.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Textarea
          label="Comentario (opcional)"
          placeholder="¿Algo que quieras agregar sobre los acuerdos?"
          rows={4}
          maxLength={MAX_TEXT_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onDone}
          disabled={acknowledge.isPending}
        >
          Cancelar
        </Button>
        <Button
          icon={CircleCheck}
          loading={acknowledge.isPending}
          onClick={handleConfirm}
        >
          Confirmar de recibido
        </Button>
      </DialogFooter>
    </>
  );
}
