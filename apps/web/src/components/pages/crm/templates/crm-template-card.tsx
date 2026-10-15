"use client";

import { Copy, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import type { CrmTemplate } from "@/api/crm/crm.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { personName, timeAgo } from "../crm-format";
import { MarkdownPreview } from "./markdown-preview";
import { applyVariables, SAMPLE_VARIABLES } from "./template-variables";

interface Props {
  template: CrmTemplate;
  onEdit: (template: CrmTemplate) => void;
  onDuplicate: (template: CrmTemplate) => void;
  onDelete: (template: CrmTemplate) => void;
}

export function CrmTemplateCard({ template, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <article className="group flex min-h-64 flex-col border border-border bg-card transition-colors hover:border-border-strong">
      <header className="flex items-start justify-between gap-2 border-b border-border p-3">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={() => (template.isOwner ? onEdit(template) : onDuplicate(template))}
        >
          <h3 className="truncate text-sm font-semibold">{template.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{template.subject}</p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PrimitiveButton variant="ghost" size="icon-xs" aria-label="Acciones">
              <MoreHorizontal />
            </PrimitiveButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {template.isOwner ? (
              <DropdownMenuItem onSelect={() => onEdit(template)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => onDuplicate(template)}>
              <Copy className="size-4" />
              Duplicar
            </DropdownMenuItem>
            {template.isOwner ? (
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(template)}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="relative max-h-40 flex-1 overflow-hidden px-3 py-2">
        <MarkdownPreview
          markdown={applyVariables(template.body, SAMPLE_VARIABLES)}
          className="pointer-events-none origin-top-left scale-90 text-xs opacity-80"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>

      <footer className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        {template.category ? <Badge variant="secondary">{template.category}</Badge> : null}
        {template.isShared ? (
          <Badge variant="outline" className="gap-1">
            <Users className="size-3" />
            Compartida
          </Badge>
        ) : null}
        <span className="ml-auto">
          {template.isOwner ? "Tuya" : personName(template.owner)} · usada {template.usageCount}{" "}
          {template.usageCount === 1 ? "vez" : "veces"} · {timeAgo(template.updatedAt)}
        </span>
      </footer>
    </article>
  );
}
