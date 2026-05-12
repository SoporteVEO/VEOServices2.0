"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { User } from "@/api/users/users.types";
import { useUsers } from "@/api/users/users.get";
import { Button } from "@/components/ui/button";
import {
  UserDetailDrawer,
  UserFormDialog,
  UsersTable,
} from "@/components/pages/users";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser =
    users.find((u) => u.id === selectedUserId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1"></div>

        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Nuevo usuario
        </Button>
      </div>

      <UsersTable
        users={users}
        isLoading={isLoading}
        onRowClick={(user: User) => setSelectedUserId(user.id)}
      />

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <UserDetailDrawer
        user={selectedUser}
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />
    </div>
  );
}
