"use client";

import { useState } from "react";
import { CheckCircle2, Copy, MessageCircle, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  useConnectWhatsApp,
  useDisconnectWhatsApp,
} from "@/api/crm/crm.mutations";
import type { CrmConnections } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { errorMessage } from "../crm-format";

const WEBHOOK_URL = `${api.defaults.baseURL ?? ""}/crm/whatsapp/webhook`;

export function CrmWhatsAppCard({ whatsapp }: { whatsapp: CrmConnections["whatsapp"] }) {
  const connect = useConnectWhatsApp();
  const disconnect = useDisconnectWhatsApp();
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const healthy = whatsapp.connected && whatsapp.status === "ACTIVE";

  function handleConnect() {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error("Ingresa el Phone Number ID y el token de acceso.");
      return;
    }
    connect.mutate(
      {
        phoneNumberId: phoneNumberId.trim(),
        accessToken: accessToken.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("WhatsApp conectado");
          setAccessToken("");
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo conectar WhatsApp.")),
      },
    );
  }

  function handleDisconnect() {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        toast.success("WhatsApp desconectado");
        setConfirmOpen(false);
      },
      onError: (error) =>
        toast.error(errorMessage(error, "No se pudo desconectar WhatsApp.")),
    });
  }

  function copyWebhook() {
    void navigator.clipboard
      .writeText(WEBHOOK_URL)
      .then(() => toast.success("URL copiada"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          WhatsApp Business
        </CardTitle>
        <CardDescription>
          Conecta tu número de WhatsApp Business (Cloud API de Meta) para enviar
          mensajes y recibir respuestas en el CRM.
        </CardDescription>
        <CardAction>
          {whatsapp.connected ? (
            <Badge variant={healthy ? "success" : "destructive"}>
              {healthy ? "Conectado" : "Requiere atención"}
            </Badge>
          ) : (
            <Badge variant="outline">Sin conectar</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {whatsapp.connected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium">
                    {whatsapp.displayPhoneNumber}
                    {whatsapp.verifiedName ? (
                      <span className="text-muted-foreground"> · {whatsapp.verifiedName}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Phone Number ID: {whatsapp.phoneNumberId}
                  </p>
                </div>
              </div>
              <Button
                sizeVariant="sm"
                variant="outline"
                icon={Unplug}
                onClick={() => setConfirmOpen(true)}
              >
                Desconectar
              </Button>
            </div>
            {whatsapp.lastError ? (
              <p className="text-xs text-destructive">{whatsapp.lastError}</p>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                En Meta for Developers, abre tu app de WhatsApp Business y copia el{" "}
                <strong>Phone Number ID</strong>.
              </li>
              <li>
                Genera un <strong>token de acceso permanente</strong> (usuario del
                sistema) con permisos <code>whatsapp_business_messaging</code>.
              </li>
              <li>Pega ambos datos aquí. Validaremos el número con Meta.</li>
            </ol>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Phone Number ID"
                required
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
              <Input
                label="WhatsApp Business Account ID"
                placeholder="Opcional, para listar plantillas"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
              />
            </div>
            <Input
              label="Token de acceso"
              required
              type="password"
              autoComplete="off"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <div className="flex justify-end">
              <Button icon={MessageCircle} onClick={handleConnect} loading={connect.isPending}>
                Conectar WhatsApp
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium">Webhook para recibir respuestas</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate bg-muted px-2 py-1 text-xs">
              {WEBHOOK_URL}
            </code>
            <PrimitiveButton
              variant="ghost"
              size="icon-xs"
              aria-label="Copiar URL"
              onClick={copyWebhook}
            >
              <Copy />
            </PrimitiveButton>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {whatsapp.webhookConfigured
              ? "El servidor está listo para recibir mensajes. Suscribe el campo “messages” en Meta."
              : "El administrador debe configurar el token de verificación y el App Secret en el servidor."}
          </p>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desconectar WhatsApp"
        description="Dejarás de enviar y recibir mensajes por la API. Podrás seguir usando “Abrir en WhatsApp”."
        confirmLabel="Desconectar"
        pending={disconnect.isPending}
        onConfirm={handleDisconnect}
      />
    </Card>
  );
}
