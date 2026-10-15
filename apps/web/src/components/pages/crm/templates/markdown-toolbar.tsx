"use client";

import {
  Bold,
  Braces,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table,
  type LucideIcon,
} from "lucide-react";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Separator } from "@/components/primitives/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommandName } from "./markdown-commands";
import { TEMPLATE_VARIABLE_GROUPS, variableToken } from "./template-variables";

type ToolbarItem = { command: CommandName; icon: LucideIcon; label: string; shortcut?: string };

const GROUPS: ToolbarItem[][] = [
  [
    { command: "bold", icon: Bold, label: "Negrita", shortcut: "Ctrl+B" },
    { command: "italic", icon: Italic, label: "Cursiva", shortcut: "Ctrl+I" },
    { command: "strike", icon: Strikethrough, label: "Tachado" },
    { command: "code", icon: Code, label: "Código" },
  ],
  [
    { command: "h1", icon: Heading1, label: "Título 1" },
    { command: "h2", icon: Heading2, label: "Título 2" },
    { command: "h3", icon: Heading3, label: "Título 3" },
  ],
  [
    { command: "bullet", icon: List, label: "Lista" },
    { command: "numbered", icon: ListOrdered, label: "Lista numerada" },
    { command: "quote", icon: Quote, label: "Cita" },
  ],
  [
    { command: "link", icon: Link2, label: "Enlace", shortcut: "Ctrl+K" },
    { command: "table", icon: Table, label: "Tabla" },
    { command: "divider", icon: Minus, label: "Separador" },
  ],
];

interface MarkdownToolbarProps {
  onCommand: (command: CommandName) => void;
  onInsertVariable?: (token: string) => void;
  disabled?: boolean;
}

export function MarkdownToolbar({
  onCommand,
  onInsertVariable,
  disabled = false,
}: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-1.5 py-1">
      {GROUPS.map((group, index) => (
        <div key={index} className="flex items-center gap-0.5">
          {index > 0 ? (
            <Separator orientation="vertical" className="mx-1 h-5" />
          ) : null}
          {group.map((item) => (
            <Tooltip key={item.command}>
              <TooltipTrigger asChild>
                <PrimitiveButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={item.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onCommand(item.command)}
                >
                  <item.icon />
                </PrimitiveButton>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {item.label}
                {item.shortcut ? (
                  <span className="ml-1.5 opacity-60">{item.shortcut}</span>
                ) : null}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ))}

      {onInsertVariable ? (
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PrimitiveButton
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="gap-1.5 text-xs"
              >
                <Braces className="size-3.5" />
                Variables
              </PrimitiveButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
              {TEMPLATE_VARIABLE_GROUPS.map((group, index) => (
                <DropdownMenuGroup key={group.label}>
                  {index > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.variables.map((variable) => (
                    <DropdownMenuItem
                      key={variable.key}
                      onSelect={() => onInsertVariable(variableToken(variable.key))}
                      className="flex flex-col items-start gap-0"
                    >
                      <span className="text-sm">{variable.label}</span>
                      <code className="text-[11px] text-muted-foreground">
                        {variableToken(variable.key)}
                      </code>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
