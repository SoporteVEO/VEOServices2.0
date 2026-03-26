export const roleBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  ADMIN: { label: "Admin", variant: "destructive" },
  USER: {
    label: "Usuario",
    variant: "outline",
    className:
      "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
};