"use client";

import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MeTeamMember } from "@/api/me/me.types";
import { useUpdateMyTeamMember } from "@/api/me/me.mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { parseYYYYMMDD, toYYYYMMDD } from "@/lib/format";

type PersonalValues = {
  firstName: string;
  lastName: string;
  secondLastName: string;
  bornDate: string;
  dui: string;
  inss: string;
};

function dateInputFromApi(iso: string | null | undefined) {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function toBackendDate(s: string): string | null {
  const t = s?.trim();
  if (!t) return null;
  return `${t}T12:00:00.000Z`;
}

export function MeTeamMemberPersonalCard({
  teamMember,
}: {
  teamMember: MeTeamMember;
}) {
  const mutation = useUpdateMyTeamMember();
  const { register, handleSubmit, control, formState } =
    useForm<PersonalValues>({
      values: {
        firstName: teamMember.firstName,
        lastName: teamMember.lastName ?? "",
        secondLastName: teamMember.secondLastName ?? "",
        bornDate: dateInputFromApi(teamMember.bornDate),
        dui: teamMember.dui ?? "",
        inss: teamMember.inss ?? "",
      },
    });

  function onSubmit(values: PersonalValues) {
    mutation.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim() || null,
        secondLastName: values.secondLastName.trim() || null,
        bornDate: toBackendDate(values.bornDate),
        dui: values.dui.trim() || null,
        inss: values.inss.trim() || null,
      },
      {
        onSuccess: () => toast.success("Datos personales actualizados"),
        onError: (e: Error) =>
          toast.error(e.message || "No se pudieron guardar los cambios"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Nombre y documentos de tu expediente en plantilla. Pueden diferir del nombre de tu cuenta.">
          Datos personales
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={mutation.isPending || !formState.isDirty}
              icon={mutation.isPending ? Loader2 : undefined}
              iconClassName={mutation.isPending ? "animate-spin" : undefined}
            >
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
