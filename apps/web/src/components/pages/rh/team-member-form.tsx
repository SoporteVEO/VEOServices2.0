"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { User } from "@/api/users/users.types";
import type {
  ContractType,
  TeamMemberStatus,
} from "@/api/team-members/team-members.types";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormSection } from "@/components/ui/form-section";
import { DatePicker } from "@/components/ui/date-picker";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "@/lib/team-member-labels";
import { parseYYYYMMDD, toYYYYMMDD } from "@/lib/format";

export type TeamMemberFormValues = {
  userId: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  businessEmail: string;
  position: string;
  salary: number;
  dui: string;
  inss: string;
  afpNumber: string;
  afpEntity: string;
  bankName: string;
  bankAccount: string;
  bornDate: string;
  startDate: string;
  endDate: string;
  contractType: ContractType;
  status: TeamMemberStatus;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  directBossId: string | null;
};

type TeamMemberFormProps = {
  defaultValues?: Partial<TeamMemberFormValues>;
  isEdit?: boolean;
  isPending?: boolean;
  linkableUsers: User[];
  bossCandidateUsers: User[];
  onSubmit: (values: TeamMemberFormValues) => void;
  onCancel: () => void;
};

function userLabel(u: User) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return `${name} — ${u.email}`;
}

export function TeamMemberForm({
  defaultValues,
  isEdit = false,
  isPending = false,
  linkableUsers,
  bossCandidateUsers,
  onSubmit,
  onCancel,
}: TeamMemberFormProps) {
  const { register, handleSubmit, control, setValue, watch, getValues } =
    useForm<TeamMemberFormValues>({
      defaultValues: {
        userId: "",
        firstName: "",
        lastName: "",
        secondLastName: "",
        businessEmail: "",
        position: "",
        salary: 0,
        dui: "",
        inss: "",
        afpNumber: "",
        afpEntity: "",
        bankName: "",
        bankAccount: "",
        bornDate: "",
        startDate: "",
        endDate: "",
        contractType: "FULL_TIME",
        status: "ACTIVE",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        directBossId: null,
        ...defaultValues,
      },
    });

  const linkedUserId = watch("userId");
  const directBossId = watch("directBossId");
  const startDateStr = watch("startDate");
  const endDateStr = watch("endDate");

  const startDateAsDate = useMemo(
    () => parseYYYYMMDD(startDateStr),
    [startDateStr],
  );
  const endDateAsDate = useMemo(
    () => parseYYYYMMDD(endDateStr),
    [endDateStr],
  );

  const bossOptions: ComboboxOption[] = useMemo(() => {
    return bossCandidateUsers
      .filter((u) => u.id !== linkedUserId)
      .map((u) => ({
        value: u.id,
        label: userLabel(u),
        filterValue: `${u.firstName} ${u.lastName ?? ""} ${u.email}`,
      }));
  }, [bossCandidateUsers, linkedUserId]);

  const selectedBossOption = useMemo(() => {
    if (!directBossId) return null;
    const u = bossCandidateUsers.find((x) => x.id === directBossId);
    if (!u) return null;
    return {
      value: u.id,
      label: userLabel(u),
      filterValue: `${u.firstName} ${u.lastName ?? ""} ${u.email}`,
    };
  }, [directBossId, bossCandidateUsers]);

  function handleUserChange(
    userId: string,
    fieldOnChange: (value: string) => void,
  ) {
    fieldOnChange(userId);
    const selectedUser = linkableUsers.find((u) => u.id === userId);
    if (!selectedUser) return;
    setValue("firstName", selectedUser.firstName, { shouldDirty: true });
    setValue("lastName", selectedUser.lastName ?? "", { shouldDirty: true });
    if (getValues("directBossId") === userId) {
      setValue("directBossId", null, { shouldDirty: true });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="space-y-4">
        <FormSection title="Usuario vinculado">
          <Controller
            control={control}
            name="userId"
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Usuario"
                required
                className="w-full"
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
                  {linkableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {userLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormSection>

        <FormSection title="Datos personales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Nombre"
              required
              {...register("firstName", { required: true })}
            />
            <Input label="Apellido" {...register("lastName")} />
            <Input label="Segundo apellido" {...register("secondLastName")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="bornDate"
              render={({ field }) => (
                <DatePicker
                  label="Fecha de nacimiento"
                  placeholder="Sin fecha"
                  allowClear
                  value={parseYYYYMMDD(field.value) ?? undefined}
                  onChange={(d) => field.onChange(d ? toYYYYMMDD(d) : "")}
                />
              )}
            />
            <Input label="DUI" {...register("dui")} />
            <Input label="Número INSS" {...register("inss")} />
          </div>
        </FormSection>

        <FormSection title="Información laboral">
          <Input
            label="Correo corporativo"
            type="email"
            required
            autoComplete="email"
            {...register("businessEmail", { required: true })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Cargo"
              required
              {...register("position", { required: true })}
            />
            <Input
              label="Salario"
              required
              step="0.01"
              min="0"
              {...register("salary", {
                required: true,
                valueAsNumber: true,
                min: 0,
              })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="contractType"
              render={({ field }) => (
                <Select
                  label="Tipo de contrato"
                  className="w-full"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CONTRACT_TYPE_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  label="Estado"
                  className="w-full"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  label="Inicio de labores"
                  placeholder="Sin fecha"
                  allowClear
                  maxDate={endDateAsDate ?? undefined}
                  value={parseYYYYMMDD(field.value) ?? undefined}
                  onChange={(d) => field.onChange(d ? toYYYYMMDD(d) : "")}
                />
              )}
            />
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DatePicker
                  label="Fin de labores"
                  placeholder="Sin fecha"
                  allowClear
                  minDate={startDateAsDate ?? undefined}
                  value={parseYYYYMMDD(field.value) ?? undefined}
                  onChange={(d) => field.onChange(d ? toYYYYMMDD(d) : "")}
                />
              )}
            />
          </div>
          <Controller
            control={control}
            name="directBossId"
            render={({ field }) => (
              <Combobox
                label="Jefe directo"
                placeholder="Sin jefe directo"
                options={bossOptions}
                value={field.value ?? undefined}
                selectedOption={selectedBossOption}
                onChange={(v) =>
                  field.onChange(
                    v === undefined || v === null || v === ""
                      ? null
                      : String(v),
                  )
                }
                required={false}
              />
            )}
          />
        </FormSection>

        <FormSection title="Previsión social y pagos">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Número AFP" {...register("afpNumber")} />
            <Input label="Administradora AFP" {...register("afpEntity")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Banco" {...register("bankName")} />
            <Input label="Cuenta bancaria" {...register("bankAccount")} />
          </div>
        </FormSection>

        <FormSection title="Contacto de emergencia">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Nombre" {...register("emergencyContactName")} />
            <Input
              label="Teléfono"
              type="tel"
              {...register("emergencyContactPhone")}
            />
            <Input
              label="Parentesco"
              {...register("emergencyContactRelationship")}
            />
          </div>
        </FormSection>
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
