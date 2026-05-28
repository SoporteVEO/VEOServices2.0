import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User, UserLookupItem } from "./users.types";

export async function getUsers() {
  const response = await apiFetch<{ data: User[] }>("/users");
  return response.data;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
}

export async function getUsersLookup(
  options: { includeSelf?: boolean } = {},
) {
  const query: Record<string, string> = {};
  if (options.includeSelf) query.includeSelf = "true";
  const response = await apiFetch<{ data: UserLookupItem[] }>(
    "/users/lookup",
    { query },
  );
  return response.data;
}

export function useUsersLookup({
  enabled = true,
  includeSelf = false,
}: { enabled?: boolean; includeSelf?: boolean } = {}) {
  return useQuery({
    queryKey: ["users", "lookup", includeSelf],
    queryFn: () => getUsersLookup({ includeSelf }),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
