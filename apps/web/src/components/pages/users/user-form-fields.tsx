"use client";

import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  Controller,
} from "react-hook-form";
import type { SubRole, UserRole } from "@/api/users/users.types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubRolesField } from "./sub-roles-field";

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  subRoles: SubRole[];
};

type UserFormFieldsProps = {
  register: UseFormRegister<UserFormValues>;
  control: Control<UserFormValues>;
  errors?: FieldErrors<UserFormValues>;
  isEdit?: boolean;
};

export function UserFormFields({
  register,
  control,
  isEdit = false,
}: UserFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" {...register("firstName", { required: true })} />
        <Input label="Apellido" {...register("lastName")} />
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="off"
        {...register("email", { required: true })}
      />

      <Input
        label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
        type="password"
        autoComplete="new-password"
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
                <SelectItem value="LIMITED">
                  Limitado (solo imágenes)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      />

      <Controller
        control={control}
        name="subRoles"
        render={({ field }) => (
          <SubRolesField value={field.value} onChange={field.onChange} />
        )}
      />
    </div>
  );
}
