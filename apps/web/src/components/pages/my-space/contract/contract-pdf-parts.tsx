import type { ReactNode } from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type {
  OfferContractBillboard,
  OfferContractData,
} from "@/api/offers/offers.types";
import { DocInfoCell } from "../document/veo-document-parts";
import { docStyles as d } from "../document/veo-document-styles";
import {
  formatMoney,
  formatPaddedDate,
  formatShortDate,
  type ContractClause,
  type ContractRun,
} from "./contract-template";
import { contractStyles as s } from "./contract-pdf-styles";

export function runsToText(runs: ContractRun[]): string {
  return runs.map((run) => run.text).join("");
}

export function ContractSummary({ data }: { data: OfferContractData }) {
  return (
    <View style={d.infoGrid} wrap={false}>
      <View style={d.infoRow}>
        <DocInfoCell
          label="CANTIDAD DE VALLAS:"
          value={String(data.billboardCount)}
          valueStyle={s.summaryValue}
        />
        <DocInfoCell
          label="VALOR DE ALQUILER MENSUAL:"
          value={formatMoney(data.monthlyRentalTotal)}
          valueStyle={s.summaryValue}
        />
        <DocInfoCell
          label="VALOR TOTAL DEL CONTRATO:"
          value={formatMoney(data.contractTotal)}
          valueStyle={s.summaryValue}
          highlight
        />
      </View>
      <View style={d.infoRow}>
        <DocInfoCell
          label="FECHA DE INICIO DE CONTRATO:"
          value={formatPaddedDate(data.startDate)}
          valueStyle={s.summaryValueSmall}
        />
        <DocInfoCell
          label="FECHA DE FINALIZACIÓN DE CONTRATO:"
          value={formatPaddedDate(data.endDate)}
          valueStyle={s.summaryValueSmall}
        />
        <DocInfoCell
          label="PRODUCCIÓN:"
          value="Ver cláusula III"
          valueStyle={s.summaryValueSmall}
        />
      </View>
    </View>
  );
}

type DetailColumn = {
  heading: string;
  width: string;
  align?: "right";
};

const DETAIL_COLUMNS: DetailColumn[] = [
  { heading: "Tipo de Valla", width: "13.5%" },
  { heading: "Código", width: "9%" },
  { heading: "Ubicación", width: "38%" },
  { heading: "Medidas", width: "10%" },
  { heading: "Costo Unitario", width: "12.5%", align: "right" },
  { heading: "Vigencia", width: "17%" },
];

function Td({
  column,
  style,
  children,
}: {
  column: number;
  style?: Style;
  children: ReactNode;
}) {
  const { width, align } = DETAIL_COLUMNS[column];
  return (
    <View style={[d.td, { width }]}>
      <Text style={[{ textAlign: align ?? "left" }, style ?? {}]}>
        {children}
      </Text>
    </View>
  );
}

function DetailRow({ billboard }: { billboard: OfferContractBillboard }) {
  const period =
    billboard.startDate && billboard.endDate
      ? `${formatShortDate(billboard.startDate)} al ${formatShortDate(billboard.endDate)}`
      : "";

  return (
    <View style={d.tableRow} wrap={false}>
      <Td column={0}>{billboard.vallaType}</Td>
      <Td column={1} style={d.tdCode}>
        {billboard.code}
      </Td>
      <Td column={2} style={s.tdLight}>
        {billboard.location}
        {billboard.area ? (
          <Text style={d.tdArea}> · {billboard.area}</Text>
        ) : null}
      </Td>
      <Td column={3} style={s.tdLight}>
        {billboard.dimensions}
      </Td>
      <Td column={4}>{formatMoney(billboard.monthlyCost)}</Td>
      <Td column={5} style={s.tdLight}>
        {period}
      </Td>
    </View>
  );
}

export function ContractDetailTable({ data }: { data: OfferContractData }) {
  return (
    <View style={s.table}>
      <View style={d.tableHeadRow} wrap={false}>
        {DETAIL_COLUMNS.map((column) => (
          <View key={column.heading} style={[d.th, { width: column.width }]}>
            <Text style={[d.thText, { textAlign: column.align ?? "left" }]}>
              {column.heading}
            </Text>
          </View>
        ))}
      </View>
      {data.billboards.map((billboard, index) => (
        <DetailRow key={`${billboard.code}-${index}`} billboard={billboard} />
      ))}
    </View>
  );
}

function ClauseBlock({
  clause,
  last,
}: {
  clause: ContractClause;
  last: boolean;
}) {
  return (
    <View style={last ? {} : s.clause}>
      <View style={s.clauseHead} minPresenceAhead={30}>
        <Text style={s.clauseNumeral}>{clause.numeral}</Text>
        <Text style={s.clauseTitle}>{clause.title}</Text>
      </View>
      <Text style={s.clauseBody}>{runsToText(clause.body)}</Text>
    </View>
  );
}

/**
 * react-pdf has no CSS columns, so the clauses are split where the two
 * columns come out closest in length, keeping each clause whole.
 */
function splitClauses(clauses: ContractClause[]): [ContractClause[], ContractClause[]] {
  const lengths = clauses.map(
    (clause) => clause.title.length + runsToText(clause.body).length,
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);

  let best = 1;
  let bestDiff = Infinity;
  let left = 0;
  for (let index = 0; index < clauses.length - 1; index++) {
    left += lengths[index];
    const diff = Math.abs(total - 2 * left);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = index + 1;
    }
  }
  return [clauses.slice(0, best), clauses.slice(best)];
}

export function ContractClauses({ clauses }: { clauses: ContractClause[] }) {
  const [left, right] = splitClauses(clauses);
  return (
    <View style={s.clauseColumns}>
      <View style={s.clauseColumnLeft}>
        {left.map((clause, index) => (
          <ClauseBlock
            key={clause.numeral}
            clause={clause}
            last={index === left.length - 1}
          />
        ))}
      </View>
      <View style={s.clauseColumnRight}>
        {right.map((clause, index) => (
          <ClauseBlock
            key={clause.numeral}
            clause={clause}
            last={index === right.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
