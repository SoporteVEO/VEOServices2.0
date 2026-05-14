"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/primitives/ui/input";
import { Button } from "@/components/primitives/ui/button";
import { cn } from "@/lib/utils";

type NotificationsSearchProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function NotificationsSearch({
  value,
  onChange,
  className,
}: NotificationsSearchProps) {
  const hasValue = value.length > 0;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && hasValue) {
      event.preventDefault();
      event.stopPropagation();
      onChange("");
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute inset-s-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar por contrato, descripción..."
        aria-label="Buscar notificaciones"
        className="h-9 ps-8 pe-9 text-sm"
      />
      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute inset-e-1 top-1/2 -translate-y-1/2"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
