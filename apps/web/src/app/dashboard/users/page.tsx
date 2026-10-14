"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { User } from "@/api/users/users.types";
import { useUsers } from "@/api/users/users.get";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserDetailDrawer,
  UserFormDialog,
  UsersTable,
  filterUsers,
} from "@/components/pages/users";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const filteredUsers = filterUsers(users, search);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <Input
            isSearch
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            aria-label="Buscar usuarios"
            autoComplete="off"
          />
        </div>

        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Nuevo usuario
        </Button>
      </div>

      <div className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col gap-4">
        <UsersTable
          users={filteredUsers}
          isLoading={isLoading}
          onRowClick={(user: User) => setSelectedUserId(user.id)}
          emptyMessage={
            search.trim()
              ? "Ningún usuario coincide con la búsqueda."
              : undefined
          }
        />
      </div>

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
