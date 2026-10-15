"use client";

import { useMemo, useState } from "react";
import { MailPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCrmTemplates } from "@/api/crm/crm.get";
import {
  useDeleteCrmTemplate,
  useDuplicateCrmTemplate,
} from "@/api/crm/crm.mutations";
import type { CrmTemplate } from "@/api/crm/crm.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { errorMessage } from "../crm-format";
import { CrmTemplateCard } from "./crm-template-card";
import { CrmTemplateEditorDialog } from "./crm-template-editor-dialog";

type Filter = "all" | "mine" | "shared";

export function CrmTemplatesPage() {
  const { data: templates = [], isLoading } = useCrmTemplates();
  const duplicateTemplate = useDuplicateCrmTemplate();
  const deleteTemplate = useDeleteCrmTemplate();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CrmTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CrmTemplate | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter((template) => {
      if (filter === "mine" && !template.isOwner) return false;
      if (filter === "shared" && !template.isShared) return false;
      if (!term) return true;
      return [template.name, template.subject, template.category ?? ""].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [templates, filter, search]);

  function openEditor(template: CrmTemplate | null) {
    setEditing(template);
    setEditorOpen(true);
  }

  function handleDuplicate(template: CrmTemplate) {
    duplicateTemplate.mutate(
      { id: template.id },
      {
        onSuccess: (copy) => {
          toast.success("Plantilla duplicada");
          openEditor(copy);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo duplicar la plantilla.")),
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteTemplate.mutate(
      { id: pendingDelete.id },
      {
        onSuccess: () => {
          toast.success("Plantilla eliminada");
          setPendingDelete(null);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar la plantilla.")),
      },
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={filter}
            onValueChange={(next) => {
              if (next) setFilter(next as Filter);
            }}
          >
            <ToggleGroupItem value="all" className="px-3 data-[state=on]:bg-accent">
              Todas
            </ToggleGroupItem>
            <ToggleGroupItem value="mine" className="px-3 data-[state=on]:bg-accent">
              Mis plantillas
            </ToggleGroupItem>
            <ToggleGroupItem value="shared" className="px-3 data-[state=on]:bg-accent">
              Compartidas
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="w-full sm:w-64">
            <Input
              isSearch
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Button icon={Plus} onClick={() => openEditor(null)}>
          Nueva plantilla
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border py-16 text-center">
          <MailPlus className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {templates.length === 0 ? "Aún no tienes plantillas" : "Sin resultados"}
            </p>
            <p className="text-xs text-muted-foreground">
              Crea plantillas reutilizables para responder más rápido.
            </p>
          </div>
          {templates.length === 0 ? (
            <Button icon={Plus} variant="outline" onClick={() => openEditor(null)}>
              Crear mi primera plantilla
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((template) => (
            <CrmTemplateCard
              key={template.id}
              template={template}
              onEdit={openEditor}
              onDuplicate={handleDuplicate}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <CrmTemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar plantilla"
        description={pendingDelete ? `Se eliminará "${pendingDelete.name}".` : undefined}
        pending={deleteTemplate.isPending}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
