"use client";

import Link from "next/link";
import { useCurrentVersion } from "@/api/patch-notes/patch-notes.get";

export function AppSidebarVersion() {
  const { data: version } = useCurrentVersion();
  if (!version) return null;

  return (
    <Link
      href="/dashboard/actualizaciones"
      className="px-2 text-xs text-sidebar-muted-foreground outline-none ring-sidebar-ring transition-colors hover:text-sidebar-foreground focus-visible:ring-2 group-data-[collapsible=icon]:hidden"
    >
      Versión {version}
    </Link>
  );
}
