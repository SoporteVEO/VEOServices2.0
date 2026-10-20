"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import type { SubRole, UserRole } from "@/api/users/users.types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/primitives/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { NAV_GROUPS, filterNavGroupsByAccess } from "@/lib/routes";
import {
  buildModuleSearchSections,
  filterModuleSearch,
} from "./module-search-items";

const SHORTCUT_KEY = "k";

export function ModuleSearch() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const userRole = sessionUser?.role as UserRole | undefined;
  const userSubRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];

  const sections = buildModuleSearchSections(
    filterNavGroupsByAccess(NAV_GROUPS, userRole, userSubRoles),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === SHORTCUT_KEY
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Buscar módulo"
            onClick={() => setOpen(true)}
          >
            <Search className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Buscar módulo · Ctrl + K</TooltipContent>
      </Tooltip>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar módulo"
        description="Escribe el nombre de un módulo para ir a él."
        showOverlay={false}
        className="top-1/2 -translate-y-1/2 sm:max-w-2xl"
      >
        <Command filter={filterModuleSearch} className="p-2">
          <CommandInput placeholder="Buscar módulo..." className="h-10" />
          <CommandList className="max-h-80">
            <CommandEmpty>No se encontraron módulos.</CommandEmpty>
            {sections.map((section) => (
              <CommandGroup
                key={section.label || section.items[0]?.href}
                heading={section.label || undefined}
              >
                {section.items.map((item) => (
                  <CommandItem
                    key={`${item.group}-${item.parent ?? ""}-${item.href}`}
                    value={item.value}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {item.parent ? (
                      <span className="text-xs text-muted-foreground">
                        {item.parent}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
