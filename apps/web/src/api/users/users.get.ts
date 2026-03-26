import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "./users.types";

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
