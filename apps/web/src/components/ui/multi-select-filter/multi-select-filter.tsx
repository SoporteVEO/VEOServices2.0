"use client";

import * as React from "react";
import { CheckIcon, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/primitives/ui/command";

export interface MultiSelectFilterOption {
  value: string;
  label: string;
  /** Rendered right-aligned, e.g. how many rows match this option. */
  count?: number;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectFilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Collapse the trigger to "N seleccionados" past this many chips. */
  maxChips?: number;
  enableSearch?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Filters a table by any number of values at once. Used where a report has to
 * cover a few specific zones rather than the whole inventory, so the selection
 * has to be additive.
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  maxChips = 2,
  enableSearch = true,
  emptyLabel = "Sin resultados.",
  disabled = false,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);
  const selected = new Set(value);

  function toggle(optionValue: string) {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    // Keep the caller's order stable and predictable for query keys.
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  }

  const selectedOptions = options.filter((o) => selected.has(o.value));

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-start gap-2 px-2.5 font-medium", className)}
        >
          <span className={cn(selected.size === 0 && "text-muted-foreground")}>
            {label}
          </span>

          {selectedOptions.length > 0 ? (
            <span className="flex items-center gap-1">
              {selectedOptions.length > maxChips ? (
                <Badge variant="secondary" className="rounded-sm px-1.5">
                  {selectedOptions.length} seleccionados
                </Badge>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="max-w-32 truncate rounded-sm px-1.5"
                  >
                    {option.label}
                  </Badge>
                ))
              )}
            </span>
          ) : null}

          <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="min-w-(--radix-popover-trigger-width) w-max max-w-[min(100vw-2rem,24rem)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          {enableSearch ? <CommandInput placeholder={label} /> : null}
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggle(option.value)}
                  className="cursor-pointer"
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      selected.has(option.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {option.count != null ? (
                    <span className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {option.count}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>

            {selected.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => onChange([])}
                    className="cursor-pointer justify-center text-center text-xs"
                  >
                    Limpiar selección
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
