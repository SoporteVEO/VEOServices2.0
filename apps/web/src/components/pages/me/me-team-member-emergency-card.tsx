"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MeTeamMember } from "@/api/me/me.types";
import { useUpdateMyTeamMember } from "@/api/me/me.mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";

type EmergencyValues = {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

export function MeTeamMemberEmergencyCard({
  teamMember,
}: {
  teamMember: MeTeamMember;
}) {
  const mutation = useUpdateMyTeamMember();
  const { register, handleSubmit, formState } = useForm<EmergencyValues>({
    values: {
      emergencyContactName: teamMember.emergencyContactName ?? "",
      emergencyContactPhone: teamMember.emergencyContactPhone ?? "",
      emergencyContactRelationship:
        teamMember.emergencyContactRelationship ?? "",
    },
  });

  function onSubmit(values: EmergencyValues) {
    mutation.mutate(
      {
        emergencyContactName: values.emergencyContactName.trim() || null,
        emergencyContactPhone: values.emergencyContactPhone.trim() || null,
        emergencyContactRelationship:
          values.emergencyContactRelationship.trim() || null,
      },
      {
        onSuccess: () => toast.success("Contacto de emergencia actualizado"),
        onError: (e: Error) =>
          toast.error(e.message || "No se pudieron guardar los cambios"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Persona a contactar en caso de emergencia.">
          Contacto de emergencia
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Nombre"
              {...register("emergencyContactName")}
            />
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
