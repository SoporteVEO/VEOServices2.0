import type { Metadata, Viewport } from "next";
import { FieldPortalGuard } from "@/components/pages/field-portal";

export const metadata: Metadata = {
  title: "Mis órdenes · Veo",
  description: "Instalaciones y mantenimientos de vallas asignados",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <FieldPortalGuard>{children}</FieldPortalGuard>;
}
