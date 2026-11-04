"use client";

import { useState } from "react";
import { FileText, Save, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_ATTACHMENTS } from "@/api/feature-requests/feature-requests.const";
import { useUpdateFeatureRequest } from "@/api/feature-requests/feature-requests.mutations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  attachmentsProblem,
  FeatureRequestAttachmentsField,
} from "./feature-request-attachments-field";
import {
  FeatureRequestPdfField,
  fileProblem,
} from "./feature-request-pdf-field";
import {
  formatFileSize,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_SUMMARY_LENGTH,
  MIN_TITLE_LENGTH,
  PRIORITY_HINTS,
  PRIORITY_ORDER,
} from "./const";

type Props = {
  request: FeatureRequestDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeatureRequestEditDialog({
  request,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        {open ? (
          <EditForm request={request} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  request,
  onDone,
}: {
  request: FeatureRequestDetail;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(request.title);
  const [summary, setSummary] = useState(request.summary);
  const [priority, setPriority] = useState<FeatureRequestPriority>(
    request.priority,
  );
  const [file, setFile] = useState<File | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const update = useUpdateFeatureRequest(request.id);

  const hasChanges =
    title.trim() !== request.title ||
    summary.trim() !== request.summary ||
    priority !== request.priority ||
    file !== null ||
    newFiles.length > 0 ||
    removedIds.length > 0;
  const keptAttachments = request.extraAttachments.filter(
    (item) => !removedIds.includes(item.id),
  );
  const isValid =
    title.trim().length >= MIN_TITLE_LENGTH &&
    summary.trim().length >= MIN_SUMMARY_LENGTH &&
    fileProblem(file) === null &&
    attachmentsProblem(newFiles) === null;

  function handleSubmit() {
    update.mutate(
      {
        title: title.trim(),
        summary: summary.trim(),
        priority,
        file,
        attachments: newFiles,
        removeAttachmentIds: removedIds,
      },
      {
        onSuccess: () => {
          toast.success(`${request.ticket} actualizada`);
          onDone();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar {request.ticket}</DialogTitle>
        <DialogDescription>
          Los cambios quedan registrados en la actividad de la solicitud.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        <Input
          label="Título"
          required
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          label="Descripción"
          rows={6}
          maxLength={MAX_SUMMARY_LENGTH}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <Select
          label="Prioridad"
          value={priority}
          onValueChange={(value) =>
            setPriority(value as FeatureRequestPriority)
          }
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
        <div className="flex flex-col gap-2">
          <FeatureRequestPdfField
            file={file}
            onChange={setFile}
            disabled={update.isPending}
            label="Reemplazar formato en PDF"
            emptyLabel="Elegir un PDF nuevo"
            required={false}
          />
          {file ? null : (
            <p className="text-xs text-muted-foreground">
              Archivo actual: {request.attachment.fileName} ·{" "}
              {formatFileSize(request.attachment.fileSize)}
            </p>
          )}
        </div>
        {request.extraAttachments.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground/85">
              Archivos adicionales actuales
            </p>
            {keptAttachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Se quitarán todos los archivos adicionales.
              </p>
            ) : null}
            {keptAttachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border border-border bg-card p-3"
              >
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  sizeVariant="sm"
                  icon={X}
                  aria-label={`Quitar ${item.fileName}`}
                  disabled={update.isPending}
                  onClick={() => setRemovedIds((ids) => [...ids, item.id])}
                />
              </div>
            ))}
          </div>
        ) : null}
        <FeatureRequestAttachmentsField
          files={newFiles}
          onChange={setNewFiles}
          disabled={update.isPending}
          max={MAX_ATTACHMENTS - keptAttachments.length}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancelar
        </Button>
        <Button
          icon={Save}
          loading={update.isPending}
          disabled={!isValid || !hasChanges}
          onClick={handleSubmit}
        >
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  );
}
