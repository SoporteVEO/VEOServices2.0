"use client";

import {
  Bell,
  BellOff,
  Download,
  Loader2,
  Share,
  SquarePlus,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/primitives/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { usePwaInstall } from "@/hooks/use-pwa-install";

/**
 * Walks field staff through installing the app and allowing notifications.
 * iOS only exposes web push to apps opened from the home screen, so there the
 * card asks for the install first and offers notifications afterwards.
 */
export function PortalAppSetupCard() {
  const install = usePwaInstall();
  const push = usePushNotifications();

  if (push.isLoading) return null;

  const status = push.status;
  const needsIosInstall = install.isIos && !install.isStandalone;
  const showInstallButton =
    install.isMobile && !install.isStandalone && install.canPromptInstall;
  const canEnablePush =
    !!status?.supported &&
    status.serverEnabled &&
    !status.subscribed &&
    status.permission !== "denied";
  const isPushBlocked =
    !!status?.supported && status.serverEnabled && status.permission === "denied";

  if (!needsIosInstall && !showInstallButton && !canEnablePush && !isPushBlocked) {
    return null;
  }

  async function handleInstall() {
    const accepted = await install.promptInstall();
    if (accepted) toast.success("App instalada en tu teléfono.");
  }

  return (
    <Card className="mb-4 gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Usa Veo como app</CardTitle>
        <CardDescription>
          Instálala en tu teléfono y recibe un aviso cada vez que se te asigne
          una orden.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-4">
        {needsIosInstall ? (
          <ol className="space-y-2 text-sm">
            <IosStep icon={Share} index={1}>
              Toca <strong>Compartir</strong> en la barra de Safari.
            </IosStep>
            <IosStep icon={SquarePlus} index={2}>
              Elige <strong>Agregar a pantalla de inicio</strong>.
            </IosStep>
            <IosStep icon={Bell} index={3}>
              Abre Veo desde el ícono y activa las notificaciones aquí.
            </IosStep>
          </ol>
        ) : null}

        {showInstallButton ? (
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => void handleInstall()}
          >
            <Download />
            Instalar app
          </Button>
        ) : null}

        {canEnablePush && !needsIosInstall ? (
          <Button
            className="w-full"
            size="lg"
            onClick={push.requestEnable}
            disabled={push.isEnabling}
          >
            {push.isEnabling ? <Loader2 className="animate-spin" /> : <Bell />}
            Activar notificaciones
          </Button>
        ) : null}

        {push.enableError ? (
          <p className="text-xs text-destructive">{push.enableError.message}</p>
        ) : null}

        {isPushBlocked ? (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            Las notificaciones están bloqueadas. Actívalas para Veo en los
            ajustes del teléfono y vuelve a abrir la app.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IosStep({
  icon: Icon,
  index,
  children,
}: {
  icon: LucideIcon;
  index: number;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {index}
      </span>
      <span className="flex-1 leading-6">{children}</span>
      <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
    </li>
  );
}
