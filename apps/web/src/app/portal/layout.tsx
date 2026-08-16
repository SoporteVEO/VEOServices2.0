import type { Metadata, Viewport } from "next";
import { InstallerPortalGuard } from "@/components/pages/installer-portal";

export const metadata: Metadata = {
  title: "Portal de instalación · Veo",
  description: "Registro de instalaciones de vallas estáticas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <InstallerPortalGuard>{children}</InstallerPortalGuard>;
}
