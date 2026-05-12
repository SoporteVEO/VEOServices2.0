"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMyAbsences } from "@/api/absences/absences.get";
import { Button } from "@/components/ui/button";
import { AbsenceFormDialog } from "./absence-form-dialog";
import { MyAbsencesTable } from "./my-absences-table";

export function IncapacidadesTab() {
  const { data: absences = [], isLoading } = useMyAbsences();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Mis incapacidades
          </h2>
          <p className="text-sm text-muted-foreground">
            Registra tus solicitudes de incapacidad y consulta su estado.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Nueva solicitud
        </Button>
      </div>

      <MyAbsencesTable absences={absences} isLoading={isLoading} />

      <AbsenceFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
