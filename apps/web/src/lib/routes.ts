import {
  FileText,
  LayoutDashboard,
  ShoppingCart,
  LucideIcon,
  Store,
  Users,
  Image,
  SquareChartGantt,
  BookUser,
  ChartArea,
  House,
  Banknote,
  Factory,
  Wrench,
  Car,
  Bug,
  GraduationCap,
  Handshake,
  Kanban,
  MapPinned,
  RefreshCw,
  Building2,
  Contact,
  ListTodo,
  MailPlus,
  Settings,
  BookOpen,
  Megaphone,
  Calculator,
  Landmark,
  HandCoins,
  ReceiptText,
  ClipboardList,
  Lightbulb,
} from "lucide-react";
import {
  IMAGES_MODULE_FIELD_ROLES,
  isPortalOnlyRole,
  SubRole,
  UserRole,
} from "@/api/users/users.types";
import { DIGITAL_BILLBOARD_ICON, STATIC_BILLBOARD_ICON } from "@/lib/billboard-icons";
import { portalHome } from "@/lib/portal-access";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
  requiredSubRoles?: SubRole[];
  /** Renders the item as a collapsible submenu; access is decided per child. */
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const DEFAULT_ALLOWED_ROLES: UserRole[] = ["ADMIN", "USER"];

/**
 * Named apart from the group because the field portals link to it directly:
 * it is the one dashboard module a portal-only role can open.
 */
