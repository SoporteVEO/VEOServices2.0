import type { AcademyHeading } from "@/api/academy/academy.types";
import { cn } from "@/lib/utils";

export function AcademyToc({ headings }: { headings: AcademyHeading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="En esta guía" className="text-sm">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        En esta guía
      </p>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block leading-snug text-muted-foreground transition-colors hover:text-foreground",
                heading.level === 3 && "pl-3 text-[0.8125rem]",
              )}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
