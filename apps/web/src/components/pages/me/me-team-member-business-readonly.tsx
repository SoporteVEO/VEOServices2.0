"use client";

import {
  Briefcase,
  BadgeCheck,
  CalendarRange,
  DollarSign,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeTeamMember } from "@/api/me/me.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CONTRACT_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/team-member-labels";

type Row = { icon: LucideIcon; label: string; value: React.ReactNode };

export function MeTeamMemberBusinessReadonly({
  teamMember,
}: {
  teamMember: MeTeamMember;
}) {
  const rows: Row[] = [
    {
      icon: Briefcase,
      label: "Cargo",
      value: teamMember.position,
    },
    {
      icon: Mail,
      label: "Correo corporativo",
      value: (
        <a
          href={`mailto:${teamMember.businessEmail}`}
          className="hover:underline"
        >
          {teamMember.businessEmail}
        </a>
      ),
    },
    {
      icon: DollarSign,
      label: "Salario",
      value: formatMoney(teamMember.salary),
    },
    {
      icon: Briefcase,
      label: "Tipo de contrato",
      value: CONTRACT_TYPE_LABELS[teamMember.contractType],
    },
    {
      icon: BadgeCheck,
      label: "Estado en plantilla",
      value: STATUS_LABELS[teamMember.status],
    },
    {
      icon: CalendarRange,
      label: "Inicio de labores",
      value: teamMember.startDate
        ? formatDate(teamMember.startDate)
        : "—",
    },
    {
      icon: CalendarRange,
      label: "Fin de labores",
      value: teamMember.endDate ? formatDate(teamMember.endDate) : "—",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Solo recursos humanos puede modificar estos datos.">
          Información corporativa
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border">
                <row.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {row.label}
                </p>
                <div className="mt-0.5 text-sm wrap-break-word text-foreground">
                  {row.value}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
