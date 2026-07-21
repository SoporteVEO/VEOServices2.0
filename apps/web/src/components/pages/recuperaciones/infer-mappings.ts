import type {
  BriloBanco,
  BriloTipoAbono,
} from "@/api/brilo-webapi/brilo-webapi.types";

/**
 * Common Excel bank label → Brilo `bcoCodigo`. Matching is done after
 * normalizing both sides (removing punctuation, accents and the leading
 * "BANCO " prefix that Brilo uses in `bcoNombre`).
 */
const EXCEL_TO_BRILO_HINTS: Record<string, string> = {
  agricola: "AGR",
  bac: "CRE",
  americacentral: "CRE",
  bancoamericacentral: "CRE",
  cuscatlan: "CUSCA",
  cuscatlandeel: "CUSCA",
  davivienda: "HSBC",
  hsbc: "HSBC",
  promerica: "PRO",
  americano: "BAM",
  azul: "AZUL",
  agua: "AGUA",
  cuscatlanagua: "AGUA",
  cusccifa: "CUSCA",
  cuscatlancifa: "CUSCA",
  scotiabank: "SCOTIABANK",
  industrial: "BI",
  hipotecario: "HPO",
  fomento: "BFO",
  bfa: "BFO",
  gyt: "G&T",
  multivalores: "BMV",
};

function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function bankNameVariants(banco: BriloBanco): string[] {
  return [banco.bcoNombre, banco.bcoNombreAbr, banco.bcoCodigo]
    .map((v) => normalize(v ?? ""))
    .filter((v) => v.length > 0)
    .map((v) => v.replace(/^banco/, ""));
}

export function inferBancoCodigo(
  bancoExcel: string,
  bancos: BriloBanco[],
): string | null {
  if (!bancoExcel) return null;
  const normalized = normalize(bancoExcel).replace(/^banco/, "");
  if (!normalized) return null;

  const hint = EXCEL_TO_BRILO_HINTS[normalized];
  if (hint) {
    const direct = bancos.find((b) => b.bcoCodigo.toUpperCase() === hint);
    if (direct) return direct.bcoCodigo;
  }

  const exact = bancos.find((b) =>
    bankNameVariants(b).some((variant) => variant === normalized),
  );
  if (exact) return exact.bcoCodigo;

  const partial = bancos.find((b) =>
    bankNameVariants(b).some(
      (variant) =>
        variant.length >= 3 &&
        (variant.includes(normalized) || normalized.includes(variant)),
    ),
  );
  return partial?.bcoCodigo ?? null;
}

export function inferTipoAbono(
  numCheque: string,
  bancoExcel: string,
  tiposAbono: BriloTipoAbono[],
): string {
  const cheque = numCheque?.trim() ?? "";
  const banco = bancoExcel?.trim().toUpperCase() ?? "";

  const upper = cheque.toUpperCase();

  if (upper === "REMESADO" || upper === "TRANSFERENCIA" || upper.startsWith("R/")) {
    return findTipoAbonoCodigo(tiposAbono, ["TRA", "TRANS", "REM"]);
  }
  if (upper === "CONFIRMADO" || upper.includes("PAYWAY")) {
    return findTipoAbonoCodigo(tiposAbono, ["TRA", "TRANS"]);
  }
  if (upper.startsWith("NC")) {
    return findTipoAbonoCodigo(tiposAbono, ["NAB", "NC"]);
  }
  if (upper.startsWith("DTE")) {
    return findTipoAbonoCodigo(tiposAbono, ["NAB", "EFE"]);
  }
  if (banco === "NC") {
    return findTipoAbonoCodigo(tiposAbono, ["NAB", "NC"]);
  }
  if (/^\d+$/.test(cheque)) {
    return findTipoAbonoCodigo(tiposAbono, ["CHE", "CHK"]);
  }
  return findTipoAbonoCodigo(tiposAbono, ["TRA", "EFE", "CHE"]);
}

function findTipoAbonoCodigo(
  tiposAbono: BriloTipoAbono[],
  preferredCodes: string[],
): string {
  for (const code of preferredCodes) {
    const match = tiposAbono.find((t) => t.tabCodigo.toUpperCase() === code);
    if (match) return match.tabCodigo;
  }
  return tiposAbono[0]?.tabCodigo ?? "";
}
