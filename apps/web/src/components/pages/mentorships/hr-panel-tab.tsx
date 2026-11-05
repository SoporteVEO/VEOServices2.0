"use client";

import { useState } from "react";
import {
  CircleCheck,
  Clock,
  Target,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import {
  useMentorshipDashboard,
  useMentorshipHistory,
} from "@/api/mentorships/mentorships.get";
import type {
  MentorshipStatus,
  MentorshipSummary,
} from "@/api/mentorships/mentorships.types";
import { DataTable } from "@/components/ui/data-table";
import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, formatDay } from "./const";
import {
  DEPARTMENT_COLUMNS,
  HISTORY_COLUMNS,
  QUARTER_COLLABORATOR_COLUMNS,
} from "./hr-panel-columns";
import { Section } from "./session-detail";

const ALL = "ALL";
const STATUS_FILTERS: MentorshipStatus[] = ["OVERDUE", "PENDING", "DONE"];

function summaryKpis(totals: MentorshipSummary): KpiItem[] {
  return [
    {
      icon: UsersRound,
      label: "Colaboradores",
      value: totals.collaborators,
      detail: "Activos con jefe directo",
    },
    {
      icon: CircleCheck,
      label: "Realizadas",
      value: totals.done,
      detail:
        totals.completion === null ? undefined : `${totals.completion}% de avance`,
      tone: "emerald",
    },
    {
      icon: Clock,
      label: "Pendientes",
      value: totals.pending,
      tone: "amber",
    },
    {
      icon: TriangleAlert,
      label: "Vencidas",
      value: totals.overdue,
      tone: "rose",
    },
    {
      icon: Target,
      label: "Starts cumplidos",
      value: totals.startCompliance ?? 0,
      suffix: "%",
      decimals: 1,
      detail:
        totals.startEvaluated > 0
          ? `${totals.startYes} sí · ${totals.startPartial} parcial · ${totals.startNo} no`
          : "Sin Starts evaluados",
      tone: "sky",
    },
  ];
}

export function HrPanelTab({
  onOpenCollaborator,
}: {
  onOpenCollaborator: (userId: string) => void;
}) {
  const [quarter, setQuarter] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<MentorshipStatus | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const dashboard = useMentorshipDashboard(quarter, true);
  const history = useMentorshipHistory(true);

  const data = dashboard.data;
  const term = search.trim().toLowerCase();
  const collaborators = (data?.collaborators ?? []).filter(
    (row) =>
      (status === ALL || row.status === status) &&
      (!term ||
        [row.name, row.departmentName, row.boss?.name ?? ""].some((text) =>
          text.toLowerCase().includes(term),
        )),
  );
  const historyTerm = historySearch.trim().toLowerCase();
  const historyRows = (history.data ?? []).filter(
    (row) => !historyTerm || row.name.toLowerCase().includes(historyTerm),
  );

  if (dashboard.isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        No pudimos cargar el panel de Talento Humano.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data
            ? `Fecha límite del ${data.quarter.label}: ${formatDay(data.quarter.deadline)}`
            : "Cargando trimestre..."}
        </p>
        <Select
          label="Trimestre"
          value={data?.quarter.key ?? ""}
          onValueChange={setQuarter}
          disabled={!data}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            {(data?.quarters ?? []).map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data ? (
        <KpiGrid className="sm:grid-cols-3 xl:grid-cols-5">
          {summaryKpis(data.totals).map((item) => (
            <KpiTile key={item.label} item={item} />
          ))}
        </KpiGrid>
      ) : (
        <KpiGridSkeleton count={5} className="sm:grid-cols-3 xl:grid-cols-5" />
      )}

      <Section title="Cumplimiento por área/gerencia">
        <DataTable
          columns={DEPARTMENT_COLUMNS}
          data={data?.departments ?? []}
          isLoading={dashboard.isLoading}
          emptyMessage="No hay colaboradores activos con jefe directo."
        />
      </Section>

      <Section title={`Colaboradores · ${data?.quarter.label ?? ""}`}>
        <DataTable
          columns={QUARTER_COLLABORATOR_COLUMNS}
          sideButtons={
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as MentorshipStatus | typeof ALL)
              }
            >
              <SelectTrigger className="w-48" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estados</SelectItem>
                {STATUS_FILTERS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          data={collaborators}
          isLoading={dashboard.isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por colaborador, área o jefe..."
          emptyMessage="No hay colaboradores con ese filtro."
          onRowClick={(row) => onOpenCollaborator(row.userId)}
          pagination={{ pageSize: 10 }}
        />
      </Section>

      <Section
        title="Historial por colaborador"
        hint="Incluye colaboradores archivados"
      >
        <DataTable
          columns={HISTORY_COLUMNS}
          data={historyRows}
          isLoading={history.isLoading}
          searchValue={historySearch}
          onSearchChange={setHistorySearch}
          searchPlaceholder="Buscar colaborador..."
          emptyMessage={
            history.isError
              ? "No pudimos cargar el historial."
              : "No hay colaboradores en la plantilla."
          }
          onRowClick={(row) => onOpenCollaborator(row.userId)}
          pagination={{ pageSize: 10 }}
        />
      </Section>
    </div>
  );
}
