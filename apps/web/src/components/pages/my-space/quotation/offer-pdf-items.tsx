import type { ReactNode } from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { formatHumanDateRange } from "@/lib/format";
import { docStyles as d } from "../document/veo-document-styles";
import {
  formatCurrency,
  formatSize,
  joinDetails,
  splitStaticDescription,
} from "./offer-pdf-copy";
import {
  formatDiscountPercent,
  priceDiscount,
  staticListRentalPrice,
  type OfferDiscountSummary,
  type PriceDiscount,
} from "./offer-discounts";
import { offerStyles as s } from "./offer-pdf-styles";
import type {
  DigitalOfferItem,
  MiscOfferItem,
  OfferTotals,
  StaticOfferItem,
} from "./offer-types";

type Align = "left" | "center" | "right";

interface Column {
  heading: string;
  width: string;
  align?: Align;
}

const STATIC_COLUMNS: Column[] = [
  { heading: "Código", width: "10.5%" },
  { heading: "Descripción", width: "42%" },
  { heading: "Cant.", width: "7.5%", align: "center" },
  { heading: "Arrendamiento", width: "17.5%", align: "right" },
  { heading: "Impresión", width: "11.5%", align: "right" },
  { heading: "Total", width: "11%", align: "right" },
];

const DIGITAL_COLUMNS: Column[] = [
  { heading: "Código", width: "10.5%" },
  { heading: "Descripción", width: "42%" },
  { heading: "Spots/día", width: "11%", align: "center" },
  { heading: "Cant.", width: "7.5%", align: "center" },
  { heading: "Arrendamiento", width: "17.5%", align: "right" },
  { heading: "Total", width: "11.5%", align: "right" },
];

const MISC_COLUMNS: Column[] = [
  { heading: "Código", width: "10.5%" },
  { heading: "Descripción", width: "49%" },
  { heading: "Cant.", width: "7.5%", align: "center" },
  { heading: "Precio", width: "17.5%", align: "right" },
  { heading: "Total", width: "15.5%", align: "right" },
];

/** Below this many rows a section is kept on one page instead of splitting. */
const NO_WRAP_ROW_LIMIT = 8;

function period(start: Date | null, end: Date | null): string | null {
  return start || end ? formatHumanDateRange(start, end) : null;
}

function Description({
  title,
  area,
  detail,
}: {
  title: string;
  area?: string | null;
  detail?: string | null;
}) {
  return (
    <View>
      <Text style={s.description}>
        {title}
        {area ? <Text style={d.tdArea}> · {area}</Text> : null}
      </Text>
      {detail ? <Text style={s.descriptionDetail}>{detail}</Text> : null}
    </View>
  );
}

function PriceCell({
  charged,
  discount,
}: {
  charged: number;
  discount: PriceDiscount | null;
}) {
  return (
    <View>
      <Text style={[s.tdText, { textAlign: "right" }]}>
        {formatCurrency(charged)}
      </Text>
      {discount ? (
        <Text style={s.priceDiscount}>
          <Text style={s.priceList}>{formatCurrency(discount.list)}</Text>
          {"  "}-{formatDiscountPercent(discount.percent)}
        </Text>
      ) : null}
    </View>
  );
}

