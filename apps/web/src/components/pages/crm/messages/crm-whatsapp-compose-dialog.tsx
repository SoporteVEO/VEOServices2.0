"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Info, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useCrmConnections,
  useCrmTemplateContext,
  useCrmWhatsAppTemplates,
} from "@/api/crm/crm.get";
import { useSendCrmWhatsApp } from "@/api/crm/crm.mutations";
import type { CrmContextQuery } from "@/api/crm/crm.types";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
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
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, normalizePhone, waLink } from "../crm-format";
import { applyVariables } from "../templates/template-variables";

type SendMode = "TEXT" | "TEMPLATE" | "MANUAL";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: CrmContextQuery;
  defaultTo: string;
}

interface FormState {
  to: string;
  mode: SendMode;
  body: string;
  templateKey: string;
  parameters: string[];
}

function templateKey(name: string, language: string): string {
  return `${name}::${language}`;
}

export function CrmWhatsAppComposeDialog({
  open,
  onOpenChange,
  context,
  defaultTo,
}: Props) {
  const { data: connections } = useCrmConnections();
  const connected =
    connections?.whatsapp.connected && connections.whatsapp.status === "ACTIVE";
  const { data: templates = [], isLoading: loadingTemplates } =
    useCrmWhatsAppTemplates(open && !!connected);
  const { data: variables = {} } = useCrmTemplateContext(context, open);
  const sendWhatsApp = useSendCrmWhatsApp();

  const [form, setForm] = useState<FormState>({
    to: "",
    mode: "MANUAL",
    body: "",
    templateKey: "",
    parameters: [],
  });
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const seedKey = open ? `${defaultTo}:${connected ? "api" : "manual"}` : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm({
      to: defaultTo,
      mode: connected ? "TEXT" : "MANUAL",
      body: "",
      templateKey: "",
      parameters: [],
    });
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  const selectedTemplate = templates.find(
    (t) => templateKey(t.name, t.language) === form.templateKey,
  );

  function onSuccess(message: string) {
    toast.success(message);
    onOpenChange(false);
  }

  function onError(error: Error) {
    toast.error(errorMessage(error, "No se pudo enviar el mensaje."));
  }

  function handleSend() {
    const to = normalizePhone(form.to);
    if (to.length < 8) {
      toast.error("Ingresa un número de WhatsApp válido.");
      return;
    }

    if (form.mode === "TEMPLATE") {
      if (!selectedTemplate) {
        toast.error("Selecciona una plantilla aprobada.");
        return;
      }
      sendWhatsApp.mutate(
        {
          ...context,
          to,
          mode: "API",
          template: {
            name: selectedTemplate.name,
            language: selectedTemplate.language,
            parameters: form.parameters.slice(0, selectedTemplate.parameterCount),
          },
        },
        { onSuccess: () => onSuccess("Plantilla enviada por WhatsApp"), onError },
      );
      return;
    }

    const body = applyVariables(form.body, variables).trim();
    if (!body) {
      toast.error("Escribe el mensaje.");
      return;
    }

    if (form.mode === "MANUAL") {
      window.open(waLink(to, body), "_blank", "noopener,noreferrer");
      sendWhatsApp.mutate(
        { ...context, to, mode: "MANUAL", body },
        { onSuccess: () => onSuccess("Mensaje registrado en el CRM"), onError },
      );
      return;
    }

    sendWhatsApp.mutate(
      { ...context, to, mode: "API", body },
      { onSuccess: () => onSuccess("Mensaje enviado por WhatsApp"), onError },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp</DialogTitle>
          <DialogDescription>
            {connected
              ? `Desde ${connections?.whatsapp.displayPhoneNumber ?? "tu número de WhatsApp Business"}.`
              : "Se abrirá WhatsApp con el mensaje listo y quedará registrado en el CRM."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={form.mode}
            onValueChange={(next) => {
              if (next) patch({ mode: next as SendMode });
            }}
            className="w-full"
          >
            <ToggleGroupItem value="TEXT" disabled={!connected} className="flex-1 text-xs">
              Texto (API)
            </ToggleGroupItem>
            <ToggleGroupItem value="TEMPLATE" disabled={!connected} className="flex-1 text-xs">
              Plantilla aprobada
            </ToggleGroupItem>
            <ToggleGroupItem value="MANUAL" className="flex-1 text-xs">
              Abrir en WhatsApp
            </ToggleGroupItem>
          </ToggleGroup>

          {!connected ? (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Para enviar directamente y recibir respuestas en el CRM, conecta tu
                WhatsApp Business en{" "}
                <Link href="/dashboard/crm/ajustes" className="underline underline-offset-2">
                  Ajustes
                </Link>
                .
              </span>
            </p>
          ) : form.mode === "TEXT" ? (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                WhatsApp solo permite texto libre si el cliente te escribió en las
                últimas 24 horas. Para iniciar una conversación usa una plantilla
                aprobada.
              </span>
            </p>
          ) : null}

          <Input
            label="Número"
            type="tel"
            placeholder="7777 7777 o 503 7777 7777"
            value={form.to}
            onChange={(e) => patch({ to: e.target.value })}
          />

          {form.mode === "TEMPLATE" ? (
            <>
              <Select
                label="Plantilla"
                value={form.templateKey}
                onValueChange={(key) => patch({ templateKey: key, parameters: [] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingTemplates
                        ? "Cargando plantillas..."
                        : templates.length === 0
                          ? "No hay plantillas aprobadas"
                          : "Selecciona una plantilla"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={templateKey(t.name, t.language)} value={templateKey(t.name, t.language)}>
                      {t.name} · {t.language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate ? (
                <div className="flex flex-col gap-3 border border-border bg-muted/30 p-3">
                  {selectedTemplate.bodyText ? (
                    <p className="whitespace-pre-wrap text-sm">{selectedTemplate.bodyText}</p>
                  ) : null}
                  {Array.from({ length: selectedTemplate.parameterCount }).map((_, index) => (
                    <Input
                      key={index}
                      label={`Parámetro {{${index + 1}}}`}
                      placeholder="Puedes usar variables como {{contacto.nombre}}"
                      value={form.parameters[index] ?? ""}
                      onChange={(e) => {
                        const parameters = [...form.parameters];
                        parameters[index] = e.target.value;
                        patch({ parameters });
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <Textarea
              label="Mensaje"
              rows={6}
              placeholder="Hola {{contacto.nombre}}, te escribo de VEO..."
              value={form.body}
              onChange={(e) => patch({ body: e.target.value })}
            />
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendWhatsApp.isPending}
          >
            Cancelar
          </Button>
          <Button
            icon={form.mode === "MANUAL" ? ExternalLink : Send}
            onClick={handleSend}
            loading={sendWhatsApp.isPending}
          >
            {form.mode === "MANUAL" ? "Abrir WhatsApp" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
