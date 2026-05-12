"use client";

import { useAllAbsences } from "@/api/absences/absences.get";
import { HrAbsencesTable } from "./hr-absences-table";

export function HrIncapacidadesTab() {
  const { data: absences = [], isLoading } = useAllAbsences();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <HrAbsencesTable absences={absences} isLoading={isLoading} />
    </div>
  );
}
