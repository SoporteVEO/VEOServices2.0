"use client";

import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/primitives/ui/separator";
import { usePushNotifications } from "@/hooks/use-push-notifications";

/** Lives in the bell popover so the permission can still be granted after the banner was dismissed. */
export function PushPermissionNotice() {
  const push = usePushNotifications();

  if (push.isLoading || (!push.canEnable && !push.isBlocked)) return null;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        {push.isBlocked ? (
          <>
            <BellOff
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Las notificaciones del navegador están bloqueadas. Permítelas
              desde el candado de la barra de direcciones.
            </p>
          </>
        ) : (
          <>
            <BellRing aria-hidden className="size-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Recibe avisos en tu navegador aunque estés en otra pestaña.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={push.requestEnable}
              loading={push.isEnabling}
              className="shrink-0"
            >
              Activar
            </Button>
          </>
        )}
      </div>
      <Separator />
    </>
  );
}
