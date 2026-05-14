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

type BankValues = {
  bankName: string;
  bankAccount: string;
  afpNumber: string;
  afpEntity: string;
};

export function MeTeamMemberBankCard({
  teamMember,
}: {
  teamMember: MeTeamMember;
}) {
  const mutation = useUpdateMyTeamMember();
  const { register, handleSubmit, formState } = useForm<BankValues>({
    values: {
      bankName: teamMember.bankName ?? "",
      bankAccount: teamMember.bankAccount ?? "",
      afpNumber: teamMember.afpNumber ?? "",
      afpEntity: teamMember.afpEntity ?? "",
    },
  });

  function onSubmit(values: BankValues) {
    mutation.mutate(
      {
        bankName: values.bankName.trim() || null,
        bankAccount: values.bankAccount.trim() || null,
        afpNumber: values.afpNumber.trim() || null,
        afpEntity: values.afpEntity.trim() || null,
      },
      {
        onSuccess: () => toast.success("Datos bancarios y AFP actualizados"),
        onError: (e: Error) =>
          toast.error(e.message || "No se pudieron guardar los cambios"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Cuenta para nómina y datos de AFP.">
          Banco y previsión social
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Banco" {...register("bankName")} />
            <Input label="Cuenta bancaria" {...register("bankAccount")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Número AFP" {...register("afpNumber")} />
            <Input label="Administradora AFP" {...register("afpEntity")} />
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
