import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PatchNoteAuthor } from "@/api/patch-notes/patch-notes.types";

export const DEVELOPER_SUB_ROLE = "DESARROLLADOR";

export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 120;
export const MIN_BODY_LENGTH = 5;
export const MAX_BODY_LENGTH = 10000;

export function formatPatchNoteDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, "d 'de' MMMM yyyy", { locale: es });
}

export function patchNoteAuthorName(author: PatchNoteAuthor | null): string {
  if (!author) return "Equipo VEO";
  return [author.firstName, author.lastName].filter(Boolean).join(" ");
}

export function suggestNextVersion(current: string | null | undefined): string {
  if (!current || !VERSION_PATTERN.test(current)) return "1.0.0";
  const [major, minor, patch] = current.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}
