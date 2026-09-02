"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/primitives/ui/button";
import { authClient, clearAuthToken } from "@/lib/auth-client";
import { MAINTENANCE_PORTAL_BASE } from "@/lib/maintenance-portal";

type Props = {
  title: string;
  subtitle?: string | null;
  backHref?: string;
  children: ReactNode;
};

/**
 * Full-height mobile-first chrome for the maintenance portal: sticky header
 * with large tap targets and a single-column body sized for a phone held
 * one-handed.
 */
export function MaintenancePortalShell({
  title,
  subtitle,
  backHref,
  children,
}: Props) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    clearAuthToken();
    router.replace("/");
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
          {backHref ? (
            <Button variant="ghost" size="icon" asChild aria-label="Volver">
              <Link href={backHref}>
                <ArrowLeft />
              </Link>
            </Button>
          ) : (
            <Link
              href={MAINTENANCE_PORTAL_BASE}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              V
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar sesión"
            onClick={() => void handleSignOut()}
          >
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 pb-safe">
        {children}
      </main>
    </div>
  );
}
