"use client";

import { useMemo, useState } from "react";

import { useMyContractsSnapshot, useMyReportsTrend } from "@/api/contracts/contracts.get";
import { useMyOffersSummary } from "@/api/offers/offers.get";
import { authClient } from "@/lib/auth-client";
import { formatHumanDate, parseYYYYMMDD, toYYYYMMDD } from "@/lib/format";
import { DateRangePicker } from "@/components/ui/date-range-picker";

import {
  MySpaceContractsCoverageDonut,
  MySpaceKpisRow,
  MySpaceOffersStatusDonut,
  MySpaceOffersTrendChart,
  MySpaceReportsTrendChart,
  MySpaceSalesTrendChart,
  defaultDashboardFrom,
  defaultDashboardTo,
} from "./home";

export function MySpaceHome() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [fromStr, setFromStr] = useState(() => toYYYYMMDD(defaultDashboardFrom()));
  const [toStr, setToStr] = useState(() => toYYYYMMDD(defaultDashboardTo()));

  const initialFrom = useMemo(
    () => parseYYYYMMDD(fromStr) ?? defaultDashboardFrom(),
    [fromStr],
  );
  const initialTo = useMemo(
    () => parseYYYYMMDD(toStr) ?? defaultDashboardTo(),
    [toStr],
  );

  const { fromIso, toIso } = useMemo(() => {
    const from = parseYYYYMMDD(fromStr) ?? defaultDashboardFrom();
    const to = parseYYYYMMDD(toStr) ?? defaultDashboardTo();
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    return { fromIso: fromDate.toISOString(), toIso: toDate.toISOString() };
  }, [fromStr, toStr]);

  const offersQuery = useMyOffersSummary({ from: fromIso, to: toIso });
  const reportsQuery = useMyReportsTrend({ from: fromIso, to: toIso });
  const contractsQuery = useMyContractsSnapshot();

  const isLoading =
    offersQuery.isLoading || reportsQuery.isLoading || contractsQuery.isLoading;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-xs text-muted-foreground">
            {formatHumanDate(initialFrom)} – {formatHumanDate(initialTo)}
          </p>
        </div>
        <DateRangePicker
          align="end"
          locale="es-ES"
          showCompare={false}
          initialDateFrom={initialFrom}
          initialDateTo={initialTo}
          onUpdate={({ range }) => {
            const to = range.to ?? range.from;
            setFromStr(toYYYYMMDD(range.from));
            setToStr(toYYYYMMDD(to));
          }}
        />
      </header>

      <MySpaceKpisRow
        offers={offersQuery.data}
        contracts={contractsQuery.data}
        reports={reportsQuery.data}
        isLoading={isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MySpaceSalesTrendChart />
        </div>
        <MySpaceOffersStatusDonut
          offers={offersQuery.data}
          isLoading={offersQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MySpaceOffersTrendChart />
        </div>
        <MySpaceContractsCoverageDonut
          contracts={contractsQuery.data}
          isLoading={contractsQuery.isLoading}
        />
      </div>

      <MySpaceReportsTrendChart />
    </div>
  );
}
