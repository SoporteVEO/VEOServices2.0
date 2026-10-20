"use client";

import * as React from "react";
import { Bell, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/ui/alert";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DISMISSED_STORAGE_KEY = "veo:push-banner:dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the banner just returns next visit.
  }
}

export function PushPermissionBanner() {
  const push = usePushNotifications();
  const [dismissed, setDismissed] = React.useState<boolean>(() =>
    typeof window === "undefined" ? false : readDismissed(),
  );

  if (push.isLoading || !push.canEnable || dismissed) return null;

  function handleDismiss() {
    writeDismissed();
    setDismissed(true);
  }

  return (
    <Alert role="status" className="mb-3 flex items-center gap-3 @3xl/main:mb-5">
      <Bell aria-hidden className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <AlertTitle>Activa las notificaciones del navegador</AlertTitle>
        <AlertDescription>
          Recibe un aviso en tu escritorio cuando haya algo nuevo, incluso si
          estás en otra pestaña.
        </AlertDescription>
        {push.enableError ? (
          <p className="mt-1 text-xs text-destructive">
            {push.enableError.message}
          </p>
        ) : null}
      </div>
      <Button
        size="sm"
        onClick={push.requestEnable}
        loading={push.isEnabling}
        className="shrink-0"
      >
        Activar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        aria-label="Ahora no"
        title="Ahora no"
        className="size-7 shrink-0"
      >
        <X className="size-3.5" />
      </Button>
    </Alert>
  );
}
