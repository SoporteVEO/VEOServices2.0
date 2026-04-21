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
} from "lucide-react";
import { UserRole } from "@/api/users/users.types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
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
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
        allowedRoles: ["ADMIN"],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function canRoleAccessItem(item: NavItem, role?: UserRole): boolean {
  const allowed = item.allowedRoles ?? DEFAULT_ALLOWED_ROLES;
  if (!role) return false;
  return allowed.includes(role);
}

export function filterNavGroupsByRole(
  groups: NavGroup[],
  role?: UserRole,
): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => canRoleAccessItem(i, role)),
    }))
    .filter((g) => g.items.length > 0);
}
