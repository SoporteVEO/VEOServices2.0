"use client";

import { useMemo } from "react";
import { Mail, Repeat, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Badge } from "@/components/primitives/ui/badge";
import { formatMoney } from "@/lib/format";
import type { BillboardContractHistoryItem } from "@/api/billboards/billboards.get";

const MAX_CUSTOMERS = 4;

interface BillboardTopCustomersProps {
  contracts: BillboardContractHistoryItem[];
}

type CustomerStat = {
  name: string;
  email: string | null;
  contractsCount: number;
  totalSpent: number;
};

export function BillboardTopCustomers({
  contracts,
}: BillboardTopCustomersProps) {
  const topCustomers = useMemo(() => {
    const byName = new Map<string, CustomerStat>();
    for (const c of contracts) {
      if (!c.customerName) continue;
      const existing = byName.get(c.customerName);
      if (existing) {
        existing.contractsCount++;
        if (c.price != null) existing.totalSpent += c.price;
        if (!existing.email && c.customerEmail) existing.email = c.customerEmail;
      } else {
        byName.set(c.customerName, {
          name: c.customerName,
          email: c.customerEmail,
          contractsCount: 1,
          totalSpent: c.price ?? 0,
        });
      }
    }
    return [...byName.values()]
      .sort((a, b) => b.contractsCount - a.contractsCount || b.totalSpent - a.totalSpent)
      .slice(0, MAX_CUSTOMERS);
  }, [contracts]);

  if (topCustomers.length === 0) return null;

  const repeaters = topCustomers.filter((c) => c.contractsCount > 1).length;

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Clientes recurrentes</CardTitle>
            <CardDescription className="text-xs">
              {repeaters > 0
                ? `${repeaters} cliente(s) con compras repetidas`
                : "Oportunidad para fidelizar nuevos clientes"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {topCustomers.map((c, idx) => (
            <li
              key={c.name}
              className="flex items-center justify-between gap-3 rounded-md border bg-accent/10 p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {idx === 0 ? <Trophy className="size-3.5" /> : idx + 1}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="size-3" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {c.contractsCount > 1 && (
                  <Badge className="h-4 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent text-[10px]">
                    <Repeat className="size-2.5" />×{c.contractsCount}
                  </Badge>
                )}
                {c.totalSpent > 0 && (
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {formatMoney(c.totalSpent)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
