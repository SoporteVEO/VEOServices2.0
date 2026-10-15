import type { Client } from "@/api/clients/clients.types";

export function getClientInitials(client: Pick<Client, "name" | "email">) {
  const source = client.name?.trim() || client.email;
  if (!source) return "?";
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]);
  return parts.join("").slice(0, 2).toUpperCase() || source[0]!.toUpperCase();
}
