import {
  FileText,
  LayoutDashboard,
  MonitorPlay,
  ShoppingCart,
  LucideIcon,
  Store,
  Users,
  Monitor,
  Image,
  SquareChartGantt,
  BookUser,
  ChartArea,
} from "lucide-react";
import { SubRole, UserRole } from "@/api/users/users.types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
  requiredSubRoles?: SubRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const DEFAULT_ALLOWED_ROLES: UserRole[] = ["ADMIN", "USER"];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN"], },
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
      { title: "Reportes", href: "/dashboard/reports", icon: SquareChartGantt },
      { title: "Contratos", href: "/dashboard/contracts", icon: FileText },
      {
        title: "Vallas digitales",
        href: "/dashboard/digital-billboards",
        icon: MonitorPlay,
      },
      {
        title: "Vallas estáticas",
        href: "/dashboard/static-billboards",
        icon: Monitor,
      },
      {
        title: "Imágenes",
        href: "/dashboard/images",
        icon: Image,
        allowedRoles: ["ADMIN", "USER", "LIMITED"],
      },
      {
        title: "Recursos Humanos",
        href: "/dashboard/rh",
        icon: BookUser,
        allowedRoles: [],
        requiredSubRoles: ["HR"],
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
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

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
      items: g.items.filter((i) => canAccessItem(i, role, subRoles)),
    }))
    .filter((g) => g.items.length > 0);
}

function isUnderPath(pathname: string, base: string): boolean {
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

  const fallback = findFirstAccessibleItem(role, subRoles);
  return { allowed: false, redirectTo: fallback?.href ?? "/dashboard/me" };
}
