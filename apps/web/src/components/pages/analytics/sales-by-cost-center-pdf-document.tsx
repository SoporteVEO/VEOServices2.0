import { Document, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type {
  SalesByCostCenterReport,
  SalesByCostCenterRow,
} from "@/api/analytics/analytics.types";
import { Heading } from "@/components/pdfx/heading/pdfx-heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/pdfx/table/pdfx-table";
import { Text } from "@/components/pdfx/text/pdfx-text";
import { PdfxThemeProvider } from "@/lib/pdfx-theme-context";

const pagePad: Style = { padding: 32 };
const subtotalRowStyle: Style = { backgroundColor: "#f3f4f6" };
const groupTotalRowStyle: Style = { backgroundColor: "#e5e7eb" };

const COL_WIDTHS = {
  customer: "44%",
  total: "13%",
  date: "13%",
  type: "8%",
  doc: "22%",
} as const;

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRangeDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

type SellerGroup = {
  sellerKey: string;
  sellerName: string;
  rows: SalesByCostCenterRow[];
  total: number;
};

type SubCenterGroup = {
  subKey: string;
  subName: string;
  sellers: SellerGroup[];
  total: number;
};

type CostCenterGroup = {
  costCenterKey: string;
  costCenterName: string;
  subs: SubCenterGroup[];
  total: number;
};

function buildGroups(rows: SalesByCostCenterRow[]): CostCenterGroup[] {
  const ccMap = new Map<string, CostCenterGroup>();

  for (const row of rows) {
    const ccKey = String(row.costCenterId ?? row.costCenterName);
    let cc = ccMap.get(ccKey);
    if (!cc) {
      cc = {
        costCenterKey: ccKey,
        costCenterName: row.costCenterName,
        subs: [],
        total: 0,
      };
      ccMap.set(ccKey, cc);
    }

    const subKey = `${ccKey}:${row.subCostCenterId ?? row.subCostCenterName ?? "none"}`;
    let sub = cc.subs.find((s) => s.subKey === subKey);
    if (!sub) {
      sub = {
        subKey,
        subName: row.subCostCenterName ?? "Sin sub centro de costo",
        sellers: [],
        total: 0,
      };
      cc.subs.push(sub);
    }

    const sellerKey = `${subKey}:${row.sellerId ?? row.sellerName}`;
    let seller = sub.sellers.find((s) => s.sellerKey === sellerKey);
    if (!seller) {
      seller = {
        sellerKey,
        sellerName: row.sellerName,
        rows: [],
        total: 0,
      };
      sub.sellers.push(seller);
    }

    seller.rows.push(row);
    seller.total += row.total;
    sub.total += row.total;
    cc.total += row.total;
  }

  return Array.from(ccMap.values());
}

function HeaderRow() {
  return (
    <TableRow header variant="compact">
      <TableCell header width={COL_WIDTHS.customer}>
        Cliente
      </TableCell>
      <TableCell header width={COL_WIDTHS.total} align="right">
        Total
      </TableCell>
      <TableCell header width={COL_WIDTHS.date}>
        Fecha
      </TableCell>
      <TableCell header width={COL_WIDTHS.type}>
        Tipo
      </TableCell>
      <TableCell header width={COL_WIDTHS.doc}>
        Num. Documento
      </TableCell>
    </TableRow>
  );
}

function GroupBanner({
  subName,
  sellerName,
}: {
  subName: string;
  sellerName: string;
}) {
  return (
    <View
      wrap={false}
      style={{
        flexDirection: "row",
        backgroundColor: "#dbeafe",
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginTop: 6,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="xs" weight="semibold" noMargin>
          Sub Centro de Costo: {subName}
        </Text>
        <Text variant="xs" color="mutedForeground" noMargin>
          Vendedor: {sellerName}
        </Text>
      </View>
    </View>
  );
}

export function SalesByCostCenterPdfDocument({
  report,
}: {
  report: SalesByCostCenterReport;
}) {
  const groups = buildGroups(report.rows);
  const grandTotal = report.total;

  return (
    <PdfxThemeProvider>
      <Document>
        <Page size="A4" style={pagePad}>
          <View>
            <Heading level={2} noMargin>
              Ventas por Centro de Costo por Vendedor
            </Heading>
            <Text variant="sm" color="mutedForeground" noMargin>
              Desde: {formatRangeDate(report.range.from)} — Hasta:{" "}
              {formatRangeDate(report.range.to)}
            </Text>
            <Text variant="sm" color="mutedForeground">
              Total facturas: {report.rows.length} · Total general:{" "}
              {formatCurrency(grandTotal)}
            </Text>
          </View>

          {groups.map((cc) => (
            <View key={cc.costCenterKey}>
              <View
                wrap={false}
                style={{
                  backgroundColor: "#1e3a8a",
                  paddingVertical: 5,
                  paddingHorizontal: 6,
                  marginTop: 8,
                  marginBottom: 4,
                }}
              >
                <Text variant="sm" weight="bold" color="#ffffff" noMargin>
                  Centro de Costo: {cc.costCenterName}
                </Text>
              </View>

              {cc.subs.map((sub) =>
                sub.sellers.map((seller) => (
                  <View key={seller.sellerKey}>
                    <GroupBanner
                      subName={sub.subName}
                      sellerName={seller.sellerName}
                    />

                    <Table variant="compact" zebraStripe>
                      <TableHeader>
                        <HeaderRow />
                      </TableHeader>
                      <TableBody>
                        {seller.rows.map((row) => (
                          <TableRow
                            key={`${row.invoiceId}-${row.guid}`}
                            variant="compact"
                          >
                            <TableCell width={COL_WIDTHS.customer}>
                              {row.customerName}
                            </TableCell>
                            <TableCell
                              width={COL_WIDTHS.total}
                              align="right"
                              style={
                                row.total < 0
                                  ? { color: "#b91c1c" }
                                  : undefined
                              }
                            >
                              {formatCurrency(row.total)}
                            </TableCell>
                            <TableCell width={COL_WIDTHS.date}>
                              {formatDate(row.date)}
                            </TableCell>
                            <TableCell width={COL_WIDTHS.type}>
                              {row.documentType}
                            </TableCell>
                            <TableCell width={COL_WIDTHS.doc}>
                              {row.guid || row.documentNumber || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow variant="compact" style={subtotalRowStyle}>
                          <TableCell width={COL_WIDTHS.customer}>
                            <Text variant="xs" weight="semibold" noMargin>
                              Total para el Vendedor {seller.sellerName}:
                            </Text>
                          </TableCell>
                          <TableCell width={COL_WIDTHS.total} align="right">
                            <Text variant="xs" weight="bold" noMargin>
                              {formatCurrency(seller.total)}
                            </Text>
                          </TableCell>
                          <TableCell width={COL_WIDTHS.date}> </TableCell>
                          <TableCell width={COL_WIDTHS.type}> </TableCell>
                          <TableCell width={COL_WIDTHS.doc}> </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </View>
                )),
              )}

              {cc.subs.map((sub) => (
                <View
                  key={`${cc.costCenterKey}-${sub.subKey}-total`}
                  wrap={false}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 3,
                    paddingHorizontal: 6,
                    marginTop: 2,
                    ...groupTotalRowStyle,
                  }}
                >
                  <Text variant="xs" weight="semibold" noMargin>
                    Total para el Sub Centro de Costo {sub.subName}:
                  </Text>
                  <Text variant="xs" weight="bold" noMargin>
                    {formatCurrency(sub.total)}
                  </Text>
                </View>
              ))}

              <View
                wrap={false}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: "#bfdbfe",
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  marginTop: 4,
                }}
              >
                <Text variant="sm" weight="bold" noMargin>
                  Total para el Centro de Costo {cc.costCenterName}:
                </Text>
                <Text variant="sm" weight="bold" noMargin>
                  {formatCurrency(cc.total)}
                </Text>
              </View>
            </View>
          ))}

          <View
            wrap={false}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "#1e3a8a",
              paddingVertical: 6,
              paddingHorizontal: 6,
              marginTop: 12,
            }}
          >
            <Text variant="sm" weight="bold" color="#ffffff" noMargin>
              Totales Generales:
            </Text>
            <Text variant="sm" weight="bold" color="#ffffff" noMargin>
              {formatCurrency(grandTotal)}
            </Text>
          </View>
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}
