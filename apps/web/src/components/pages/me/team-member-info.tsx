"use client";

import { Briefcase, CalendarDays, DollarSign, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeTeamMember } from "@/api/me/me.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

type InfoRow = {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
};

export function TeamMemberInfo({ teamMember }: { teamMember: MeTeamMember }) {
  const remainingVacations = teamMember.vacations - teamMember.usedVacations;

  const rows: InfoRow[] = [
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
      icon: CalendarDays,
      label: "Vacaciones",
      value: `${remainingVacations} ${remainingVacations === 1 ? "día" : "días"} disponibles`,
      hint: `${teamMember.usedVacations} usados de ${teamMember.vacations}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Datos registrados en la plantilla de la empresa.">
          Información laboral
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
                <div className="mt-0.5 flex items-center gap-2 text-sm wrap-break-word text-foreground">
                  <span className="min-w-0 truncate">{row.value}</span>
                  {row.hint ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({row.hint})
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
