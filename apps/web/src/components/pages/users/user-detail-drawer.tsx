"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  type LucideIcon,
  Loader2,
  LogOut,
  Mail,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/primitives/ui/button";
import { Button as ActionButton } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { Badge } from "@/components/primitives/ui/badge";
import { Separator } from "@/components/primitives/ui/separator";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/primitives/ui/status";
import type { User } from "@/api/users/users.types";
import { useForceLogoutUser, useUpdateUser } from "@/api/users/users.mutations";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UserFormFields, type UserFormValues } from "./user-form-fields";
import { roleBadge, subRoleBadge } from "./const";
import { DeleteUserDialog } from "./delete-user-dialog";

interface UserDetailDrawerProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDrawer({
  user,
  open,
  onOpenChange,
}: UserDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px]">
        {user ? (
          <UserDetailContent
            key={user.id}
            user={user}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function UserDetailContent({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const updateMutation = useUpdateUser();
  const forceLogoutMutation = useForceLogoutUser();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initialFormValues: UserFormValues = {
    firstName: user.firstName,
    lastName: user.lastName ?? "",
    email: user.email,
    password: "",
    role: user.role,
    subRoles: user.subRoles ?? [],
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isDirty },
  } = useForm<UserFormValues>({
    defaultValues: initialFormValues,
  });

  function onSubmit(values: UserFormValues) {
    updateMutation.mutate(
      {
        id: user.id,
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        email: values.email,
        role: values.role,
        subRoles: values.subRoles,
        ...(values.password ? { password: values.password } : {}),
      },
      {
        onSuccess: () => toast.success("Usuario actualizado"),
        onError: (err: Error) =>
          toast.error(err.message || "Error al actualizar"),
      },
    );
  }

  function handleToggleDisabled(nextDisabled: boolean) {
    updateMutation.mutate(
      { id: user.id, disabled: nextDisabled },
      {
        onSuccess: () =>
          toast.success(
            nextDisabled
              ? "Cuenta deshabilitada y sesiones cerradas"
              : "Cuenta habilitada",
          ),
        onError: (err: Error) =>
          toast.error(err.message || "Error al cambiar el estado"),
      },
    );
  }

  function handleForceLogout() {
    forceLogoutMutation.mutate(user.id, {
      onSuccess: ({ sessionsDeleted }) =>
        toast.success(
          sessionsDeleted > 0
            ? `Se cerraron ${sessionsDeleted} sesion${sessionsDeleted === 1 ? "" : "es"}`
            : "El usuario no tenía sesiones activas",
        ),
      onError: (err: Error) =>
        toast.error(err.message || "Error al cerrar sesiones"),
    });
  }

  function handleCopyId() {
    void navigator.clipboard.writeText(user.publicId);
    toast.success("ID copiado al portapapeles");
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = (
    `${user.firstName[0] ?? ""}${user.lastName?.[0] ?? ""}` || "?"
  ).toUpperCase();

  const role = roleBadge[user.role] ?? roleBadge.USER;
  const subRoles = user.subRoles ?? [];

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <DrawerTitle className="truncate text-base font-semibold">
                {fullName || "Usuario sin nombre"}
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-1.5 text-xs">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </DrawerDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge
                  variant={role.variant}
                  className={cn("text-[10px]", role.className)}
                >
                  {role.label}
                </Badge>
                {subRoles.map((sr) => {
                  const sb = subRoleBadge[sr];
                  if (!sb) return null;
                  return (
                    <Badge
                      key={sr}
                      variant={sb.variant}
                      className={cn("text-[10px]", sb.className)}
                    >
                      {sb.label}
                    </Badge>
                  );
                })}
                {user.disabled ? (
                  <Status variant="error">
                    <StatusIndicator />
                    <StatusLabel>Deshabilitada</StatusLabel>
                  </Status>
                ) : (
                  <Status variant="success">
                    <StatusIndicator />
                    <StatusLabel>Activa</StatusLabel>
                  </Status>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </Button>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-4">
          <MetricsRow user={user} onCopyId={handleCopyId} />

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <SectionHeader
              title="Información del usuario"
              description="Edita los datos básicos, contraseña, rol y permisos."
            />
            <UserFormFields register={register} control={control} isEdit />
            <div className="flex justify-end gap-2 pt-2">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => reset(initialFormValues)}
                disabled={!isDirty || updateMutation.isPending}
              >
                Descartar
              </ActionButton>
              <ActionButton
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                icon={updateMutation.isPending ? Loader2 : undefined}
                iconClassName={
                  updateMutation.isPending ? "animate-spin" : undefined
                }
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </ActionButton>
            </div>
          </form>

          <Separator />

          <DangerZone
            user={user}
            onToggleDisabled={handleToggleDisabled}
            onForceLogout={handleForceLogout}
            onDelete={() => setDeleteOpen(true)}
            isUpdating={updateMutation.isPending}
            isLoggingOut={forceLogoutMutation.isPending}
          />
        </div>
      </ScrollArea>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={user}
        onDeleted={onClose}
      />
    </>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function MetricsRow({ user, onCopyId }: { user: User; onCopyId: () => void }) {
  const items = [
    {
      icon: Clock,
      label: "Último acceso",
      value: user.lastLoginAt ? formatLongDate(user.lastLoginAt) : "Nunca",
    },
    {
      icon: CheckCircle2,
      label: "Cuenta creada",
      value: formatLongDate(user.createdAt),
    },
    {
      icon: Mail,
      label: "Email verificado",
      value: user.emailVerified ? "Sí" : "No",
    },
    {
      icon: Copy,
      label: "Public ID",
      value: user.publicId.slice(0, 8) + "…",
      action: onCopyId,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={"action" in item ? item.action : undefined}
          disabled={!("action" in item)}
          className={cn(
            "flex flex-col gap-1 rounded-md border bg-accent/10 p-2.5 text-left",
            "action" in item &&
              "cursor-pointer hover:bg-accent/30 transition-colors",
            !("action" in item) && "cursor-default",
          )}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <item.icon className="size-3" />
            {item.label}
          </div>
          <span className="truncate text-sm font-semibold tabular-nums">
            {item.value}
          </span>
        </button>
      ))}
    </div>
  );
}

function DangerZone({
  user,
  onToggleDisabled,
  onForceLogout,
  onDelete,
  isUpdating,
  isLoggingOut,
}: {
  user: User;
  onToggleDisabled: (next: boolean) => void;
  onForceLogout: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isLoggingOut: boolean;
}) {
  return (
    <div className="space-y-3">
      <SectionHeader
        title="Zona de peligro"
        description="Estas acciones afectan el acceso del usuario."
      />

      <DangerRow
        icon={user.disabled ? CheckCircle2 : Ban}
        title={user.disabled ? "Habilitar cuenta" : "Deshabilitar cuenta"}
        description={
          user.disabled
            ? "Permitirá al usuario iniciar sesión nuevamente."
            : "Cierra todas las sesiones activas y bloquea el inicio de sesión."
        }
        action={
          <ActionButton
            variant={user.disabled ? "outline" : "destructive"}
            onClick={() => onToggleDisabled(!user.disabled)}
            disabled={isUpdating}
            icon={isUpdating ? Loader2 : undefined}
            iconClassName={isUpdating ? "animate-spin" : undefined}
          >
            {user.disabled ? "Habilitar" : "Deshabilitar"}
          </ActionButton>
        }
        intent={user.disabled ? "warning" : "danger"}
      />

      <DangerRow
        icon={LogOut}
        title="Cerrar sesiones remotas"
        description="Invalida todas las sesiones activas. El usuario podrá volver a iniciar sesión."
        action={
          <ActionButton
            variant="outline"
            onClick={onForceLogout}
            disabled={isLoggingOut}
            icon={isLoggingOut ? Loader2 : undefined}
            iconClassName={isLoggingOut ? "animate-spin" : undefined}
          >
            Cerrar sesiones
          </ActionButton>
        }
        intent="warning"
      />

      <DangerRow
        icon={Trash2}
        title="Eliminar usuario"
        description="Eliminación permanente. No se puede deshacer."
        action={
          <ActionButton variant="destructive" onClick={onDelete}>
            Eliminar
          </ActionButton>
        }
        intent="danger"
      />
    </div>
  );
}

function DangerRow({
  icon: Icon,
  title,
  description,
  action,
  intent,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
  intent: "danger" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border p-3",
        intent === "danger"
          ? "border-destructive/20 bg-destructive/5"
          : "border-orange-500/20 bg-orange-500/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            intent === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
