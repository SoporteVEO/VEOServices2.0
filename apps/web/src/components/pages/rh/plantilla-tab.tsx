"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTeamMembers } from "@/api/team-members/team-members.get";
import { Button } from "@/components/ui/button";
import { TeamMembersTable } from "./team-members-table";
import { TeamMemberFormDialog } from "./team-member-form-dialog";

export function PlantillaTab() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const [createOpen, setCreateOpen] = useState(false);

  const existingUserIds = useMemo(
    () => teamMembers.map((m) => m.userId),
    [teamMembers],
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-end gap-4">
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Agregar miembro
        </Button>
      </div>

      <TeamMembersTable teamMembers={teamMembers} isLoading={isLoading} />

      <TeamMemberFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingUserIds={existingUserIds}
      />
    </div>
  );
}