function Cell({
  column,
  style,
  children,
}: {
  column: Column;
  style?: Style;
  children: ReactNode;
}) {
  const textAlign = column.align ?? "left";
  return (
    <View style={[d.td, { width: column.width }]}>
      {typeof children === "string" ? (
        <Text style={[s.tdText, { textAlign }, style ?? {}]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

interface Row {
  key: string;
  cells: ReactNode[];
}

function ItemsSection({
  title,
  columns,
  rows,
  subtotalLabel,
  subtotal,
}: {
  title: string;
  columns: Column[];
  rows: Row[];
  subtotalLabel: string;
  subtotal: number;
}) {
  const lastWidth = columns[columns.length - 1].width;

  return (
    <View wrap={rows.length > NO_WRAP_ROW_LIMIT}>
      <View style={s.sectionTitle} minPresenceAhead={90}>
        <View style={s.sectionTitleDot} />
        <Text style={s.sectionTitleText}>{title}</Text>
      </View>
      <View style={s.table}>
        <View style={d.tableHeadRow} wrap={false}>
          {columns.map((column) => (
            <View key={column.heading} style={[d.th, { width: column.width }]}>
              <Text style={[d.thText, { textAlign: column.align ?? "left" }]}>
                {column.heading}
              </Text>
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.key} style={d.tableRow} wrap={false}>
            {row.cells.map((cell, index) => (
              <Cell key={index} column={columns[index]} style={index === 0 ? d.tdCode : undefined}>
                {cell}
              </Cell>
            ))}
          </View>
        ))}
        <View style={s.subtotalRow} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.subtotalLabel}>{subtotalLabel}</Text>
          </View>
          <View style={{ width: lastWidth }}>
            <Text style={s.subtotalValue}>{formatCurrency(subtotal)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function StaticItemsSection({ items }: { items: StaticOfferItem[] }) {
  if (items.length === 0) return null;

  const lineTotal = (item: StaticOfferItem) =>
    (item.rentalPrice + item.impressionPrice) * item.quantity;

  return (
    <ItemsSection
      title="VALLAS ESTÁTICAS"
      columns={STATIC_COLUMNS}
      subtotalLabel="SUBTOTAL VALLAS ESTÁTICAS"
      subtotal={items.reduce((sum, item) => sum + lineTotal(item), 0)}
      rows={items.map((item) => {
        const { location, area } = splitStaticDescription(item);
        return {
          key: item.id,
          cells: [
            item.billboardCode || "—",
            <Description
              key="description"
              title={location}
              area={area}
              detail={joinDetails([
                formatSize(item.width, item.height),
                period(item.startDate, item.endDate),
              ])}
            />,
            String(item.quantity),
            <PriceCell
              key="rental"
              charged={item.rentalPrice}
              discount={priceDiscount(staticListRentalPrice(item), item.rentalPrice)}
            />,
            <PriceCell
              key="impression"
              charged={item.impressionPrice}
              discount={priceDiscount(item.listImpressionPrice, item.impressionPrice)}
            />,
            formatCurrency(lineTotal(item)),
          ],
        };
      })}
    />
  );
}

export function DigitalItemsSection({ items }: { items: DigitalOfferItem[] }) {
  if (items.length === 0) return null;

  return (
    <ItemsSection
      title="PANTALLAS"
      columns={DIGITAL_COLUMNS}
      subtotalLabel="SUBTOTAL PANTALLAS"
      subtotal={items.reduce(
        (sum, item) => sum + item.rentalPrice * item.quantity,
        0,
      )}
      rows={items.map((item) => ({
        key: item.id,
        cells: [
          item.billboardCode || "—",
          <Description
            key="description"
            title={item.name}
            detail={joinDetails([
              item.address,
              period(item.startDate, item.endDate),
            ])}
          />,
          String(item.spotCount),
          String(item.quantity),
          formatCurrency(item.rentalPrice),
          formatCurrency(item.rentalPrice * item.quantity),
        ],
      }))}
    />
  );
}

export function MiscItemsSection({ items }: { items: MiscOfferItem[] }) {
  if (items.length === 0) return null;

  return (
    <ItemsSection
      title="OTROS CONCEPTOS"
      columns={MISC_COLUMNS}
      subtotalLabel="SUBTOTAL OTROS CONCEPTOS"
      subtotal={items.reduce(
        (sum, item) => sum + item.rentalPrice * item.quantity,
        0,
      )}
      rows={items.map((item, index) => ({
        key: item.id,
        cells: [
          `C-${String(index + 1).padStart(2, "0")}`,
          <Description
            key="description"
            title={item.description || "Concepto adicional"}
            detail={period(item.startDate, item.endDate)}
          />,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.rentalPrice * item.quantity),
        ],
      }))}
    />
  );
}

const TOTALS_COLUMNS = ["30%", "35%", "35%"];

function TotalsRow({
  label,
  rental,
  impression,
}: {
  label: string;
  rental: number;
  impression: number;
}) {
  return (
    <View style={s.totalsRow}>
      <View style={{ width: TOTALS_COLUMNS[0] }}>
        <Text style={s.totalsLabel}>{label}</Text>
      </View>
      <View style={{ width: TOTALS_COLUMNS[1] }}>
        <Text style={s.totalsValue}>{formatCurrency(rental)}</Text>
      </View>
      <View style={{ width: TOTALS_COLUMNS[2] }}>
        <Text style={s.totalsValue}>{formatCurrency(impression)}</Text>
      </View>
    </View>
  );
}

function discountLabel(discount: PriceDiscount | null): string {
  if (!discount) return "—";
  return `-${formatCurrency(discount.amount)} (${formatDiscountPercent(discount.percent)})`;
}

export function TotalsBlock({
  totals,
  discounts,
}: {
  totals: OfferTotals;
  discounts: OfferDiscountSummary;
}) {
  return (
    <View style={s.totals} wrap={false}>
      <View style={d.tableHeadRow}>
        <View style={[d.th, { width: TOTALS_COLUMNS[0] }]} />
        {["Arrendamiento", "Impresión"].map((heading, index) => (
          <View
            key={heading}
            style={[d.th, { width: TOTALS_COLUMNS[index + 1] }]}
          >
            <Text style={[d.thText, { textAlign: "right" }]}>{heading}</Text>
          </View>
        ))}
      </View>
      {discounts.total ? (
        <View style={s.totalsRow}>
          <View style={{ width: TOTALS_COLUMNS[0] }}>
            <Text style={s.totalsLabel}>DESCUENTO</Text>
          </View>
          <View style={{ width: TOTALS_COLUMNS[1] }}>
            <Text style={[s.totalsValue, s.totalsDiscountValue]}>
              {discountLabel(discounts.rental)}
            </Text>
          </View>
          <View style={{ width: TOTALS_COLUMNS[2] }}>
            <Text style={[s.totalsValue, s.totalsDiscountValue]}>
              {discountLabel(discounts.impression)}
            </Text>
          </View>
        </View>
      ) : null}
      <TotalsRow
        label="SUBTOTAL"
        rental={totals.subtotalRental}
        impression={totals.subtotalImpression}
      />
      <TotalsRow
        label="IVA"
        rental={totals.ivaRental}
        impression={totals.ivaImpression}
      />
      <View style={s.totalsGrandRow}>
        <View style={[s.totalsGrandLabel, { width: TOTALS_COLUMNS[0] }]}>
          <View style={s.totalsGrandDot} />
          <Text style={s.totalsGrandLabelText}>TOTAL</Text>
        </View>
        <View style={{ width: TOTALS_COLUMNS[1] }}>
          <Text style={s.totalsGrandValue}>
            {formatCurrency(totals.totalRental)}
          </Text>
        </View>
        <View style={{ width: TOTALS_COLUMNS[2] }}>
          <Text style={s.totalsGrandValue}>
            {formatCurrency(totals.totalImpression)}
          </Text>
        </View>
      </View>
      <View style={s.totalsPayableRow}>
        <View style={{ width: TOTALS_COLUMNS[0] }}>
          <Text style={s.totalsPayableLabel}>TOTAL A PAGAR</Text>
          <Text style={s.totalsPayableHint}>IVA incluido</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.totalsPayableValue}>
            {formatCurrency(totals.grandTotal)}
          </Text>
        </View>
      </View>
      {discounts.total ? (
        <Text style={s.totalsDiscountNote}>
          Incluye un descuento de {formatCurrency(discounts.total.amount)} (
          {formatDiscountPercent(discounts.total.percent)}) sobre el precio
          recomendado de {formatCurrency(discounts.total.list)}, antes de IVA.
        </Text>
      ) : null}
    </View>
  );
}
