import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AcademyModuleButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="outline" sizeVariant="sm" className="gap-1.5">
      <Link href={href}>
        {label}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </Button>
  );
}
