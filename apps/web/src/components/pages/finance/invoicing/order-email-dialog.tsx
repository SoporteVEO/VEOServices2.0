"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EmailSendType } from "@/api/finance/finance.types";
import { useOrderEmails } from "@/api/finance/invoicing.get";
import { useSendOrderEmail } from "@/api/finance/invoicing.mutations";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBriloShortDate } from "@/lib/format";
import { errorText } from "../shared/finance-format";

type Props = {
  mfaId: number;
  documentLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface Recipient {
  email: string;
  sendType: EmailSendType;
}

const SEND_TYPES: EmailSendType[] = ["TO", "CC", "CCO"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSendType(value: string | null): EmailSendType {
  const upper = value?.toUpperCase();
  return upper === "CC" || upper === "CCO" ? upper : "TO";
}

export function OrderEmailDialog({
  mfaId,
  documentLabel,
  open,
  onOpenChange,
}: Props) {
  const { data, isLoading } = useOrderEmails(mfaId, open);
  const sendEmail = useSendOrderEmail();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [includeSeller, setIncludeSeller] = useState(false);
  const [includeMe, setIncludeMe] = useState(false);
  const [seeded, setSeeded] = useState<string | null>(null);

  const seedKey = open && data ? `${mfaId}` : null;
  if (seedKey !== seeded) {
    setSeeded(seedKey);
    setRecipients(
      seedKey && data
        ? data.suggested
            .filter((s) => s.email)
            .map((s) => ({
              email: s.email as string,
              sendType: toSendType(s.tipoEnvioSugerido),
            }))
        : [],
    );
    setIncludeSeller(false);
    setIncludeMe(false);
  }

  const update = (index: number, patch: Partial<Recipient>) =>
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );

  function handleSend() {
    const cleaned = recipients
      .map((r) => ({ ...r, email: r.email.trim() }))
      .filter((r) => r.email);
    if (!cleaned.some((r) => r.sendType === "TO")) {
      return toast.error("Agrega al menos un destinatario principal (TO).");
    }
    const invalid = cleaned.find((r) => !EMAIL_RE.test(r.email));
    if (invalid) return toast.error(`Correo inválido: ${invalid.email}`);

    sendEmail.mutate(
      { mfaId, recipients: cleaned, includeSeller, includeMe },
      {
        onSuccess: () => {
          toast.success("Correo en cola de envío desde Brilo.");
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(errorText(error, "No se pudo enviar el correo.")),
      },
    );
  }

  const history = data?.history ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Enviar documento por correo</DialogTitle>
          <DialogDescription>
            Brilo envía {documentLabel} en PDF a los destinatarios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <Label>Destinatarios</Label>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">
                Cargando destinatarios sugeridos...
              </p>
            ) : null}
            {recipients.map((recipient, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={recipient.sendType}
                  onValueChange={(sendType) =>
                    update(index, { sendType: sendType as EmailSendType })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEND_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  type="email"
                  placeholder="correo@empresa.com"
                  value={recipient.email}
                  onChange={(event) =>
                    update(index, { email: event.target.value })
                  }
                />
                <PrimitiveButton
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar destinatario"
                  onClick={() =>
                    setRecipients((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </PrimitiveButton>
              </div>
            ))}
            <Button
              variant="outline"
              sizeVariant="sm"
              icon={Plus}
              className="self-start"
              onClick={() =>
                setRecipients((prev) => [
                  ...prev,
                  { email: "", sendType: prev.length ? "CC" : "TO" },
                ])
              }
            >
              Agregar destinatario
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="odf-email-seller"
                checked={includeSeller}
                onCheckedChange={(checked) => setIncludeSeller(checked === true)}
              />
              <Label htmlFor="odf-email-seller">Copiar al vendedor</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="odf-email-me"
                checked={includeMe}
                onCheckedChange={(checked) => setIncludeMe(checked === true)}
              />
              <Label htmlFor="odf-email-me">Copiarme</Label>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>Envíos anteriores</Label>
              <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                {history.map((item) => (
                  <li
                    key={item.envdocId}
                    className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      {item.eemEmailsTo ?? "—"}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      {formatBriloShortDate(
                        item.fechaEnviado ?? item.envdocFecHoraCreacion,
                      )}
                      <Badge
                        variant={item.eemErrorUltFallo ? "destructive" : "secondary"}
                      >
                        {item.estadoEmail ?? "—"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendEmail.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} loading={sendEmail.isPending}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
