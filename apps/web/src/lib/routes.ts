import {
  FileText,
  LayoutDashboard,
  MonitorPlay,
  ShoppingCart,
  LucideIcon,
  Store,
  Users,
  Monitor,
  Image
} from "lucide-react";
import { UserRole } from "@/api/users/users.types"

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredRole?: UserRole;
}

export interface NavGroup {
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
      { title: "Imágenes", href: "/dashboard/images", icon: Image },
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
    items: [{ title: "Usuarios", href: "/dashboard/users", icon: Users, requiredRole: "ADMIN" }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
