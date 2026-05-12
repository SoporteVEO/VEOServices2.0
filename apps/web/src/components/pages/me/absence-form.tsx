"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { MultiImageUploader } from "@/components/ui/multi-image-uploader";

export type AbsenceFormValues = {
  fromDate: Date;
  toDate: Date;
  reason: string;
};

export type AbsenceFormResult = AbsenceFormValues & {
  imageFiles: File[];
};

type AbsenceFormProps = {
  isPending?: boolean;
  onSubmit: (values: AbsenceFormResult) => void;
  onCancel: () => void;
};

export function AbsenceForm({
  isPending = false,
  onSubmit,
  onCancel,
}: AbsenceFormProps) {
  const today = new Date();

  const {
    control,
    handleSubmit,
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AbsenceFormValues>({
    defaultValues: {
      fromDate: today,
      toDate: today,
      reason: "",
    },
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const fromDate = watch("fromDate");

  function handleValid(values: AbsenceFormValues) {
    if (values.toDate < values.fromDate) {
      setError("toDate", {
        type: "validate",
        message: "La fecha de fin debe ser posterior a la de inicio",
      });
      return;
    }
    clearErrors("toDate");
    onSubmit({ ...values, imageFiles });
  }

  return (
    <form
      onSubmit={handleSubmit(handleValid)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="fromDate"
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker
                label="Desde"
                value={field.value}
                onChange={(date) => {
                  if (date) field.onChange(date);
                }}
                disabled={isPending}
                aria-invalid={!!errors.fromDate}
              />
            )}
          />

          <div className="flex flex-col gap-1">
            <Controller
              control={control}
              name="toDate"
              rules={{ required: true }}
              render={({ field }) => (
                <DatePicker
                  label="Hasta"
                  value={field.value}
                  onChange={(date) => {
                    if (date) field.onChange(date);
                  }}
                  minDate={fromDate}
                  disabled={isPending}
                  aria-invalid={!!errors.toDate}
                />
              )}
            />
            {errors.toDate?.message ? (
              <span className="text-xs text-destructive">
                {errors.toDate.message}
              </span>
            ) : null}
          </div>
        </div>

        <Textarea
          label="Motivo"
          rows={4}
          placeholder="Describe el motivo de la incapacidad..."
          {...register("reason", { required: true, minLength: 1 })}
          aria-invalid={!!errors.reason}
        />

        <MultiImageUploader
          label="Documentos (opcional)"
          hint="Adjunta constancias médicas u otros documentos."
          value={imageFiles}
          onChange={setImageFiles}
          disabled={isPending}
        />
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
        <Button
          type="submit"
          disabled={isPending}
          icon={isPending ? Loader2 : undefined}
          iconClassName={isPending ? "animate-spin" : undefined}
        >
          {isPending ? "Enviando..." : "Crear solicitud"}
        </Button>
      </DialogFooter>
    </form>
  );
}
