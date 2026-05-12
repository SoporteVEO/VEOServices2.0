"use client";

import { CheckIcon, ChevronDown, ChevronsDown, Loader2 } from "lucide-react";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/primitives/ui/command";

export interface ComboboxOption {
  value: string | number;
  label: React.ReactNode;
  /** Used by cmdk for filtering when `label` is not a plain string. */
  filterValue?: string;
}

export type ComboboxSize = Exclude<
  NonNullable<VariantProps<typeof buttonVariants>["size"]>,
  "icon" | "icon-xs" | "icon-sm" | "icon-lg"
>;

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value?: string | number | null;
  isLoading?: boolean;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  addLabel?: string;
  onAdd?: () => void;
  required?: boolean;
  enableSearch?: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  onSearch?: (search: string) => void;
  emptyLabel?: string;
  preserveOptionOrder?: boolean;
  size?: ComboboxSize;
  leadingIcon?: React.ReactNode;
}

export function Combobox({
  label,
  options,
  value,
  isLoading = false,
  onChange,
  emptyLabel = "No se encontraron opciones.",
  placeholder = "Selecciona una opción",
  addLabel,
  onAdd,
  required = false,
  enableSearch = true,
  className,
  triggerClassName,
  disabled = false,
  onSearch,
  preserveOptionOrder = false,
  size = "default",
  leadingIcon,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const hasSelection = value !== undefined && value !== null && value !== "";

  const sortedOptions = preserveOptionOrder
    ? [...options]
    : [...options].sort((a, b) => {
        const sa =
          typeof a.label === "string"
            ? a.label
            : (a.filterValue ?? String(a.value));
        const sb =
          typeof b.label === "string"
            ? b.label
            : (b.filterValue ?? String(b.value));
        return sa.localeCompare(sb, undefined, { sensitivity: "base" });
      });

  const selectedLabel = hasSelection
    ? sortedOptions.find((option) => option.value === value)?.label
    : null;

  return (
    <div className={cn("flex flex-col", label ? "gap-2" : "gap-0", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start gap-2 px-2.5 font-medium hover:bg-muted hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
              triggerClassName,
            )}
            disabled={disabled}
          >
            {leadingIcon ? (
              <span className="shrink-0 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0">
                {leadingIcon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-left">
              {hasSelection ? selectedLabel : placeholder}
            </span>
            <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="min-w-(--radix-popover-trigger-width) w-max max-w-[min(100vw-2rem,36rem)] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command>
            {enableSearch && (
              <CommandInput
                placeholder={placeholder}
                onValueChange={(v: string) => onSearch?.(v)}
              />
            )}
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex h-10 w-full items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : (
                  emptyLabel
                )}
              </CommandEmpty>
              <CommandGroup>
                {addLabel && (
                  <CommandItem
                    value="add"
                    onSelect={() => {
                      onAdd?.();
                      setOpen(false);
                    }}
                  >
                    <span className="text-xs font-normal text-muted-foreground">
                      {addLabel}
                    </span>
                  </CommandItem>
                )}
                {!required && (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(undefined);
                      setOpen(false);
                    }}
                  >
                    <span className="opacity-70">{placeholder}</span>
                  </CommandItem>
                )}
                {sortedOptions.map((option) => {
                  const cmdkValue =
                    option.filterValue ??
                    (typeof option.label === "string"
                      ? option.label
                      : String(option.value));
                  return (
                    <CommandItem
                      key={String(option.value)}
                      value={cmdkValue}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 size-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
