"use client";

import { useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string;
  contractNumber: string;
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
  contractNumber,
  totalBillboardsCount,
  selectedImagesCount,
  isSubmitting,
  progressLabel,
  onSubmit,
  onOpenChange,
}: SendReportDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);

  const trimmed = email.trim();
  const isValid = trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
  const showError = touched && !isValid;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="size-4" aria-hidden />
          Enviar reporte por email
        </DialogTitle>
        <DialogDescription>
          Se enviará el reporte del contrato{" "}
          <span className="font-medium text-foreground">
            {contractNumber}
          </span>{" "}
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

        <Input
          label="Correo del destinatario"
          type="email"
          autoFocus
          required
          autoComplete="email"
          placeholder="cliente@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={isSubmitting}
          aria-invalid={showError || undefined}
          className={showError ? "border-destructive" : undefined}
        />
        {showError ? (
          <p className="-mt-2 text-xs text-destructive">
            {trimmed.length === 0
              ? "El correo es obligatorio."
              : "Ingresa un correo válido."}
          </p>
        ) : (
          <p className="-mt-2 text-xs text-muted-foreground">
            Puedes editar el correo si quieres enviarlo a otro destinatario.
          </p>
        )}

        {isSubmitting && progressLabel ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
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
          disabled={isSubmitting || !isValid}
          icon={isSubmitting ? Loader2 : Send}
          iconClassName={isSubmitting ? "animate-spin" : undefined}
        >
          {isSubmitting ? "Enviando…" : "Enviar reporte"}
        </Button>
      </DialogFooter>
    </form>
  );
}
