export function formatTeamMemberFullName(parts: {
  firstName: string;
  lastName?: string | null;
  secondLastName?: string | null;
}): string {
  return [parts.firstName, parts.lastName, parts.secondLastName]
    .filter((p) => Boolean(p && String(p).trim()))
    .join(' ')
    .trim();
}
