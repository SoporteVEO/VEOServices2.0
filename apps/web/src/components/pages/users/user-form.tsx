"use client";

import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/api/users/users.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
};

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
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            {...register("firstName", { required: true })}
          />
          <Input
            label="Apellido"
            {...register("lastName")}
          />
        </div>

        <Input
          label="Correo electrónico"
          type="email"
          {...register("email", { required: true })}
        />

        <Input
          label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
          type="password"
          {...register("password", {
            required: !isEdit,
            minLength: 8,
          })}
          placeholder={isEdit ? "Dejar vacío para no cambiar" : ""}
        />

        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div className="flex w-full flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Rol
              </span>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="LIMITED">Limitado (solo imágenes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
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
