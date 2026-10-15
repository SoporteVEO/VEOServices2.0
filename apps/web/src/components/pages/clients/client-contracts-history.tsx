"use client";

import { CalendarRange, FileText, MapPin, UserRound } from "lucide-react";

import {
  useClientContracts,
  type ClientContract,
} from "@/api/clients/clients.get";
import { ListSkeleton } from "@/components/ui/skeletons";
import { formatBriloShortDate } from "@/lib/format";

import { ClientContractStatusBadge } from "./client-contract-status-badge";

export function ClientContractsHistory({ clientId }: { clientId: string }) {
  const { data: contracts, isLoading, isError } = useClientContracts(clientId);

  if (isLoading) {
    return <ListSkeleton rows={4} variant="card" />;
  }

  if (isError || !contracts) {
    return (
      <p className="text-xs text-destructive">
        No se pudo cargar el historial de contratos.
      </p>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
        <FileText className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Sin contratos registrados</p>
        <p className="text-xs text-muted-foreground">
          No se encontraron contratos asociados al correo de este cliente.
        </p>
      </div>
    );
  }

  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const finishedCount = contracts.filter((c) => c.status === "FINISHED").length;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-3 gap-2">
        <SummaryItem label="Total" value={contracts.length} />
        <SummaryItem label="Vigentes" value={activeCount} />
        <SummaryItem label="Finalizados" value={finishedCount} />
      </section>

      <ul className="flex flex-col gap-2">
        {contracts.map((contract) => (
          <li key={contract.contractSourceId}>
            <ContractItem contract={contract} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-muted/10 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ContractItem({ contract }: { contract: ClientContract }) {
  const title = contract.description ?? contract.brand;

  return (
    <article className="flex flex-col gap-2 rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">
            {contract.contractNumber}
          </p>
          {title ? (
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          ) : null}
        </div>
        <ClientContractStatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="flex items-center gap-1.5">
          <CalendarRange className="size-3.5 shrink-0" aria-hidden />
          {formatBriloShortDate(contract.startDate)} –{" "}
          {formatBriloShortDate(contract.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {contract.totalBillboards}{" "}
          {contract.totalBillboards === 1 ? "valla" : "vallas"}
        </span>
        {contract.executiveName ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{contract.executiveName}</span>
          </span>
        ) : null}
        {contract.agencyName ? (
          <span className="truncate">Agencia: {contract.agencyName}</span>
        ) : null}
      </div>
    </article>
  );
}
