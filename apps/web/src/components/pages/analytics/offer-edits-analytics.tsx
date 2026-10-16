"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PencilLine,
  Wallet,
} from "lucide-react";

import { useOfferEditsAnalytics } from "@/api/analytics/analytics.get";
import type {
  OfferEditDirection,
  OfferEditRow,
  OfferEditsByReasonRow,
  OfferEditsOverview,
} from "@/api/analytics/analytics.types";
import type { OfferEditReason } from "@/api/offers/offers.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Badge } from "@/components/primitives/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  KpiGrid,
  KpiGridSkeleton,
  KpiTile,
  type KpiItem,
} from "@/components/ui/kpi-tile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OFFER_EDIT_REASON_LABELS } from "@/components/pages/my-space/quotation/offer-edit-reasons";
import { formatMoney, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const DIRECTION_META: Record<
  OfferEditDirection,
  { label: string; icon: typeof Minus; className: string }
> = {
  INCREASED: {
    label: "Más vallas",
    icon: ArrowUpRight,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  DECREASED: {
    label: "Menos vallas",
    icon: ArrowDownRight,
    className: "text-rose-600 dark:text-rose-400",
  },
  UNCHANGED: {
    label: "Mismo total",
    icon: Minus,
    className: "text-muted-foreground",
  },
};

function reasonLabel(reason: OfferEditReason | null): string {
  return reason ? OFFER_EDIT_REASON_LABELS[reason] : "Sin motivo";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function signedMoney(value: number): string {
  return value > 0 ? `+${formatMoney(value)}` : formatMoney(value);
}

function actorName(row: OfferEditRow): string {
  if (!row.actor) return "Sistema";
  return (
    [row.actor.firstName, row.actor.lastName].filter(Boolean).join(" ").trim() ||
    row.actor.email
  );
}

interface OfferEditsAnalyticsProps {
  from: string;
  to: string;
  userId: string | null;
}

export function OfferEditsAnalytics({ from, to, userId }: OfferEditsAnalyticsProps) {
  const { data, isLoading, isFetching } = useOfferEditsAnalytics(from, to, {
    userId,
  });
  const [tab, setTab] = useState<"reasons" | "edits">("reasons");
  const busy = isLoading || isFetching;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ediciones de cotizaciones</CardTitle>
        <CardDescription>
          Por qué los asesores agregaron o quitaron vallas después de enviar
          una cotización.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <EditsKpis overview={data} isLoading={busy} />
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="reasons">Por motivo</TabsTrigger>
            <TabsTrigger value="edits">Todas las ediciones</TabsTrigger>
          </TabsList>
          <TabsContent value="reasons">
            <ByReasonTable rows={data?.byReason ?? []} isLoading={busy} />
          </TabsContent>
          <TabsContent value="edits">
            <EditsTable rows={data?.recent ?? []} isLoading={busy} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EditsKpis({
  overview,
  isLoading,
}: {
  overview?: OfferEditsOverview;
  isLoading: boolean;
}) {
  if (isLoading || !overview) return <KpiGridSkeleton count={4} />;

  const { totals } = overview;
  const items: KpiItem[] = [
    {
      icon: PencilLine,
      label: "Ediciones",
      value: totals.edits,
      detail: `En ${totals.offersEdited} cotización${totals.offersEdited === 1 ? "" : "es"}`,
      tone: "violet",
    },
    {
      icon: ArrowUpRight,
      label: "Con más vallas",
      value: totals.increased,
      detail: `Cambio neto: ${signed(totals.netBillboards)} vallas`,
      tone: "emerald",
    },
    {
      icon: ArrowDownRight,
      label: "Con menos vallas",
      value: totals.decreased,
      detail:
        totals.withoutReason > 0
          ? `${totals.withoutReason} sin motivo registrado`
          : "Todas con motivo registrado",
      tone: totals.decreased > 0 ? "rose" : "primary",
    },
    {
      icon: Wallet,
      label: "Impacto en monto",
      value: totals.amountDelta,
      prefix: "USD ",
      detail: "Diferencia total tras las ediciones",
      tone: totals.amountDelta >= 0 ? "sky" : "amber",
    },
  ];

  return (
    <KpiGrid>
      {items.map((item) => (
        <KpiTile key={item.label} item={item} />
      ))}
    </KpiGrid>
  );
}

function ByReasonTable({
  rows,
  isLoading,
}: {
  rows: OfferEditsByReasonRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<OfferEditsByReasonRow>[]>(
    () => [
      {
        id: "reason",
        header: "Motivo",
        cell: ({ row }) => (
          <span className="font-medium">{reasonLabel(row.original.reason)}</span>
        ),
      },
      {
        accessorKey: "edits",
        header: "Ediciones",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.edits}</span>
        ),
      },
      {
        accessorKey: "increased",
        header: "Más vallas",
        cell: ({ row }) => (
          <span className={cn("tabular-nums", DIRECTION_META.INCREASED.className)}>
            {row.original.increased}
          </span>
        ),
      },
      {
        accessorKey: "decreased",
        header: "Menos vallas",
        cell: ({ row }) => (
          <span className={cn("tabular-nums", DIRECTION_META.DECREASED.className)}>
            {row.original.decreased}
          </span>
        ),
      },
      {
        accessorKey: "netBillboards",
        header: "Cambio neto",
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {signed(row.original.netBillboards)}
          </span>
        ),
      },
      {
        accessorKey: "amountDelta",
        header: "Impacto en monto",
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {signedMoney(row.original.amountDelta)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={{ pageSize: PAGE_SIZE }}
      emptyMessage="No hay ediciones con cambios de vallas en el rango."
    />
  );
}

function EditsTable({
  rows,
  isLoading,
}: {
  rows: OfferEditRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<OfferEditRow>[]>(
    () => [
      {
        id: "offer",
        header: "Cotización",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.offerNumber}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.customerCompany || row.original.customerName}
            </p>
          </div>
        ),
      },
      {
        id: "billboards",
        header: "Vallas",
        cell: ({ row }) => {
          const meta = DIRECTION_META[row.original.direction];
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 tabular-nums",
                meta.className,
              )}
              title={meta.label}
            >
              <meta.icon className="size-3.5" aria-hidden />
              {row.original.billboardsBefore} → {row.original.billboardsAfter}
            </span>
          );
        },
      },
      {
        id: "reason",
        header: "Motivo",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-sm flex-col gap-1">
            <Badge
              variant={row.original.reason ? "secondary" : "outline"}
              className="w-fit"
            >
              {reasonLabel(row.original.reason)}
            </Badge>
            {row.original.note ? (
              <p
                className="line-clamp-2 whitespace-normal text-xs text-muted-foreground"
                title={row.original.note}
              >
                {row.original.note}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "amount",
        header: "Monto",
        cell: ({ row }) => {
          const { amountBefore, amountAfter } = row.original;
          if (amountBefore == null || amountAfter == null) return "—";
          return (
            <div className="tabular-nums">
              <p className="font-medium">{formatMoney(amountAfter)}</p>
              <p className="text-xs text-muted-foreground">
                {signedMoney(Math.round((amountAfter - amountBefore) * 100) / 100)}
              </p>
            </div>
          );
        },
      },
      {
        id: "actor",
        header: "Editado por",
        cell: ({ row }) => (
          <span className="truncate">{actorName(row.original)}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatShortDate(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={{ pageSize: PAGE_SIZE }}
      emptyMessage="No hay ediciones en el rango."
    />
  );
}
