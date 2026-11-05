"use client";

import {
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type { KssKind } from "@/api/mentorships/mentorships.types";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { KSS_FIELDS, KSS_SECTIONS, MAX_TEXT_LENGTH } from "./const";
import { FieldError, requiredText } from "./form-helpers";
import type { SessionFormValues } from "./session-form-values";

type Props = {
  kind: KssKind;
  control: Control<SessionFormValues>;
  register: UseFormRegister<SessionFormValues>;
  disabled?: boolean;
};

export function KssFieldset({ kind, control, register, disabled }: Props) {
  const { errors } = useFormState({ control, name: kind });
  const section = KSS_SECTIONS[kind];
  return (
    <fieldset
      className={cn(
        "flex flex-col gap-3 border border-l-4 border-border p-4",
        section.accent,
      )}
    >
      <legend className="sr-only">{section.title}</legend>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{section.title}</p>
        <p className="text-xs text-muted-foreground">{section.hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KSS_FIELDS.map((field) => {
          const error = errors[kind]?.[field.key]?.message;
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <Textarea
                label={
                  <>
                    {field.label}
                    <span className="ml-1 text-red-500">*</span>
                  </>
                }
                placeholder={field.placeholder}
                rows={2}
                maxLength={MAX_TEXT_LENGTH}
                disabled={disabled}
                aria-invalid={!!error}
                {...register(`${kind}.${field.key}`, requiredText)}
              />
              <FieldError message={error} />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
