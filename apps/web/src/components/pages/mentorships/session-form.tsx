"use client";

import { addDays } from "date-fns";
import { Save } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { PreviousStart } from "@/api/mentorships/mentorships.types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormSection } from "@/components/ui/form-section";
import { Textarea } from "@/components/ui/textarea";
import { parseYYYYMMDD, toYYYYMMDD } from "@/lib/format";
import { KSS_ORDER, MAX_TEXT_LENGTH } from "./const";
import { FieldError, requiredText } from "./form-helpers";
import { KssFieldset } from "./kss-fieldset";
import { PreviousStartEvaluation } from "./previous-start-evaluation";
import type { SessionFormValues } from "./session-form-values";

export type SessionFormHeader = {
  collaboratorName: string;
  position: string | null;
  department: string | null;
  mentorName: string;
  sessionNumber: number;
};

type Props = {
  header: SessionFormHeader;
  defaultValues: SessionFormValues;
  previousStart: (PreviousStart & { commitment?: string }) | null;
  minSessionDate: Date | null;
  maxSessionDate: Date;
  requireReason: boolean;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (values: SessionFormValues) => void;
  onCancel: () => void;
};

export function SessionForm({
  header,
  defaultValues,
  previousStart,
  minSessionDate,
  maxSessionDate,
  requireReason,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormValues>({ defaultValues });

  const sessionDate = parseYYYYMMDD(
    useWatch({ control, name: "sessionDate" }),
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <DialogBody className="space-y-5">
        <FormSection title="Datos de la sesión">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-border bg-muted/30 p-3 text-sm sm:grid-cols-3">
            <HeaderItem label="Colaborador" value={header.collaboratorName} />
            <HeaderItem label="Cargo" value={header.position} />
            <HeaderItem label="Área/Gerencia" value={header.department} />
            <HeaderItem label="Mentor (jefe directo)" value={header.mentorName} />
            <HeaderItem label="Sesión" value={`N.º ${header.sessionNumber}`} />
          </dl>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name="sessionDate"
                rules={{ required: "Indica la fecha de la sesión" }}
                render={({ field }) => (
                  <DatePicker
                    label="Fecha de la sesión"
                    required
                    disabled={isPending}
                    minDate={minSessionDate ?? undefined}
                    maxDate={maxSessionDate}
                    value={parseYYYYMMDD(field.value)}
                    onChange={(d) => field.onChange(d ? toYYYYMMDD(d) : "")}
                  />
                )}
              />
              <FieldError message={errors.sessionDate?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name="nextFollowUpDate"
                rules={{
                  validate: (value, values) => {
                    if (!value) return "Indica la fecha del próximo seguimiento";
                    return (
                      value > values.sessionDate ||
                      "Debe ser posterior a la fecha de la sesión"
                    );
                  },
                }}
                render={({ field }) => (
                  <DatePicker
                    label="Próximo seguimiento"
                    required
                    placeholder="Selecciona una fecha"
                    disabled={isPending}
                    minDate={sessionDate ? addDays(sessionDate, 1) : undefined}
                    value={parseYYYYMMDD(field.value)}
                    onChange={(d) => field.onChange(d ? toYYYYMMDD(d) : "")}
                  />
                )}
              />
              <FieldError message={errors.nextFollowUpDate?.message} />
            </div>
          </div>
        </FormSection>

        {previousStart ? (
          <PreviousStartEvaluation
            previousStart={previousStart}
            control={control}
            register={register}
            disabled={isPending}
          />
        ) : null}

        <FormSection title="Acuerdos Keep / Stop / Start">
          <p className="-mt-1 text-xs text-muted-foreground">
            Un solo Keep, un solo Stop y un solo Start. Completa los cuatro
            campos de cada uno.
          </p>
          {KSS_ORDER.map((kind) => (
            <KssFieldset
              key={kind}
              kind={kind}
              control={control}
              register={register}
              disabled={isPending}
            />
          ))}
        </FormSection>

        <FormSection title="Compromiso">
          <div className="flex flex-col gap-1">
            <Textarea
              label={
                <>
                  Compromiso concreto del colaborador
                  <span className="ml-1 text-red-500">*</span>
                </>
              }
              placeholder="Qué se compromete a hacer antes del próximo seguimiento"
              rows={3}
              maxLength={MAX_TEXT_LENGTH}
              disabled={isPending}
              aria-invalid={!!errors.commitment}
              {...register("commitment", requiredText)}
            />
            <FieldError message={errors.commitment?.message} />
          </div>
        </FormSection>

        {requireReason ? (
          <FormSection title="Motivo de la corrección">
            <div className="flex flex-col gap-1">
              <Textarea
                label={
                  <>
                    ¿Por qué se corrige esta sesión?
                    <span className="ml-1 text-red-500">*</span>
                  </>
                }
                placeholder="El colaborador ya confirmó de recibido; el cambio quedará auditado."
                rows={2}
                maxLength={MAX_TEXT_LENGTH}
                disabled={isPending}
                aria-invalid={!!errors.reason}
                {...register("reason", requiredText)}
              />
              <FieldError message={errors.reason?.message} />
            </div>
          </FormSection>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" icon={Save} loading={isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function HeaderItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value || "—"}</dd>
    </div>
  );
}
