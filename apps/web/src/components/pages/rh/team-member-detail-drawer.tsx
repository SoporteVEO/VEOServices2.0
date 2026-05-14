"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Loader2,
  Mail,
  MessageSquarePlus,
  UserCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTeamMember } from "@/api/team-members/team-members.get";
import {
  useCreateTeamMemberComment,
  useUpdateTeamMember,
} from "@/api/team-members/team-members.mutations";
import { useUsers } from "@/api/users/users.get";
import type { User } from "@/api/users/users.types";
import type {
  ContractType,
  TeamMemberDetail,
  TeamMemberStatus,
  UpdateTeamMemberInput,
} from "@/api/team-members/team-members.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { Badge } from "@/components/primitives/ui/badge";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Label } from "@/components/primitives/ui/label";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type ComboboxOption } from "@/components/ui/combobox";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "@/lib/team-member-labels";
import {
  formatDate,
  formatHumanDate,
  formatLongDate,
  formatMoney,
  parseYYYYMMDD,
  toYYYYMMDD,
} from "@/lib/format";
import {
  ComboboxEditField,
  DateEditField,
  NumberEditField,
  SelectEditField,
  TextEditField,
} from "@/components/ui/edit-field";
import { cn } from "@/lib/utils";

type TeamMemberDetailDrawerProps = {
  teamMemberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

const CONTRACT_OPTIONS = CONTRACT_TYPES.map((c) => ({
  value: c,
  label: CONTRACT_TYPE_LABELS[c],
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function userLabel(u: User) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return `${name} — ${u.email}`;
}

function isoFromDate(d: Date | null): string | null {
  if (!d) return null;
  return `${toYYYYMMDD(d)}T12:00:00.000Z`;
}

function dateFromIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const datePart = iso.slice(0, 10);
  return parseYYYYMMDD(datePart);
}

function getInitials(detail: TeamMemberDetail) {
  return [detail.firstName, detail.lastName ?? ""]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadgeVariant(
  status: TeamMemberStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "TERMINATED":
      return "destructive";
  }
}

export function TeamMemberDetailDrawer({
  teamMemberId,
  open,
  onOpenChange,
}: TeamMemberDetailDrawerProps) {
  const { data: detail, isLoading } = useTeamMember(teamMemberId, open);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" handleOnly>
      <DrawerContent
        size="2xl"
        className="flex max-h-dvh data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[720px] data-[vaul-drawer-direction=right]:lg:max-w-[920px]"
      >
        {isLoading || !detail ? (
          <DrawerSkeleton onClose={() => onOpenChange(false)} />
        ) : (
          <TeamMemberDetailContent
            key={detail.id}
            detail={detail}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56" />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <LinkedUserCardSkeleton />
          <SectionSkeleton titleWidth="w-36" rows={2} fieldsPerRow={3} />
          <SectionSkeleton titleWidth="w-40" rows={4} fieldsPerRow={2} />
          <SectionSkeleton titleWidth="w-44" rows={2} fieldsPerRow={2} />
          <SectionSkeleton titleWidth="w-44" rows={1} fieldsPerRow={3} />
        </div>
      </ScrollArea>
    </>
  );
}

function LinkedUserCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({
  titleWidth,
  rows,
  fieldsPerRow,
}: {
  titleWidth: string;
  rows: number;
  fieldsPerRow: number;
}) {
  const gridCols =
    fieldsPerRow === 1
      ? "grid-cols-1"
      : fieldsPerRow === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-3";

  return (
    <Card>
      <CardHeader>
        <Skeleton className={cn("h-4", titleWidth)} />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className={cn("grid gap-4", gridCols)}
          >
            {Array.from({ length: fieldsPerRow }).map((_, fieldIdx) => (
              <div
                key={`field-${rowIdx}-${fieldIdx}`}
                className="flex flex-col gap-1.5"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TeamMemberDetailContent({
  detail,
  onClose,
}: {
  detail: TeamMemberDetail;
  onClose: () => void;
}) {
  const { data: users = [] } = useUsers();
  const updateMutation = useUpdateTeamMember();
  const isPending = updateMutation.isPending;

  const update = useMemo(() => {
    return (input: UpdateTeamMemberInput) =>
      new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: detail.id, ...input },
          {
            onSuccess: () => {
              toast.success("Cambios guardados");
              resolve();
            },
            onError: (err: Error) => {
              toast.error(err.message || "Error al actualizar");
              reject(err);
            },
          },
        );
      });
  }, [updateMutation, detail.id]);

  const bossOptions: ComboboxOption[] = useMemo(() => {
    return users
      .filter((u) => u.id !== detail.userId)
      .map((u) => ({
        value: u.id,
        label: userLabel(u),
        filterValue: `${u.firstName} ${u.lastName ?? ""} ${u.email}`,
      }));
  }, [users, detail.userId]);

  const selectedBossOption: ComboboxOption | null = useMemo(() => {
    if (!detail.directBoss) return null;
    const b = detail.directBoss;
    return {
      value: b.id,
      label: `${[b.firstName, b.lastName].filter(Boolean).join(" ")} — ${b.email}`,
      filterValue: `${b.firstName} ${b.lastName ?? ""} ${b.email}`,
    };
  }, [detail.directBoss]);

  const initials = getInitials(detail);
  const statusVariant = statusBadgeVariant(detail.status);

  return (
    <>
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-sm font-medium">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <DrawerTitle className="truncate text-base font-semibold">
                {detail.fullName}
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-1.5 text-xs">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{detail.businessEmail}</span>
              </DrawerDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge variant={statusVariant} className="text-[10px]">
                  {STATUS_LABELS[detail.status]}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Briefcase className="mr-1 size-3" />
                  {CONTRACT_TYPE_LABELS[detail.contractType]}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {formatMoney(detail.salary)}
                </Badge>
              </div>
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <LinkedUserCard detail={detail} />

          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Nombre completo y documentos de identidad.">
                Datos personales
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextEditField
                  label="Nombre"
                  required
                  initialValue={detail.firstName}
                  isPending={isPending}
                  onSubmit={(v) => update({ firstName: v ?? "" })}
                />
                <TextEditField
                  label="Apellido"
                  initialValue={detail.lastName}
                  isPending={isPending}
                  onSubmit={(v) => update({ lastName: v })}
                />
                <TextEditField
                  label="Segundo apellido"
                  initialValue={detail.secondLastName}
                  isPending={isPending}
                  onSubmit={(v) => update({ secondLastName: v })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DateEditField
                  label="Fecha de nacimiento"
                  initialValue={dateFromIso(detail.bornDate)}
                  isPending={isPending}
                  display={(d) => formatDate(d)}
                  onSubmit={(d) => update({ bornDate: isoFromDate(d) })}
                />
                <TextEditField
                  label="DUI"
                  initialValue={detail.dui}
                  isPending={isPending}
                  onSubmit={(v) => update({ dui: v })}
                />
                <TextEditField
                  label="Número INSS"
                  initialValue={detail.inss}
                  isPending={isPending}
                  onSubmit={(v) => update({ inss: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Información laboral, contrato y jerarquía.">
                Información laboral
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextEditField
                label="Correo corporativo"
                required
                type="email"
                initialValue={detail.businessEmail}
                isPending={isPending}
                validate={(v) =>
                  EMAIL_RE.test(v) ? null : "Correo electrónico no válido"
                }
                onSubmit={(v) => update({ businessEmail: v ?? "" })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextEditField
                  label="Cargo"
                  required
                  initialValue={detail.position}
                  isPending={isPending}
                  onSubmit={(v) => update({ position: v ?? "" })}
                />
                <NumberEditField
                  label="Salario"
                  required
                  min={0}
                  step={0.01}
                  initialValue={detail.salary}
                  isPending={isPending}
                  display={(v) => formatMoney(v)}
                  onSubmit={(v) => update({ salary: v })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectEditField
                  label="Tipo de contrato"
                  initialValue={detail.contractType}
                  options={CONTRACT_OPTIONS}
                  isPending={isPending}
                  onSubmit={(v) =>
                    update({ contractType: v as ContractType })
                  }
                />
                <SelectEditField
                  label="Estado"
                  initialValue={detail.status}
                  options={STATUS_OPTIONS}
                  isPending={isPending}
                  onSubmit={(v) =>
                    update({ status: v as TeamMemberStatus })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateEditField
                  label="Inicio de labores"
                  initialValue={dateFromIso(detail.startDate)}
                  maxDate={dateFromIso(detail.endDate) ?? undefined}
                  isPending={isPending}
                  display={(d) => formatDate(d)}
                  onSubmit={(d) => update({ startDate: isoFromDate(d) })}
                />
                <DateEditField
                  label="Fin de labores"
                  initialValue={dateFromIso(detail.endDate)}
                  minDate={dateFromIso(detail.startDate) ?? undefined}
                  isPending={isPending}
                  display={(d) => formatDate(d)}
                  onSubmit={(d) => update({ endDate: isoFromDate(d) })}
                />
              </div>
              <ComboboxEditField
                label="Jefe directo"
                initialValue={detail.directBossId}
                options={bossOptions}
                selectedOption={selectedBossOption}
                emptyText="Sin jefe directo"
                placeholder="Selecciona un jefe directo"
                isPending={isPending}
                onSubmit={(v) => update({ directBossId: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Información para nómina y previsión social.">
                Previsión social y pagos
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextEditField
                  label="Número AFP"
                  initialValue={detail.afpNumber}
                  isPending={isPending}
                  onSubmit={(v) => update({ afpNumber: v })}
                />
                <TextEditField
                  label="Administradora AFP"
                  initialValue={detail.afpEntity}
                  isPending={isPending}
                  onSubmit={(v) => update({ afpEntity: v })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextEditField
                  label="Banco"
                  initialValue={detail.bankName}
                  isPending={isPending}
                  onSubmit={(v) => update({ bankName: v })}
                />
                <TextEditField
                  label="Cuenta bancaria"
                  initialValue={detail.bankAccount}
                  isPending={isPending}
                  onSubmit={(v) => update({ bankAccount: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Persona a contactar en caso de emergencia.">
                Contacto de emergencia
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextEditField
                  label="Nombre"
                  initialValue={detail.emergencyContactName}
                  isPending={isPending}
                  onSubmit={(v) => update({ emergencyContactName: v })}
                />
                <TextEditField
                  label="Teléfono"
                  type="tel"
                  initialValue={detail.emergencyContactPhone}
                  isPending={isPending}
                  onSubmit={(v) => update({ emergencyContactPhone: v })}
                />
                <TextEditField
                  label="Parentesco"
                  initialValue={detail.emergencyContactRelationship}
                  isPending={isPending}
                  onSubmit={(v) =>
                    update({ emergencyContactRelationship: v })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <CommentsCard detail={detail} />

          <MetadataFooter detail={detail} />
        </div>
      </ScrollArea>
    </>
  );
}

function LinkedUserCard({ detail }: { detail: TeamMemberDetail }) {
  const user = detail.user;
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials = (
    `${user.firstName[0] ?? ""}${user.lastName?.[0] ?? ""}` || "?"
  ).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Cuenta de la aplicación vinculada a este miembro. No se puede cambiar desde aquí.">
          Usuario vinculado
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
          <Avatar size="default">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {name}
            </p>
            <a
              href={`mailto:${user.email}`}
              className="block truncate text-xs text-muted-foreground hover:underline"
            >
              {user.email}
            </a>
          </div>
          <UserCircle2 className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsCard({ detail }: { detail: TeamMemberDetail }) {
  const commentMutation = useCreateTeamMemberComment();
  const [newComment, setNewComment] = useState("");
  const [showCommentToUser, setShowCommentToUser] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    commentMutation.mutate(
      {
        teamMemberId: detail.id,
        comment: trimmed,
        showToUser: showCommentToUser,
      },
      {
        onSuccess: () => {
          toast.success("Comentario agregado");
          setNewComment("");
          setShowCommentToUser(false);
        },
        onError: (err: Error) =>
          toast.error(err.message || "No se pudo guardar el comentario"),
      },
    );
  }

  const isPending = commentMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info='Notas internas de RR.HH. Marca "Visible para el colaborador" para mostrarlas en su perfil.'>
          Comentarios internos
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.teamMemberComments.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            Sin comentarios aún.
          </p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {detail.teamMemberComments.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-border/60 bg-muted/15 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatHumanDate(c.createdAt)}
                  </span>
                  {c.showToUser ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Visible al colaborador
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                  {c.comment}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAdd}
          className="space-y-3 border-t border-border/60 pt-4"
        >
          <Textarea
            label="Nuevo comentario"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe una nota…"
            disabled={isPending}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-comment-to-user"
                checked={showCommentToUser}
                onCheckedChange={(v) => setShowCommentToUser(v === true)}
                disabled={isPending}
              />
              <Label
                htmlFor="show-comment-to-user"
                className="cursor-pointer text-xs font-normal text-muted-foreground"
              >
                Visible para el colaborador
              </Label>
            </div>
            <Button
              type="submit"
              sizeVariant="sm"
              disabled={isPending || !newComment.trim()}
              icon={isPending ? Loader2 : MessageSquarePlus}
              iconClassName={isPending ? "animate-spin" : undefined}
            >
              {isPending ? "Guardando…" : "Agregar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MetadataFooter({ detail }: { detail: TeamMemberDetail }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-2">
      <MetadataItem label="Creado" value={formatLongDate(detail.createdAt)} />
      <MetadataItem
        label="Última actualización"
        value={formatLongDate(detail.updatedAt)}
      />
    </div>
  );
}

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}
