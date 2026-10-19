"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { useSignFeatureRequest } from "@/api/feature-requests/feature-requests.mutations";
import type { FeatureRequestDetail } from "@/api/feature-requests/feature-requests.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Label } from "@/components/primitives/ui/label";
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
import { SignaturePad } from "@/components/ui/signature-pad";

type Props = {
  request: FeatureRequestDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeatureRequestSignDialog({ request, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        {open ? (
          <SignForm request={request} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SignForm({
  request,
  onDone,
}: {
  request: FeatureRequestDetail;
  onDone: () => void;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const sign = useSignFeatureRequest(request.id);

  function handleSign() {
    if (!signature) return;
    sign.mutate(signature, {
      onSuccess: () => {
        toast.success("Firma registrada. ¡Gracias!");
        onDone();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Firmar aprobación</DialogTitle>
        <DialogDescription>
          {request.ticket} · {request.title}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Tu firma queda guardada como evidencia de que revisaste la
          funcionalidad entregada por el equipo de desarrollo.
        </p>
        <SignaturePad onChange={setSignature} disabled={sign.isPending} />
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="feature-request-accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="feature-request-accept"
            className="text-sm leading-snug font-normal"
          >
            Confirmo que la funcionalidad funciona como esperaba, sin
            problemas, y me resulta útil para mi trabajo.
          </Label>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={sign.isPending}>
          Cancelar
        </Button>
        <Button
          icon={PenLine}
          loading={sign.isPending}
          disabled={!signature || !accepted}
          onClick={handleSign}
        >
          Firmar y aprobar
        </Button>
      </DialogFooter>
    </>
  );
}
