"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCrmTaskCounts } from "@/api/crm/crm.get";
import type { CrmTaskBucket } from "@/api/crm/crm.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmScopeToggle, type CrmScope } from "../shared/crm-scope-toggle";
import { CrmTaskFormDialog } from "./crm-task-form-dialog";
import { CrmTaskList } from "./crm-task-list";

const BUCKETS: { value: CrmTaskBucket; label: string; empty: string }[] = [
  { value: "overdue", label: "Vencidas", empty: "No tienes tareas vencidas. ¡Excelente!" },
  { value: "today", label: "Hoy", empty: "Nada pendiente para hoy." },
  { value: "upcoming", label: "Próximas", empty: "No hay tareas programadas." },
  { value: "completed", label: "Completadas", empty: "Aún no has completado tareas." },
];

export function CrmTasksPage() {
  const [bucket, setBucket] = useState<CrmTaskBucket>("today");
  const [scope, setScope] = useState<CrmScope>("mine");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const { data: counts } = useCrmTaskCounts();

  const current = BUCKETS.find((b) => b.value === bucket) ?? BUCKETS[1];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={bucket} onValueChange={(value) => setBucket(value as CrmTaskBucket)}>
          <TabsList>
            {BUCKETS.map((item) => {
              const count =
                item.value === "completed" ? undefined : counts?.[item.value as keyof typeof counts];
              return (
                <TabsTrigger key={item.value} value={item.value} className="gap-1.5">
                  {item.label}
                  {count ? (
                    <span
                      className={cn(
                        "rounded-sm px-1.5 text-[10px] font-semibold tabular-nums",
                        item.value === "overdue"
                          ? "bg-destructive-soft text-destructive"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <CrmScopeToggle
            value={scope}
            onChange={setScope}
            mineLabel="Mis tareas"
            teamLabel="Equipo"
          />
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Nueva tarea
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <CrmTaskList
            query={{ bucket, assigneeId: scope === "mine" ? "me" : "all" }}
            emptyMessage={current.empty}
            showAssignee={scope === "team"}
            onOpenDeal={setSelectedDealId}
          />
        </CardContent>
      </Card>

      <CrmTaskFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CrmDealDrawer
        dealId={selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      />
    </section>
  );
}
