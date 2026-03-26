"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useUsers } from "@/api/users/users.get";
import { Button } from "@/components/ui/button";
import { UsersTable, UserFormDialog } from "@/components/pages/users";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1"></div>

        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Nuevo usuario
        </Button>
      </div>

      <UsersTable users={users} isLoading={isLoading} />

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
