import type { LucideIcon } from "lucide-react";

import type { NavGroup } from "@/lib/routes";

export interface ModuleSearchItem {
  href: string;
  title: string;
  icon: LucideIcon;
  group: string;
  parent?: string;
  value: string;
}

export interface ModuleSearchSection {
  label: string;
  items: ModuleSearchItem[];
}

export function buildModuleSearchSections(
  groups: NavGroup[],
): ModuleSearchSection[] {
  return groups.map((group) => ({
    label: group.label,
    items: group.items.flatMap((item) => {
      const entries = item.children
        ? item.children.map((child) => ({ child, parent: item.title }))
        : [{ child: item, parent: undefined }];

      return entries.map(({ child, parent }) => ({
        href: child.href,
        title: child.title,
        icon: child.icon,
        group: group.label,
        parent,
        value: [group.label, parent, child.title].filter(Boolean).join(" "),
      }));
    }),
  }));
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filterModuleSearch(value: string, search: string): number {
  const haystack = normalize(value);
  const tokens = normalize(search).split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token)) ? 1 : 0;
}
