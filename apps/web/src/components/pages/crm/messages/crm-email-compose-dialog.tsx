"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useCrmConnections,
  useCrmTemplateContext,
  useCrmTemplates,
} from "@/api/crm/crm.get";
import { useSendCrmEmail } from "@/api/crm/crm.mutations";
import type { CrmContextQuery, CrmMessage } from "@/api/crm/crm.types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NONE } from "../crm-const";
import { errorMessage } from "../crm-format";
import { MarkdownEditor } from "../templates/markdown-editor";
import { applyVariables } from "../templates/template-variables";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: CrmContextQuery;
  defaultTo: string[];
  replyTo?: CrmMessage | null;
}

interface FormState {
  to: string;
  cc: string;
  subject: string;
  body: string;
  templateId: string;
}

function splitEmails(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function replySubject(subject: string | null): string {
  if (!subject) return "";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

export function CrmEmailComposeDialog({
  open,
  onOpenChange,
  context,
  defaultTo,
  replyTo,
}: Props) {
  const { data: connections } = useCrmConnections();
  const { data: templates = [] } = useCrmTemplates();
  const { data: variables = {} } = useCrmTemplateContext(context, open);
  const sendEmail = useSendCrmEmail();

  const [form, setForm] = useState<FormState>({
    to: "",
    cc: "",
    subject: "",
    body: "",
    templateId: NONE,
  });
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const seedKey = open ? `${replyTo?.id ?? "new"}:${defaultTo.join(",")}` : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm({
      to: defaultTo.filter(Boolean).join(", "),
      cc: "",
      subject: replySubject(replyTo?.subject ?? null),
      body: "",
      templateId: NONE,
    });
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      patch({ templateId: NONE });
      return;
    }
    patch({
      templateId,
      subject: replyTo ? form.subject : applyVariables(template.subject, variables),
      body: applyVariables(template.body, variables),
    });
  }

  const gmail = connections?.gmail;
  const canSend = gmail?.connected && gmail.status === "ACTIVE";

  function handleSend() {
    const to = splitEmails(form.to);
    const cc = splitEmails(form.cc);
    const invalid = [...to, ...cc].find((email) => !EMAIL_RE.test(email));
    if (to.length === 0) {
      toast.error("Agrega al menos un destinatario.");
      return;
    }
    if (invalid) {
      toast.error(`Correo no válido: ${invalid}`);
      return;
    }
    if (!form.subject.trim()) {
      toast.error("El asunto es obligatorio.");
      return;
    }
    if (!form.body.trim()) {
      toast.error("Escribe el contenido del correo.");
      return;
    }

    sendEmail.mutate(
      {
        ...context,
        to,
        cc: cc.length > 0 ? cc : undefined,
        subject: form.subject.trim(),
        body: form.body,
        templateId: form.templateId === NONE ? undefined : form.templateId,
        threadId: replyTo?.threadId ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Correo enviado");
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo enviar el correo.")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{replyTo ? "Responder correo" : "Nuevo correo"}</DialogTitle>
          <DialogDescription>
            {gmail?.email
              ? `Se enviará desde ${gmail.email} y quedará registrado en el CRM.`
              : "Conecta tu cuenta de Gmail para enviar correos."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          {connections && !canSend ? (
            <div className="flex items-start gap-3 border border-warning/40 bg-warning-soft p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="flex-1">
                <p className="font-medium">
                  {gmail?.connected
                    ? "Tu conexión con Gmail necesita atención."
                    : "Aún no conectas tu correo."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {gmail?.lastError ??
                    `Conecta tu cuenta @${gmail?.allowedDomain ?? "veo.com.sv"} desde Ajustes del CRM.`}
                </p>
              </div>
              <Button asChild variant="outline" sizeVariant="sm">
                <Link href="/dashboard/crm/ajustes">Ir a Ajustes</Link>
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Para"
              placeholder="correo@cliente.com, otro@cliente.com"
              value={form.to}
              onChange={(e) => patch({ to: e.target.value })}
            />
            <Input
              label="CC"
              placeholder="Opcional"
              value={form.cc}
              onChange={(e) => patch({ cc: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_16rem]">
            <Input
              label="Asunto"
              value={form.subject}
              onChange={(e) => patch({ subject: e.target.value })}
            />
            <Select
              label="Plantilla"
              value={form.templateId}
              onValueChange={handleTemplate}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin plantilla</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <MarkdownEditor
            label="Mensaje"
            value={form.body}
            onChange={(body) => patch({ body })}
            previewVariables={variables}
            editorClassName="min-h-80"
          />
          {gmail?.signature ? (
            <p className="text-xs text-muted-foreground">
              Tu firma se agregará automáticamente al final del correo.
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendEmail.isPending}
          >
            Cancelar
          </Button>
          <Button
            icon={Send}
            onClick={handleSend}
            loading={sendEmail.isPending}
            disabled={!canSend}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
