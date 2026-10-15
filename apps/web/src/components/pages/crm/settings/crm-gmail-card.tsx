"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  useDisconnectGmail,
  useGmailAuthUrl,
  useUpdateEmailSignature,
} from "@/api/crm/crm.mutations";
import type { CrmConnections } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
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
import { formatHumanDate } from "@/lib/format";
import { errorMessage } from "../crm-format";
import { MarkdownEditor } from "../templates/markdown-editor";

export function CrmGmailCard({ gmail }: { gmail: CrmConnections["gmail"] }) {
  const authUrl = useGmailAuthUrl();
  const disconnect = useDisconnectGmail();
  const updateSignature = useUpdateEmailSignature();
  const [signature, setSignature] = useState(gmail.signature ?? "");
  const [savedSignature, setSavedSignature] = useState(gmail.signature ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if ((gmail.signature ?? "") !== savedSignature) {
    setSavedSignature(gmail.signature ?? "");
    setSignature(gmail.signature ?? "");
  }

  function handleConnect() {
    authUrl.mutate(undefined, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: (error) =>
        toast.error(errorMessage(error, "No se pudo iniciar la conexión con Google.")),
    });
  }

  function handleDisconnect() {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        toast.success("Gmail desconectado");
        setConfirmOpen(false);
      },
      onError: (error) =>
        toast.error(errorMessage(error, "No se pudo desconectar Gmail.")),
    });
  }

  function handleSaveSignature() {
    updateSignature.mutate(
      { signature },
      {
        onSuccess: () => toast.success("Firma guardada"),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo guardar la firma.")),
      },
    );
  }

  const healthy = gmail.connected && gmail.status === "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" />
          Gmail
        </CardTitle>
        <CardDescription>
          Envía correos desde tu cuenta @{gmail.allowedDomain} y registra las respuestas
          en el CRM.
        </CardDescription>
        <CardAction>
          {gmail.connected ? (
            <Badge variant={healthy ? "success" : "destructive"}>
              {healthy ? "Conectado" : "Requiere atención"}
            </Badge>
          ) : (
            <Badge variant="outline">Sin conectar</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!gmail.configured ? (
          <p className="border border-warning/40 bg-warning-soft p-3 text-sm">
            La integración con Google aún no está configurada en el servidor. Pide al
            administrador que agregue las credenciales de OAuth de Google Workspace.
          </p>
        ) : gmail.connected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium">{gmail.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Conectado desde {formatHumanDate(gmail.connectedAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!healthy ? (
                  <Button sizeVariant="sm" onClick={handleConnect} loading={authUrl.isPending}>
                    Reconectar
                  </Button>
                ) : null}
                <Button
                  sizeVariant="sm"
                  variant="outline"
                  icon={Unplug}
                  onClick={() => setConfirmOpen(true)}
                >
                  Desconectar
                </Button>
              </div>
            </div>
            {gmail.lastError ? (
              <p className="text-xs text-destructive">{gmail.lastError}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              <MarkdownEditor
                label="Firma de correo"
                value={signature}
                onChange={setSignature}
                showVariables={false}
                compact
                placeholder={"**Tu nombre**\nEjecutivo de Ventas · VEO\n+503 0000 0000"}
              />
              <div className="flex justify-end">
                <Button
                  sizeVariant="sm"
                  disabled={signature === (gmail.signature ?? "")}
                  loading={updateSignature.isPending}
                  onClick={handleSaveSignature}
                >
                  Guardar firma
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Solo se aceptan cuentas del dominio @{gmail.allowedDomain}.</li>
              <li>Los correos se envían desde tu buzón y aparecen en “Enviados”.</li>
              <li>Puedes importar respuestas desde cada negocio con “Sincronizar”.</li>
            </ul>
            <Button icon={Mail} onClick={handleConnect} loading={authUrl.isPending}>
              Conectar con Google
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desconectar Gmail"
        description="Ya no podrás enviar correos desde el CRM hasta que vuelvas a conectar tu cuenta. El historial se conserva."
        confirmLabel="Desconectar"
        pending={disconnect.isPending}
        onConfirm={handleDisconnect}
      />
    </Card>
  );
}
