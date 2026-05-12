"use client";

import { CheckIcon, ChevronDown, Loader2 } from "lucide-react";
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
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

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
  /** Fires whenever the search input changes. */
  onSearch?: (search: string) => void;
  emptyLabel?: string;
  preserveOptionOrder?: boolean;
  size?: ComboboxSize;
  leadingIcon?: React.ReactNode;
  /** When true, disables cmdk's internal filter and renders options as-is (use with server-side search). */
  manualFilter?: boolean;
  /** Whether more pages are available for infinite scroll. */
  hasMore?: boolean;
  /** Called when the bottom sentinel becomes visible. */
  onLoadMore?: () => void;
  /** Whether the next page is currently being loaded. */
  isLoadingMore?: boolean;
  /** Fallback option used to render the trigger label when `value` is not in `options` (e.g. server-side mode). */
  selectedOption?: ComboboxOption | null;
  /** Notifies the parent when the popover open state changes. */
  onOpenChange?: (open: boolean) => void;
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
  manualFilter = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  selectedOption,
  onOpenChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  const hasSelection = value !== undefined && value !== null && value !== "";

  const sortedOptions =
    preserveOptionOrder || manualFilter
      ? options
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
    ? (sortedOptions.find((option) => option.value === value)?.label ??
      (selectedOption && selectedOption.value === value
        ? selectedOption.label
        : null))
    : null;

  const sentinelRef = useIntersectionObserver<HTMLDivElement>(
    () => {
      if (hasMore && !isLoadingMore) onLoadMore?.();
    },
    {
      enabled: open && hasMore && !isLoadingMore && Boolean(onLoadMore),
      rootMargin: "120px",
    },
  );

  return (
    <div className={cn("flex flex-col", label ? "gap-2" : "gap-0", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
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
          <Command shouldFilter={!manualFilter}>
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
                    value="__add__"
                    keywords={[addLabel]}
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
                    keywords={[placeholder]}
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

                {hasMore ? (
                  <div
                    ref={sentinelRef}
                    className="flex h-9 items-center justify-center text-xs text-muted-foreground"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <span className="opacity-0">cargar más</span>
                    )}
                  </div>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
