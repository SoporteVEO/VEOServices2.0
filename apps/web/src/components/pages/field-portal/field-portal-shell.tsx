"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/primitives/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { FIELD_PORTAL_BASE } from "@/lib/portal-access";
import { PortalAppSetupCard } from "./portal-app-setup-card";
import { PortalNavSheet } from "./portal-nav-sheet";
import { usePortalSignOut } from "./use-portal-sign-out";

type Props = {
  title: string;
  subtitle?: string | null;
  backHref?: string;
  children: ReactNode;
};

/**
 * Full-height mobile-first chrome for "Mis órdenes": a sticky header with
 * large tap targets and a single-column body sized for a phone held one-handed.
 */
export function FieldPortalShell({
  title,
  subtitle,
  backHref,
  children,
}: Props) {
  const handleSignOut = usePortalSignOut();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b-2 border-veo-lime bg-veo-dark text-white **:data-[slot=button]:text-white **:data-[slot=button]:hover:bg-veo-dark-80 **:data-[slot=button]:hover:text-white">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3">
          {backHref ? (
            <Button variant="ghost" size="icon" asChild aria-label="Volver">
              <Link href={backHref}>
                <ArrowLeft />
              </Link>
            </Button>
          ) : (
            <Link
              href={FIELD_PORTAL_BASE}
              aria-label="Inicio"
              className="flex size-9 shrink-0 items-center justify-center bg-veo-dark-80"
            >
              <BrandLogo variant="isotipo" className="h-3.5" />
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-base font-semibold leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-veo-ice/75">{subtitle}</p>
            ) : null}
          </div>

          <PortalNavSheet />

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
        {backHref ? null : <PortalAppSetupCard />}
        {children}
      </main>
    </div>
  );
}