export const IMAGES_NAV_ITEM: NavItem = {
  title: "Imágenes",
  href: "/dashboard/images",
  icon: Image,
  allowedRoles: ["ADMIN", "USER", "LIMITED", ...IMAGES_MODULE_FIELD_ROLES],
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN"], },
      { title: "Mi Espacio", href: "/dashboard/my-space", icon: House, allowedRoles: ["USER", "ADMIN"], },
      { title: "Veo Academy", href: "/dashboard/academy", icon: BookOpen, allowedRoles: ["USER", "ADMIN"], },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Analíticas",
        href: "/dashboard/analytics",
        icon: ChartArea,
        allowedRoles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Módulos",
    items: [
      { title: "Testigos", href: "/dashboard/reports", icon: SquareChartGantt },
      { title: "Contratos", href: "/dashboard/contracts", icon: FileText },
      {
        title: "Pantallas",
        href: "/dashboard/pantallas",
        icon: DIGITAL_BILLBOARD_ICON,
        allowedRoles: [],
        requiredSubRoles: ["PANTALLAS_PRODUCCION", "PANTALLAS_COMERCIAL"],
      },
      {
        title: "Producción Pantallas",
        href: "/dashboard/produccion-pantallas",
        icon: ClipboardList,
        allowedRoles: [],
        requiredSubRoles: ["PANTALLAS_PRODUCCION", "PANTALLAS_COMERCIAL"],
      },
      {
        title: "Vallas",
        href: "/dashboard/static-billboards",
        icon: STATIC_BILLBOARD_ICON,
      },
      IMAGES_NAV_ITEM,
      {
        title: "Recursos Humanos",
        href: "/dashboard/rh",
        icon: BookUser,
        allowedRoles: [],
        requiredSubRoles: ["HR"],
      },
      {
        title: "Producción",
        href: "/dashboard/production",
        icon: Factory,
        allowedRoles: [],
        requiredSubRoles: ["PRODUCTION"],
      },
      {
        title: "Mantenimiento",
        href: "/dashboard/mantenimiento",
        icon: Wrench,
        children: [
          {
            title: "Vallas",
            href: "/dashboard/mantenimiento",
            icon: STATIC_BILLBOARD_ICON,
            allowedRoles: [],
            requiredSubRoles: ["MANTENIMIENTO"],
          },
          {
            title: "Pantallas",
            href: "/dashboard/mantenimiento/pantallas",
            icon: DIGITAL_BILLBOARD_ICON,
            allowedRoles: [],
            requiredSubRoles: ["MANTENIMIENTO"],
          },
          {
            title: "Flota",
            href: "/dashboard/mantenimiento/flota",
            icon: Car,
            allowedRoles: [],
            requiredSubRoles: ["MANTENIMIENTO"],
          },
        ],
      },
    ],
  },
  {
    label: "Ventas",
    items: [
      {
        title: "CRM",
        href: "/dashboard/crm",
        icon: Handshake,
        children: [
          {
            title: "Resumen",
            href: "/dashboard/crm",
            icon: LayoutDashboard,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Pipeline",
            href: "/dashboard/crm/pipeline",
            icon: Kanban,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Disponibilidad",
            href: "/dashboard/crm/disponibilidad",
            icon: MapPinned,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Renovaciones",
            href: "/dashboard/crm/renovaciones",
            icon: RefreshCw,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Clientes",
            href: "/dashboard/crm/clientes",
            icon: Building2,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Contactos",
            href: "/dashboard/crm/contactos",
            icon: Contact,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Tareas",
            href: "/dashboard/crm/tareas",
            icon: ListTodo,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Plantillas",
            href: "/dashboard/crm/plantillas",
            icon: MailPlus,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
          {
            title: "Ajustes",
            href: "/dashboard/crm/ajustes",
            icon: Settings,
            allowedRoles: [],
            requiredSubRoles: ["VENTAS"],
          },
        ],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        title: "Contabilidad",
        href: "/dashboard/finanzas/contabilidad",
        icon: Calculator,
        allowedRoles: [],
        requiredSubRoles: ["CONTABILIDAD"],
      },
      {
        title: "Bancos",
        href: "/dashboard/finanzas/bancos",
        icon: Landmark,
        allowedRoles: [],
        requiredSubRoles: ["FINANZAS"],
      },
      {
        title: "Cuentas por cobrar",
        href: "/dashboard/finanzas/cuentas-por-cobrar",
        icon: HandCoins,
        allowedRoles: [],
        requiredSubRoles: ["FINANZAS"],
      },
      {
        title: "Facturación",
        href: "/dashboard/finanzas/facturacion",
        icon: ReceiptText,
        allowedRoles: [],
        requiredSubRoles: ["FACTURACION"],
      },
    ],
  },
  {
    label: "Tienda",
    items: [
      { title: "E-Commerce", href: "/shop", icon: Store },
      { title: "Ordenes", href: "/dashboard/purchases", icon: ShoppingCart },
    ],
  },
  {
    label: "Herramientas",
    items: [
      {
        title: "CxC",
        href: "/dashboard/tools/recovery",
        icon: Banknote,
        allowedRoles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Desarrollo",
    items: [
      {
        title: "Errores de Nexo",
        href: "/dashboard/desarrollo",
        icon: Bug,
        allowedRoles: [],
        requiredSubRoles: ["DESARROLLADOR"],
      },
      {
        title: "Aprendizaje de Nexo",
        href: "/dashboard/desarrollo/aprendizaje",
        icon: GraduationCap,
        allowedRoles: [],
        requiredSubRoles: ["DESARROLLADOR"],
      },
      {
        title: "Solicitudes de funcionalidad",
        href: "/dashboard/desarrollo/solicitudes",
        icon: ClipboardList,
        allowedRoles: [],
        requiredSubRoles: ["DESARROLLADOR"],
      },
    ],
  },
  {
    label: "Ajustes",
    items: [
      {
        title: "Usuarios",
        href: "/dashboard/users",
        icon: Users,
        allowedRoles: [],
        requiredSubRoles: ["USERS_MANAGEMENT"],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        title: "Actualizaciones",
        href: "/dashboard/actualizaciones",
        icon: Megaphone,
        allowedRoles: ["ADMIN", "USER", "LIMITED", ...IMAGES_MODULE_FIELD_ROLES],
      },
      {
        title: "Solicitar funcionalidad",
        href: "/dashboard/solicitudes",
        icon: Lightbulb,
        allowedRoles: ["ADMIN", "USER", "LIMITED", ...IMAGES_MODULE_FIELD_ROLES],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) =>
  group.items.flatMap((item) => item.children ?? [item]),
);

const SYSTEM_PATHS = ["/dashboard/me"];

export function canAccessItem(
  item: NavItem,
  role?: UserRole,
  subRoles?: SubRole[],
): boolean {
  if (!role) return false;

  const allowedRoles = item.allowedRoles ?? DEFAULT_ALLOWED_ROLES;
  const hasRoleAccess = allowedRoles.includes(role);

  const requiredSubRoles = item.requiredSubRoles ?? [];
  const hasSubRoleAccess =
    requiredSubRoles.length > 0 &&
    requiredSubRoles.some((sr) => subRoles?.includes(sr));

  return hasRoleAccess || hasSubRoleAccess;
}

export function filterNavGroupsByAccess(
  groups: NavGroup[],
  role?: UserRole,
  subRoles?: SubRole[],
): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.flatMap((item): NavItem[] => {
        if (!item.children) {
          return canAccessItem(item, role, subRoles) ? [item] : [];
        }
        const children = item.children.filter((child) =>
          canAccessItem(child, role, subRoles),
        );
        return children.length > 0 ? [{ ...item, children }] : [];
      }),
    }))
    .filter((g) => g.items.length > 0);
}

export function isUnderPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isSystemPath(pathname: string): boolean {
  return SYSTEM_PATHS.some((p) => isUnderPath(pathname, p));
}

export function findNavItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((i) => isUnderPath(pathname, i.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

export function findFirstAccessibleItem(
  role?: UserRole,
  subRoles?: SubRole[],
): NavItem | undefined {
  return NAV_ITEMS.find((i) => canAccessItem(i, role, subRoles));
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; redirectTo: string };

export function resolvePathAccess(
  pathname: string,
  role?: UserRole,
  subRoles?: SubRole[],
): AccessResult {
  if (isSystemPath(pathname)) return { allowed: true };

  const item = findNavItemForPath(pathname);

  if (item && canAccessItem(item, role, subRoles)) {
    return { allowed: true };
  }

  // A portal-only role owns at most a module or two here, so anything it is not
  // named on drops it back into the portal rather than onto another module.
  if (isPortalOnlyRole(role)) {
    return { allowed: false, redirectTo: portalHome() };
  }

  const fallback = findFirstAccessibleItem(role, subRoles);
  return { allowed: false, redirectTo: fallback?.href ?? "/dashboard/me" };
}
