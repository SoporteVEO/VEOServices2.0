"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateCrmActivity } from "@/api/crm/crm.mutations";
import type {
  CrmContextQuery,
  CrmLoggableActivityType,
} from "@/api/crm/crm.types";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from "../crm-const";
import { errorMessage } from "../crm-format";

const TYPES: CrmLoggableActivityType[] = ["NOTE", "CALL", "MEETING"];

const PLACEHOLDERS: Record<CrmLoggableActivityType, string> = {
  NOTE: "Escribe una nota sobre este negocio...",
  CALL: "¿Qué se habló en la llamada?",
  MEETING: "Resumen de la reunión, acuerdos y próximos pasos...",
};

export function CrmActivityComposer({ context }: { context: CrmContextQuery }) {
  const [type, setType] = useState<CrmLoggableActivityType>("NOTE");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [duration, setDuration] = useState("");
  const createActivity = useCreateCrmActivity();

  const needsDetails = type !== "NOTE";

  function reset() {
    setSubject("");
    setBody("");
    setDuration("");
  }

  function handleSubmit() {
    if (!body.trim() && !subject.trim()) {
      toast.error("Escribe el contenido de la actividad.");
      return;
    }
    const minutes = duration ? Number(duration) : undefined;
    createActivity.mutate(
      {
        ...context,
        type,
        subject: needsDetails ? subject.trim() || undefined : undefined,
        body: body.trim() || undefined,
        durationMinutes:
          needsDetails && minutes && Number.isFinite(minutes) ? minutes : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${ACTIVITY_LABELS[type]} registrada`);
          reset();
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo registrar la actividad.")),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-border bg-card p-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={type}
        onValueChange={(next) => {
          if (next) setType(next as CrmLoggableActivityType);
        }}
      >
        {TYPES.map((value) => {
          const Icon = ACTIVITY_ICONS[value];
          return (
            <ToggleGroupItem
              key={value}
              value={value}
              className="gap-1.5 px-3 data-[state=on]:bg-accent data-[state=on]:text-foreground"
            >
              <Icon className="size-3.5" />
              {ACTIVITY_LABELS[value]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {needsDetails ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
          <Input
            placeholder={type === "CALL" ? "Asunto de la llamada" : "Asunto de la reunión"}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Input
            type="number"
            min={1}
            placeholder="Minutos"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      ) : null}

      <Textarea
        rows={3}
        placeholder={PLACEHOLDERS[type]}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          Ctrl + Enter para guardar
        </span>
        <Button
          sizeVariant="sm"
          onClick={handleSubmit}
          loading={createActivity.isPending}
        >
          Registrar
        </Button>
      </div>
    </div>
  );
}
