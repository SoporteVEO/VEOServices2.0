"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CircleCheck } from "lucide-react";
import { useMyMentorships } from "@/api/mentorships/mentorships.get";
import type { MentorshipSession } from "@/api/mentorships/mentorships.types";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatDay, quarterLabel } from "./const";
import { AcknowledgementBadge } from "./mentorship-badges";

const COLUMNS: ColumnDef<MentorshipSession>[] = [
  {
    accessorKey: "sessionNumber",
    header: "N.º",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">
        {row.original.sessionNumber}
      </span>
    ),
  },
  {
    accessorKey: "sessionDate",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm whitespace-nowrap tabular-nums">
          {formatDay(row.original.sessionDate)}
        </span>
        <span className="text-xs text-muted-foreground">
          {quarterLabel(row.original.quarter)}
        </span>
      </div>
    ),
  },
  {
    id: "mentor",
    header: "Mentor",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.mentor.name}</span>
    ),
  },
  {
    id: "start",
    header: "Start acordado",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[360px] text-sm">
        {row.original.start.what}
      </span>
    ),
  },
  {
    accessorKey: "nextFollowUpDate",
    header: "Próximo seguimiento",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap tabular-nums">
        {formatDay(row.original.nextFollowUpDate)}
      </span>
    ),
  },
  {
    id: "ack",
    header: "Confirmación",
    cell: ({ row }) => (
      <AcknowledgementBadge acknowledgedAt={row.original.acknowledgedAt} />
    ),
  },
];

export function MyMentorshipsTab({
  onOpenSession,
}: {
  onOpenSession: (sessionId: string) => void;
}) {
  const { data = [], isLoading, isError } = useMyMentorships();
  const pending = data.filter((session) => !session.acknowledgedAt);

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        No pudimos cargar tus mentorías.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pending.length > 0 ? (
        <Alert className="border-teal-500/40 bg-teal-500/5 pe-28">
          <CircleCheck />
          <AlertTitle>
            {pending.length === 1
              ? "Tienes una mentoría por confirmar"
              : `Tienes ${pending.length} mentorías por confirmar`}
          </AlertTitle>
          <AlertDescription>
            Revisa los acuerdos con tu jefe directo y confirma de recibido.
          </AlertDescription>
          <AlertAction className="top-1/2 -translate-y-1/2">
            <Button
              sizeVariant="sm"
              onClick={() => onOpenSession(pending[0].id)}
            >
              Revisar
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      <DataTable
        columns={COLUMNS}
        data={data}
        isLoading={isLoading}
        emptyMessage="Aún no tienes mentorías registradas. Tu jefe directo las registrará cada trimestre."
        onRowClick={(session) => onOpenSession(session.id)}
      />
    </div>
  );
}
