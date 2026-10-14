import type { AgentCell, AgentColumnFormat } from "@/api/agent/agent.types";
import { formatDate } from "@/lib/format";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatAgentValue(
  value: AgentCell | undefined,
  format: AgentColumnFormat | undefined = "text",
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";

  const numeric = typeof value === "number" ? value : Number(value);
  const isNumeric = Number.isFinite(numeric) && String(value).trim() !== "";

  switch (format) {
    case "currency":
      return isNumeric ? currency.format(numeric) : String(value);
    case "number":
      return isNumeric ? number.format(numeric) : String(value);
    case "percent":
      return isNumeric ? `${number.format(numeric)}%` : String(value);
    case "date":
      return typeof value === "string" ? formatDate(value) : String(value);
    default:
      return String(value);
  }
}

export function isNumericFormat(format: AgentColumnFormat | undefined) {
  return format === "currency" || format === "number" || format === "percent";
}

export function toNumber(value: AgentCell | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
