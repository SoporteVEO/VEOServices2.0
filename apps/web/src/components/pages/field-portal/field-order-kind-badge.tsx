import { Hammer, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";

export type FieldOrderKind = "installation" | "maintenance";

const KIND_CONFIG: Record<
  FieldOrderKind,
  { label: string; icon: LucideIcon; className: string }
> = {
  installation: {
    label: "Instalación",
    icon: Hammer,
    className:
      "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  maintenance: {
    label: "Mantenimiento",
    icon: Wrench,
    className:
      "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
};

export function FieldOrderKindBadge({ kind }: { kind: FieldOrderKind }) {
  const { label, icon: Icon, className } = KIND_CONFIG[kind];
  return (
    <Badge variant="outline" className={cn("gap-1 font-semibold", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
