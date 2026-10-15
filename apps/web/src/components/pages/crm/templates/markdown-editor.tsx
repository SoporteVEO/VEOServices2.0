"use client";

import { useRef, useState } from "react";
import { Columns2, Eye, PencilLine } from "lucide-react";
import type { CrmTemplateVariables } from "@/api/crm/crm.types";
import { Textarea } from "@/components/primitives/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  COMMANDS,
  insertText,
  type CommandName,
  type MarkdownCommand,
} from "./markdown-commands";
import { MarkdownPreview } from "./markdown-preview";
import { MarkdownToolbar } from "./markdown-toolbar";
import { applyVariables } from "./template-variables";

type ViewMode = "write" | "split" | "preview";

const SHORTCUTS: Record<string, CommandName> = {
  b: "bold",
  i: "italic",
  k: "link",
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Values substituted into `{{variables}}` in the preview pane. */
  previewVariables?: CrmTemplateVariables;
  showVariables?: boolean;
  defaultMode?: ViewMode;
  compact?: boolean;
  actions?: React.ReactNode;
  className?: string;
  editorClassName?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = "Escribe tu mensaje en Markdown...",
  previewVariables,
  showVariables = true,
  defaultMode = "split",
  compact = false,
  actions,
  className,
  editorClassName,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  function apply(command: MarkdownCommand) {
    const textarea = textareaRef.current;
    const state = {
      value,
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    };
    const next = command(state);
    onChange(next.value);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.start, next.end);
    });
  }

  function handleCommand(name: CommandName) {
    if (mode === "preview") setMode("split");
    apply(COMMANDS[name]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const command = SHORTCUTS[event.key.toLowerCase()];
    if (!command) return;
    event.preventDefault();
    apply(COMMANDS[command]);
  }

  const preview = previewVariables ? applyVariables(value, previewVariables) : value;
  const paneHeight = compact ? "min-h-32" : "min-h-64";

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <span className="text-xs font-semibold text-foreground/85">{label}</span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {actions}
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={mode}
            onValueChange={(next) => {
              if (next) setMode(next as ViewMode);
            }}
          >
            <ToggleGroupItem value="write" aria-label="Editor" className="gap-1 px-2.5 text-xs">
              <PencilLine className="size-3.5" />
              Editar
            </ToggleGroupItem>
            <ToggleGroupItem
              value="split"
              aria-label="Dividir"
              className="hidden gap-1 px-2.5 text-xs md:inline-flex"
            >
              <Columns2 className="size-3.5" />
              Dividir
            </ToggleGroupItem>
            <ToggleGroupItem value="preview" aria-label="Vista previa" className="gap-1 px-2.5 text-xs">
              <Eye className="size-3.5" />
              Vista previa
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-input",
          editorClassName,
        )}
      >
        {mode !== "preview" ? (
          <MarkdownToolbar
            onCommand={handleCommand}
            onInsertVariable={
              showVariables ? (token) => apply(insertText(token)) : undefined
            }
          />
        ) : null}
        <div
          className={cn(
            "grid min-h-0 flex-1",
            mode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {mode !== "preview" ? (
            <Textarea
              ref={textareaRef}
              value={value}
              placeholder={placeholder}
              spellCheck
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "field-sizing-fixed h-full resize-none rounded-none border-0 bg-transparent px-3 py-2.5 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0",
                paneHeight,
              )}
            />
          ) : null}
          {mode !== "write" ? (
            <div
              className={cn(
                "overflow-y-auto bg-card px-5 py-4",
                paneHeight,
                mode === "split" && "border-t border-border md:border-t-0 md:border-l",
              )}
            >
              <MarkdownPreview markdown={preview} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
