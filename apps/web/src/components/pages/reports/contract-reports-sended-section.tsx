"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";
import { useContractReportsSended } from "@/api/contracts/contracts.get";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/primitives/ui/table";
import { formatMonthLabel } from "./report-period";

function formatSenderName(row: {
  sentBy: { firstName: string; lastName: string | null };
}) {
  return [row.sentBy.firstName, row.sentBy.lastName].filter(Boolean).join(" ");
}

export function ContractReportsSendedSection({
  contractNumber,
}: {
  contractNumber: string;
}) {
  const { data, isLoading } = useContractReportsSended({ contractNumber });

  return (
    <section className="space-y-2 border-t pt-4">
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-medium text-foreground">
          Reportes enviados
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Historial de generación y envío por correo para este contrato.
      </p>

      {isLoading ? (
        <div className="space-y-2 py-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
        </div>
      ) : !data?.length ? (
        <p className="rounded-md border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
          Aún no hay reportes enviados registrados para este contrato.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead>Correo destino</TableHead>
              <TableHead>Enviado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">
                  {formatMonthLabel(new Date(row.periodStart))}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {format(new Date(row.createdAt), "d MMM yyyy HH:mm", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-mono text-xs">
                  {row.sentToEmail ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{formatSenderName(row)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.sentBy.email}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
