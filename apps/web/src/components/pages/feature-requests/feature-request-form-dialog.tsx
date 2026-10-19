"use client";

import { useState } from "react";
import { Download, Send } from "lucide-react";
import { toast } from "sonner";
import { useCollaboratorOptions } from "@/api/feature-requests/feature-requests.get";
import { useCreateFeatureRequest } from "@/api/feature-requests/feature-requests.mutations";
import type {
  FeatureRequestDetail,
  FeatureRequestPriority,
} from "@/api/feature-requests/feature-requests.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FeatureRequestPdfField,
  fileProblem,
} from "./feature-request-pdf-field";
import {
  FEATURE_REQUEST_TEMPLATE_NAME,
  FEATURE_REQUEST_TEMPLATE_URL,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_SUMMARY_LENGTH,
  MIN_TITLE_LENGTH,
  PRIORITY_HINTS,
  PRIORITY_ORDER,
  userName,
} from "./const";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (request: FeatureRequestDetail) => void;
};

export function FeatureRequestFormDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        {open ? (
          <RequestForm
            onDone={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  onDone,
  onCreated,
}: {
  onDone: () => void;
  onCreated: (request: FeatureRequestDetail) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<FeatureRequestPriority>("MEDIUM");
  const [file, setFile] = useState<File | null>(null);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  const { data: users = [] } = useCollaboratorOptions();
  const create = useCreateFeatureRequest();

  const isValid =
    title.trim().length >= MIN_TITLE_LENGTH &&
    summary.trim().length >= MIN_SUMMARY_LENGTH &&
    file !== null &&
    fileProblem(file) === null;

  function handleSubmit() {
    if (!file) return;
    create.mutate(
      {
        title: title.trim(),
        summary: summary.trim(),
        priority,
        file,
        collaboratorIds,
      },
      {
        onSuccess: (request) => {
          toast.success(`Solicitud ${request.ticket} enviada al equipo`);
          onDone();
          onCreated(request);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva solicitud de funcionalidad</DialogTitle>
        <DialogDescription>
          Cuéntanos qué necesitas. El equipo de desarrollo la revisará y te
          avisaremos de cada avance.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        <ol className="flex flex-col gap-3 border border-border bg-muted/30 p-4 text-sm">
          <li className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <strong className="font-semibold">1.</strong> Descarga el
              formato y llénalo con tu solicitud.
            </span>
            <Button variant="outline" sizeVariant="sm" asChild>
              <a
                href={FEATURE_REQUEST_TEMPLATE_URL}
                download={FEATURE_REQUEST_TEMPLATE_NAME}
              >
                <Download className="size-4" />
                Descargar formato
              </a>
            </Button>
          </li>
          <li>
            <strong className="font-semibold">2.</strong> Expórtalo o guárdalo
            como <strong className="font-semibold">PDF</strong>.
          </li>
          <li>
            <strong className="font-semibold">3.</strong> Súbelo aquí junto con
            un título y un resumen corto.
          </li>
        </ol>

        <Input
          label="Título"
          required
          placeholder="Ej.: Recordatorio de contratos por vencer"
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          label="Resumen"
          placeholder="¿Qué necesitas y por qué? En pocas líneas."
          rows={4}
          maxLength={MAX_SUMMARY_LENGTH}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <Select
          label="Prioridad sugerida"
          value={priority}
          onValueChange={(value) => setPriority(value as FeatureRequestPriority)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {PRIORITY_HINTS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FeatureRequestPdfField
          file={file}
          onChange={setFile}
          disabled={create.isPending}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-foreground/85">
            Colaboradores (opcional)
          </p>
          <MultiSelectFilter
            label="Agregar personas"
            options={users.map((user) => ({
              value: user.id,
              label: userName(user),
            }))}
            value={collaboratorIds}
            onChange={setCollaboratorIds}
            emptyLabel="No hay personas disponibles."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Verán la solicitud, recibirán sus avisos y también firmarán la
            aprobación final.
          </p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button
          icon={Send}
          loading={create.isPending}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          {create.isPending ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </DialogFooter>
    </>
  );
}
