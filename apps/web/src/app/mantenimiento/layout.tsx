import type { Metadata, Viewport } from "next";
import { MaintenancePortalGuard } from "@/components/pages/maintenance-portal";

export const metadata: Metadata = {
  title: "Portal de mantenimiento · Veo",
  description: "Órdenes de mantenimiento de vallas estáticas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function MaintenancePortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MaintenancePortalGuard>{children}</MaintenancePortalGuard>;
}
