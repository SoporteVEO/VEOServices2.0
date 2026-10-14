import type { User } from "@/api/users/users.types";
import { roleBadge, subRoleBadge } from "./const";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filterUsers(users: User[], search: string): User[] {
  const q = normalize(search.trim());
  if (!q) return users;

  return users.filter((user) => {
    const haystack = [
      user.firstName,
      user.lastName,
      user.email,
      roleBadge[user.role]?.label,
      ...(user.subRoles ?? []).map((sr) => subRoleBadge[sr]?.label),
    ]
      .filter(Boolean)
      .join(" ");
    return normalize(haystack).includes(q);
  });
}
