"use client";

import {
  Controller,
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type {
  MentorshipStartOutcome,
  PreviousStart,
} from "@/api/mentorships/mentorships.types";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  KSS_FIELDS,
  MAX_TEXT_LENGTH,
  OUTCOME_LABELS,
  OUTCOME_ORDER,
  OUTCOME_STYLES,
  formatDay,
} from "./const";
import { FieldError, requiredText } from "./form-helpers";
import type { SessionFormValues } from "./session-form-values";

type Props = {
  previousStart: PreviousStart & { commitment?: string };
  control: Control<SessionFormValues>;
  register: UseFormRegister<SessionFormValues>;
  disabled?: boolean;
};

export function PreviousStartSummary({
  previousStart,
}: {
  previousStart: PreviousStart & { commitment?: string };
}) {
  return (
    <div className="flex flex-col gap-2 border-l-4 border-l-sky-500 bg-muted/40 p-3">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Start de la sesión N.º {previousStart.sessionNumber} ·{" "}
        {formatDay(previousStart.sessionDate)}
      </p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        {KSS_FIELDS.map((field) => (
          <div key={field.key} className="contents">
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="whitespace-pre-wrap">{previousStart[field.key]}</dd>
          </div>
        ))}
        {previousStart.commitment ? (
          <div className="contents">
            <dt className="text-muted-foreground">Compromiso</dt>
            <dd className="whitespace-pre-wrap">{previousStart.commitment}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function PreviousStartEvaluation({
  previousStart,
  control,
  register,
  disabled,
}: Props) {
  const { errors } = useFormState({
    control,
    name: ["previousStartOutcome", "previousStartEvidence"],
  });
  return (
    <fieldset className="flex flex-col gap-3 border border-border p-4">
      <legend className="sr-only">Seguimiento del Start anterior</legend>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">Seguimiento del Start anterior</p>
        <p className="text-xs text-muted-foreground">
          Antes de acordar algo nuevo, evalúa si cumplió lo que se propuso.
        </p>
      </div>
      <PreviousStartSummary previousStart={previousStart} />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-foreground/85">
          ¿Cumplió el Start?<span className="ml-1 text-red-500">*</span>
        </p>
        <Controller
          control={control}
          name="previousStartOutcome"
          rules={{ required: "Selecciona Sí, Parcial o No" }}
          render={({ field }) => (
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={field.value}
              disabled={disabled}
              onValueChange={(next) => {
                if (next) field.onChange(next as MentorshipStartOutcome);
              }}
              className="w-full sm:w-fit"
            >
              {OUTCOME_ORDER.map((outcome) => (
                <ToggleGroupItem
                  key={outcome}
                  value={outcome}
                  className={cn(
                    "flex-1 px-6 sm:flex-none",
                    field.value === outcome && OUTCOME_STYLES[outcome],
                  )}
                >
                  {OUTCOME_LABELS[outcome]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
        <FieldError message={errors.previousStartOutcome?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <Textarea
          label={
            <>
              Evidencia<span className="ml-1 text-red-500">*</span>
            </>
          }
          placeholder="Hechos o datos que respaldan la evaluación"
          rows={3}
          maxLength={MAX_TEXT_LENGTH}
          disabled={disabled}
          aria-invalid={!!errors.previousStartEvidence}
          {...register("previousStartEvidence", requiredText)}
        />
        <FieldError message={errors.previousStartEvidence?.message} />
      </div>
    </fieldset>
  );
}
