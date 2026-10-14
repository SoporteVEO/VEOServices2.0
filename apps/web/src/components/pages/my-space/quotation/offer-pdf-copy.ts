import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OfferItem, StaticOfferItem } from "./offer-types";

export const OFFER_TAGLINE = "Su marca, visible en el lugar correcto.";
export const CONDITIONS_TAGLINE = "Lo que muestras importa.";
export const PAYMENT_TERMS =
  "Cheque o transferencia a nombre de ARHEDES S.A. de C.V.";
export const LESSOR_ADDRESS =
  "AV. VICTOR MANUEL LARA BLOCK 4 A, COL. CAMPESTRE, # 9, SAN SALVADOR, SAN SALVADOR · 2528-7400";

export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$ ${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSize(
  width: number | null,
  height: number | null,
): string | null {
  if (width == null && height == null) return null;
  const w = width != null ? width.toFixed(2) : "—";
  const h = height != null ? height.toFixed(2) : "—";
  return `${w} × ${h} m`;
}

export function joinDetails(parts: (string | null | undefined)[]): string | null {
  const kept = parts.filter((part): part is string => Boolean(part?.trim()));
  return kept.length > 0 ? kept.join(" · ") : null;
}

/**
 * Static descriptions are stored as "address · city, department"; the design
 * prints the area in the secondary colour, so it is split back out here.
 */
export function splitStaticDescription(item: StaticOfferItem): {
  location: string;
  area: string | null;
} {
  const description = item.description?.trim() || "Valla estática";
  const area = [item.cityName, item.departmentName].filter(Boolean).join(", ");
  const suffix = ` · ${area}`;
  if (area && description.endsWith(suffix)) {
    return { location: description.slice(0, -suffix.length), area };
  }
  return { location: description, area: null };
}

function countPhrase(count: number, singular: string, plural: string) {
  return count === 1 ? `una ${singular}` : `${count} ${plural}`;
}

function joinSpanish(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

function periodPhrase(start: Date, end: Date): string {
  const day = (d: Date) => format(d, "d", { locale: es });
  const month = (d: Date) => format(d, "MMMM", { locale: es });
  const year = (d: Date) => format(d, "yyyy");

  if (year(start) !== year(end)) {
    return `del ${day(start)} de ${month(start)} de ${year(start)} al ${day(end)} de ${month(end)} de ${year(end)}`;
  }
  if (month(start) !== month(end)) {
    return `del ${day(start)} de ${month(start)} al ${day(end)} de ${month(end)} de ${year(end)}`;
  }
  return `del ${day(start)} al ${day(end)} de ${month(end)} de ${year(end)}`;
}

/** Opening line summarising what is being quoted and for when. */
export function buildIntroSentence(items: OfferItem[]): string {
  const quantityOf = (type: OfferItem["type"]) =>
    items
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + item.quantity, 0);

  const statics = quantityOf("STATIC_BILLBOARD");
  const digitals = quantityOf("DIGITAL_BILLBOARD");
  const parts = [
    statics ? countPhrase(statics, "valla estática", "vallas estáticas") : null,
    digitals
      ? countPhrase(digitals, "pantalla digital", "pantallas digitales")
      : null,
  ].filter((part): part is string => part != null);
  const what = joinSpanish(parts) || "los conceptos detallados a continuación";

  const starts = items.flatMap((item) => (item.startDate ? [item.startDate] : []));
  const ends = items.flatMap((item) => (item.endDate ? [item.endDate] : []));
  const period =
    starts.length && ends.length
      ? periodPhrase(
          new Date(Math.min(...starts.map((d) => d.getTime()))),
          new Date(Math.max(...ends.map((d) => d.getTime()))),
        )
      : null;

  return `Esta es la propuesta para su solicitud: ${what}${
    period ? `, ${period}` : ""
  }. Cada estructura de VEO opera con permiso vigente y registro de exhibición.`;
}
