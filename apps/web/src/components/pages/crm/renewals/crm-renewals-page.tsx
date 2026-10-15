"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Hourglass, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useCrmRenewals } from "@/api/crm/crm-ooh.get";
import { useCreateCrmRenewalDeal } from "@/api/crm/crm-ooh.mutations";
import type { CrmSiteKind } from "@/api/crm/crm-ooh.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiGrid, KpiGridSkeleton, KpiTile, type KpiItem } from "@/components/ui/kpi-tile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "../crm-format";
import { SITE_KIND_LABELS } from "../crm-ooh-const";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmScopeToggle, type CrmScope } from "../shared/crm-scope-toggle";
import { CrmRenewalRow } from "./crm-renewal-row";

const WINDOWS = [30, 60, 90, 180];
const KINDS: CrmSiteKind[] = ["STATIC", "DIGITAL"];
const ALL = "all";

export function CrmRenewalsPage() {
  const [days, setDays] = useState(90);
  const [scope, setScope] = useState<CrmScope>("mine");
  const [kind, setKind] = useState<CrmSiteKind | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const createDeal = useCreateCrmRenewalDeal();

  const { data, isLoading } = useCrmRenewals({
    days,
    scope,
    kind: kind === ALL ? undefined : kind,
    search: debouncedSearch || undefined,
  });

  function handleCreate(key: string) {
    createDeal.mutate(
      { key },
      {
        onSuccess: (deal) => {
          toast.success("Negocio de renovación creado");
          setOpenDealId(deal.id);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo crear el negocio de renovación.")),
      },
    );
  }

  const kpis: KpiItem[] = data
    ? [
        {
          icon: CalendarClock,
          label: "Por vencer",
          value: data.summary.total,
          detail: `${data.summary.endingIn30} en los próximos 30 días`,
          tone: "primary",
        },
        {
          icon: TriangleAlert,
          label: "Sin gestionar",
          value: data.summary.unmanaged,
          detail: "Sin negocio de renovación",
          tone: data.summary.unmanaged > 0 ? "rose" : "neutral",
        },
        {
          icon: Hourglass,
          label: "En negociación",
          value: data.summary.inProgress,
          tone: "violet",
        },
        {
          icon: CheckCircle2,
          label: "Renovados",
          value: data.summary.won,
          detail: `${data.summary.lost} no renovaron`,
          tone: "emerald",
        },
      ]
    : [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((window) => (
                <SelectItem key={window} value={String(window)}>
                  Próximos {window} días
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as CrmSiteKind | typeof ALL)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Vallas y pantallas</SelectItem>
              {KINDS.map((item) => (
                <SelectItem key={item} value={item}>
                  Solo {SITE_KIND_LABELS[item].toLowerCase()}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-full sm:w-64">
            <Input
              isSearch
              placeholder="Cliente, marca, contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CrmScopeToggle
          value={scope}
          onChange={setScope}
          mineLabel="Mis cuentas"
          teamLabel="Todo VEO"
        />
      </div>

      {isLoading || !data ? (
        <KpiGridSkeleton count={4} />
      ) : (
        <KpiGrid>
          {kpis.map((item) => (
            <KpiTile key={item.label} item={item} />
          ))}
        </KpiGrid>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading || !data ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <RefreshCw className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nada por renovar en esta ventana</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Aquí aparecen los contratos de vallas y las campañas digitales que terminan
                pronto, para que propongas la renovación antes de que se libere el espacio.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((item) => (
                <CrmRenewalRow
                  key={item.key}
                  item={item}
                  creating={createDeal.isPending && createDeal.variables?.key === item.key}
                  onCreate={() => handleCreate(item.key)}
                  onOpenDeal={setOpenDealId}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CrmDealDrawer
        dealId={openDealId}
        onOpenChange={(open) => {
          if (!open) setOpenDealId(null);
        }}
      />
    </section>
  );
}
