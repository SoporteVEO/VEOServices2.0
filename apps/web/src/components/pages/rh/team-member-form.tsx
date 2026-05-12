"use client";

import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { User } from "@/api/users/users.types";
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

export type TeamMemberFormValues = {
  userId: string;
  firstName: string;
  lastName: string;
  businessEmail: string;
  position: string;
  salary: number;
  vacations: number;
  usedVacations: number;
};

type TeamMemberFormProps = {
  defaultValues?: Partial<TeamMemberFormValues>;
  isEdit?: boolean;
  isPending?: boolean;
  users: User[];
  onSubmit: (values: TeamMemberFormValues) => void;
  onCancel: () => void;
};

export function TeamMemberForm({
  defaultValues,
  isEdit = false,
  isPending = false,
  users,
  onSubmit,
  onCancel,
}: TeamMemberFormProps) {
  const { register, handleSubmit, control, setValue } =
    useForm<TeamMemberFormValues>({
      defaultValues: {
        userId: "",
        firstName: "",
        lastName: "",
        businessEmail: "",
        position: "",
        salary: 0,
        vacations: 0,
        usedVacations: 0,
        ...defaultValues,
      },
    });

  function handleUserChange(
    userId: string,
    fieldOnChange: (value: string) => void,
  ) {
    fieldOnChange(userId);
    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;
    setValue("firstName", selectedUser.firstName, { shouldDirty: true });
    setValue("lastName", selectedUser.lastName ?? "", { shouldDirty: true });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="space-y-4">
        <Controller
          control={control}
          name="userId"
          rules={{ required: true }}
          render={({ field }) => (
            <div className="flex w-full flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Usuario
              </span>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  handleUserChange(value, field.onChange)
                }
                disabled={isEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ")} —{" "}
                      {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            {...register("firstName", { required: true })}
          />
          <Input label="Apellido" {...register("lastName")} />
        </div>

        <Input
          label="Correo corporativo"
          type="email"
          {...register("businessEmail", { required: true })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Cargo" {...register("position", { required: true })} />
          <Input
            label="Salario"
            step="0.01"
            min="0"
            {...register("salary", {
              required: true,
              valueAsNumber: true,
              min: 0,
            })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vacaciones (días)"
            min="0"
            {...register("vacations", {
              required: true,
              valueAsNumber: true,
              min: 0,
            })}
          />
          <Input
            label="Vacaciones usadas"
            min="0"
            {...register("usedVacations", {
              required: true,
              valueAsNumber: true,
              min: 0,
            })}
          />
        </div>
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
              : "Agregar a plantilla"}
        </Button>
      </DialogFooter>
    </form>
  );
}
