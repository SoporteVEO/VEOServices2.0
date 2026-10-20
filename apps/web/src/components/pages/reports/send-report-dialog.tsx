"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { useReportRecipients } from "@/api/clients/clients.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
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
import { ReportRecipientCombobox } from "./report-recipient-combobox";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string | null;
  /** Brilo customer id, used to find the CRM client and its contacts. */
  briloCliId?: number | null;
  contractNumber: string;
  /** Month the report covers, e.g. "Agosto 2026". */
  periodLabel: string;
  totalBillboardsCount: number;
  selectedImagesCount: number;
  isSubmitting: boolean;
  progressLabel?: string | null;
  onSubmit: (email: string) => void;
}

export function SendReportDialog(props: SendReportDialogProps) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (props.isSubmitting) return;
        props.onOpenChange(open);
      }}
    >
      <DialogContent size="md">
        {props.open ? <SendReportDialogContent {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function SendReportDialogContent({
  defaultEmail,
  briloCliId,
  contractNumber,
  periodLabel,
  totalBillboardsCount,
  selectedImagesCount,
  isSubmitting,
  progressLabel,
  onSubmit,
  onOpenChange,
}: SendReportDialogProps) {
  const recipientsQuery = useReportRecipients({
    briloCliId,
    email: defaultEmail,
  });
  const contacts = recipientsQuery.data?.contacts ?? [];
  const [chosen, setChosen] = useState<string | null>(null);

  const primaryEmail = contacts.find((contact) => contact.isPrimary)?.email;
  const email =
    chosen ?? primaryEmail ?? defaultEmail?.trim().toLowerCase() ?? "";
  const isResolving = recipientsQuery.isLoading && chosen === null;
  const isValid = email.length > 0 && EMAIL_REGEX.test(email);
  const showError = !isResolving && email.length > 0 && !isValid;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid || isResolving) return;
    onSubmit(email);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="size-4" aria-hidden />
          Enviar reporte por email
        </DialogTitle>
        <DialogDescription>
          Se enviará el reporte de{" "}
          <span className="font-medium text-foreground">{periodLabel}</span> del
          contrato{" "}
          <span className="font-medium text-foreground">{contractNumber}</span>{" "}
          al email indicado.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <div className="space-y-1 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground tabular-nums">
              {selectedImagesCount}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground tabular-nums">
              {totalBillboardsCount}
            </span>{" "}
            {totalBillboardsCount === 1
              ? "valla incluida en el reporte"
              : "vallas incluidas en el reporte"}
          </p>
          <p className="text-[11px]">
            Solo se incluirán las vallas con imagen seleccionada.
          </p>
        </div>

        <ReportRecipientCombobox
          label="Destinatario"
          value={email}
          onChange={setChosen}
          contacts={contacts}
          fallbackEmail={defaultEmail}
          isLoading={recipientsQuery.isLoading}
          disabled={isSubmitting}
        />
        {showError ? (
          <p className="-mt-2 text-xs text-destructive">
            Ingresa un correo válido.
          </p>
        ) : (
          <p className="-mt-2 text-xs text-muted-foreground">
            {recipientsQuery.data?.client
              ? `Contactos de ${recipientsQuery.data.client.name}. Escribe un correo para usar otro.`
              : "Escribe un correo para enviarlo a otro destinatario."}
          </p>
        )}

        {isSubmitting && progressLabel ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            <Skeleton className="size-3.5 shrink-0" />
            <span>{progressLabel}</span>
          </div>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isValid || isResolving}
          icon={Send}
          loading={isSubmitting}
        >
          {isSubmitting ? "Enviando…" : "Enviar reporte"}
        </Button>
      </DialogFooter>
    </form>
  );
}
