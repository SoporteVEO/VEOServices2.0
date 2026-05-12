"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { UserFormFields, type UserFormValues } from "./user-form-fields";

export type { UserFormValues };

type UserFormProps = {
  defaultValues?: Partial<UserFormValues>;
  isEdit?: boolean;
  isPending?: boolean;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
};

export function UserForm({
  defaultValues,
  isEdit = false,
  isPending = false,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const { register, handleSubmit, control } = useForm<UserFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "USER",
      subRoles: [],
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody>
        <UserFormFields register={register} control={control} isEdit={isEdit} />
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          icon={isPending ? Loader2 : undefined}
          iconClassName={isPending ? "animate-spin" : undefined}
        >
          {isPending
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear usuario"}
        </Button>
      </DialogFooter>
    </form>
  );
}
