import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  KssItem,
  KssKind,
  MentorshipStartOutcome,
  MentorshipStatus,
} from "@/api/mentorships/mentorships.types";
import { parseYYYYMMDD } from "@/lib/format";

export const FORM_CODE = "VEO-FOR-03";
export const MANUAL_CODE = "VEO-TH-MAN-01";
export const MAX_TEXT_LENGTH = 2000;

export const STATUS_LABELS: Record<MentorshipStatus, string> = {
  DONE: "Realizada",
  PENDING: "Pendiente",
  OVERDUE: "Vencida",
};

export const STATUS_STYLES: Record<MentorshipStatus, string> = {
  DONE: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PENDING:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  OVERDUE: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const OUTCOME_ORDER: MentorshipStartOutcome[] = ["YES", "PARTIAL", "NO"];

export const OUTCOME_LABELS: Record<MentorshipStartOutcome, string> = {
  YES: "Sí",
  PARTIAL: "Parcial",
  NO: "No",
};

export const OUTCOME_STYLES: Record<MentorshipStartOutcome, string> = {
  YES: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PARTIAL:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  NO: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const KSS_ORDER: KssKind[] = ["keep", "stop", "start"];

export const KSS_SECTIONS: Record<
  KssKind,
  { title: string; hint: string; accent: string }
> = {
  keep: {
    title: "Keep · Continuar",
    hint: "Una conducta o práctica que funciona y debe mantenerse.",
    accent: "border-l-emerald-500",
  },
  stop: {
    title: "Stop · Dejar de hacer",
    hint: "Una conducta que frena su desempeño o al equipo.",
    accent: "border-l-red-500",
  },
  start: {
    title: "Start · Empezar a hacer",
    hint: "Una acción nueva; se evaluará en la próxima sesión.",
    accent: "border-l-sky-500",
  },
};

export const KSS_FIELDS: {
  key: keyof KssItem;
  label: string;
  placeholder: string;
}[] = [
  { key: "what", label: "Qué", placeholder: "La conducta concreta" },
  { key: "how", label: "Cómo", placeholder: "Acciones para lograrlo" },
  { key: "when", label: "Cuándo", placeholder: "Plazo o frecuencia" },
  {
    key: "indicator",
    label: "Indicador",
    placeholder: "Cómo se medirá el avance",
  },
];

/** `YYYY-MM-DD` calendar days, rendered without timezone shifts. */
export function formatDay(value: string | null | undefined): string {
  const day = parseYYYYMMDD(value);
  return day ? format(day, "d MMM yyyy", { locale: es }) : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function quarterRange(key: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const firstMonth = (Number(match[2]) - 1) * 3;
  return {
    start: new Date(year, firstMonth, 1),
    end: new Date(year, firstMonth + 3, 0),
  };
}

export function quarterLabel(key: string): string {
  const match = /^(\d{4})-Q([1-4])$/.exec(key);
  return match ? `T${match[2]} ${match[1]}` : key;
}

export function percentLabel(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}
