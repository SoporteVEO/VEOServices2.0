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
import { ROLE_OPTIONS } from "./const";
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
        render={({ field }) => {
          const selected = ROLE_OPTIONS.find((o) => o.value === field.value);
          return (
            <div className="flex w-full min-w-0 flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Rol
              </span>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Selecciona un rol">
                    <span className="truncate">{selected?.label}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="items-start"
                    >
                      <span className="flex min-w-0 flex-col items-start gap-0.5 whitespace-normal">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected ? (
                <p className="text-xs text-muted-foreground">
                  {selected.description}
                </p>
              ) : null}
            </div>
          );
        }}
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
