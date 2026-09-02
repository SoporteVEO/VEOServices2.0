"use client";

import { Badge } from "@/components/primitives/ui/badge";

/**
 * Categories carry a user-chosen hex colour, so the badge is tinted inline
 * rather than through a fixed palette map.
 */
export function MaintenanceCategoryBadge({
  category,
}: {
  category: { name: string; color: string | null } | null;
}) {
  if (!category) {
    return <span className="text-xs text-muted-foreground">Sin categoría</span>;
  }

  const color = category.color;
  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap font-medium"
      style={
        color
          ? {
              borderColor: `${color}80`,
              backgroundColor: `${color}1a`,
              color,
            }
          : undefined
      }
    >
      {category.name}
    </Badge>
  );
}
