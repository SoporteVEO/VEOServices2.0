import type { LucideIcon } from "lucide-react";
import { FileText, LayoutGrid, Receipt, ScrollText } from "lucide-react";

export const MY_SPACE_BASE_PATH = "/dashboard/my-space";

export type MySpaceNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const MY_SPACE_NAV_ITEMS: MySpaceNavItem[] = [
  {
    title: "Mi Resumen",
    href: MY_SPACE_BASE_PATH,
    icon: LayoutGrid,
    description: "Resumen de tu espacio personal",
  },
  {
    title: "Mis contratos",
    href: `${MY_SPACE_BASE_PATH}/contracts`,
    icon: FileText,
    description: "Contratos vigentes asignados a tu nombre",
  },
  {
    title: "Mis cotizaciones",
    href: `${MY_SPACE_BASE_PATH}/offers`,
    icon: ScrollText,
    description: "Cotizaciones que has creado en la plataforma",
  },
  {
    title: "Mis facturas",
    href: `${MY_SPACE_BASE_PATH}/invoices`,
    icon: Receipt,
    description: "Facturación generada bajo tu nombre como vendedor",
  },
];

export const MY_OFFERS_DEFAULT_PAGE_SIZE = 25;
export const MY_OFFERS_SEARCH_PLACEHOLDER =
  "Buscar por número, cliente o correo...";
export const MY_OFFERS_EMPTY_MESSAGE = "No has creado cotizaciones aún.";

export const MY_SPACE_SIDEBAR_TITLE = "Navegación";

export const MY_ACTIVE_CONTRACTS_DEFAULT_PAGE_SIZE = 25;
export const MY_ACTIVE_CONTRACTS_SEARCH_PLACEHOLDER = "Buscar contrato";
export const MY_ACTIVE_CONTRACTS_EMPTY_MESSAGE =
  "No se encontraron contratos activos";
