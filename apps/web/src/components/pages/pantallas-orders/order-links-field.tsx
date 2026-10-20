"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const MAX_ORDER_LINKS = 10;

export function OrderLinksField({
  links,
  onChange,
}: {
  links: string[];
  onChange: (links: string[]) => void;
}) {
  const update = (index: number, value: string) =>
    onChange(links.map((link, i) => (i === index ? value : link)));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-foreground/85">Enlace de descarga</p>
      {links.map((link, index) => (
        <div key={index} className="flex items-end gap-2">
          <Input
            label={`Arte ${index + 1}`}
            type="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={`https://drive.google.com/… (editables del arte ${index + 1})`}
            value={link}
            onChange={(e) => update(index, e.target.value)}
          />
          {links.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              icon={X}
              aria-label="Quitar este enlace"
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            />
          ) : null}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={Plus}
          disabled={links.length >= MAX_ORDER_LINKS}
          onClick={() => onChange([...links, ""])}
        >
          Agregar otro arte
        </Button>
        <p className="text-xs text-muted-foreground">
          Donde se descargan los editables del arte.
        </p>
      </div>
    </div>
  );
}
