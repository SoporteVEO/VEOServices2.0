"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MeProfile } from "@/api/me/me.types";
import { useUpdateMe } from "@/api/me/me.mutations";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  password: string;
};

export function ProfileForm({ profile }: { profile: MeProfile }) {
  const updateMutation = useUpdateMe();
  const { refetch: refetchSession } = authClient.useSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<ProfileFormValues>({
    values: {
      firstName: profile.firstName,
      lastName: profile.lastName ?? "",
      password: "",
    },
  });

  function onSubmit(values: ProfileFormValues) {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName || undefined,
      password: values.password || undefined,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Perfil actualizado");
        refetchSession();
        reset({
          firstName: payload.firstName,
          lastName: payload.lastName ?? "",
          password: "",
        });
      },
      onError: (err: Error) =>
        toast.error(err.message || "Error al actualizar el perfil"),
    });
  }

  const isPending = updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Actualiza tu nombre y contraseña. El correo no se puede modificar.">
          Información personal
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              {...register("firstName", { required: true })}
              aria-invalid={!!errors.firstName}
            />
            <Input label="Apellido" {...register("lastName")} />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            value={profile.email}
            disabled
            readOnly
          />

          <div className="flex flex-col gap-1">
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              {...register("password", {
                minLength: {
                  value: 8,
                  message: "Debe tener al menos 8 caracteres",
                },
              })}
              aria-invalid={!!errors.password}
            />
            {errors.password ? (
              <span className="text-xs text-destructive">
                {errors.password.message}
              </span>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              icon={isPending ? Loader2 : undefined}
              iconClassName={isPending ? "animate-spin" : undefined}
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
