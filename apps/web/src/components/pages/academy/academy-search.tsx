"use client";

import Link from "next/link";
import { useState } from "react";
import { CornerDownRight, SearchX } from "lucide-react";
import { useAcademySearch } from "@/api/academy/academy.get";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

export function AcademySearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const { data: results } = useAcademySearch(debounced);
  const showResults = query.trim().length >= 2;

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        isSearch
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='¿Qué quieres aprender? Ej. "enviar reporte mensual"'
        aria-label="Buscar en VEO Academy"
        className="h-11 bg-background text-[0.9375rem]"
      />
      {showResults ? (
        <div className="mt-2 overflow-hidden rounded-md border border-border bg-popover shadow-sm">
          {!results ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-border">
              {results.map((result) => (
                <li key={result.slug}>
                  <Link
                    href={result.section?.url ?? result.url}
                    className="block px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <p className="font-medium">{result.title}</p>
                    {result.section ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-info">
                        <CornerDownRight className="size-3" />
                        {result.section.title}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {result.snippet}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <SearchX className="size-4" />
              No encontramos guías para esa búsqueda. Prueba con otras palabras
              o pregúntale a Nexo.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
