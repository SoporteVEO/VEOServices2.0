import {
  FileText,
  LayoutDashboard,
  MonitorPlay,
  ShoppingCart,
  LucideIcon,
  Store,
  Users,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredRole?: string;
}

export interface NavGroup {
  /** Empty string = no label (e.g. top-level dashboard). */
  label: string;
  items: NavItem[];
}

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
      { title: "Contratos", href: "/dashboard/contracts", icon: FileText },
      { title: "Compras", href: "/dashboard/purchases", icon: ShoppingCart },
      {
        title: "Vallas digitales",
        href: "/dashboard/digital-billboards",
        icon: MonitorPlay,
      },
      { title: "E-Commerce", href: "/shop", icon: Store },
    ],
  },
  {
    label: "Ajustes",
    items: [{ title: "Usuarios", href: "/dashboard/users", icon: Users, requiredRole: "ADMIN" }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
