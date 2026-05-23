import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
import type { SalesByCostCenterReport } from "@/api/analytics/analytics.types";
import { PdfGraph } from "@/components/pdfx/graph/pdfx-graph";
import { PageFooter } from "@/components/pdfx/page-footer/pdfx-page-footer";
import { PageHeader } from "@/components/pdfx/page-header/pdfx-page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/pdfx/table/pdfx-table";
import { Text } from "@/components/pdfx/text/pdfx-text";
import { PdfxThemeProvider } from "@/lib/pdfx-theme-context";
import { theme } from "@/lib/pdfx-theme";
import {
  EXECUTIVE_CHART_COLORS,
  type SalesAggregate,
  aggregateSalesBy,
  daysInRange,
  formatCompactMoney,
  formatFullMoney,
  formatRangeLabel,
} from "./sales-by-cost-center-aggregates";

const PAGE_WIDTH = 595;
const PAGE_MARGIN_X = theme.spacing.page.marginLeft;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;

const pageStyle = {
  paddingTop: theme.spacing.page.marginTop,
  paddingRight: theme.spacing.page.marginRight,
  paddingBottom: theme.spacing.page.marginBottom,
  paddingLeft: theme.spacing.page.marginLeft,
  fontFamily: theme.typography.body.fontFamily,
  fontSize: theme.typography.body.fontSize,
  color: theme.colors.foreground,
  backgroundColor: theme.colors.background,
};

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.border,
    borderRadius: theme.primitives.borderRadius.lg,
    padding: 18,
    backgroundColor: theme.colors.muted,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: theme.colors.mutedForeground,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: theme.primitives.fontWeights.bold,
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  heroMeta: {
    fontSize: 10,
    color: theme.colors.mutedForeground,
  },
  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    width: (CONTENT_WIDTH - 30) / 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.border,
    borderRadius: theme.primitives.borderRadius.md,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: theme.colors.mutedForeground,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: theme.primitives.fontWeights.bold,
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  kpiSubValue: {
    fontSize: 8,
    color: theme.colors.mutedForeground,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: theme.primitives.fontWeights.semibold,
    color: theme.colors.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: theme.colors.mutedForeground,
    marginBottom: 8,
  },
  donutShell: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.border,
    borderRadius: theme.primitives.borderRadius.md,
    padding: 12,
    marginBottom: 18,
  },
  donutRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  donutChartCol: {
    width: 200,
  },
  donutLegendCol: {
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: theme.colors.border,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 9,
    color: theme.colors.foreground,
  },
  legendValue: {
    fontSize: 9,
    fontWeight: theme.primitives.fontWeights.semibold,
    color: theme.colors.foreground,
    marginRight: 8,
  },
  legendPct: {
    fontSize: 9,
    color: theme.colors.mutedForeground,
    width: 36,
    textAlign: "right",
  },
  rankingBlock: {
    marginBottom: 16,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rankingIndex: {
    width: 14,
    fontSize: 9,
    color: theme.colors.mutedForeground,
  },
  rankingMain: {
    flex: 1,
  },
  rankingLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  rankingLabel: {
    fontSize: 9.5,
    color: theme.colors.foreground,
    flex: 1,
    marginRight: 6,
  },
  rankingAmount: {
    fontSize: 9.5,
    fontWeight: theme.primitives.fontWeights.semibold,
    color: theme.colors.foreground,
  },
  rankingBarTrack: {
    height: 5,
    backgroundColor: theme.colors.muted,
    borderRadius: 2,
    overflow: "hidden",
  },
  rankingBarFill: {
    height: 5,
    borderRadius: 2,
  },
  rankingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
  },
  rankingMeta: {
    fontSize: 7.5,
    color: theme.colors.mutedForeground,
  },
  rankingPct: {
    fontSize: 7.5,
    color: theme.colors.mutedForeground,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 14,
  },
  column: {
    flex: 1,
  },
  insightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  insightCard: {
    width: (CONTENT_WIDTH - 16) / 3,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.border,
    borderRadius: theme.primitives.borderRadius.md,
    padding: 10,
  },
  insightLabel: {
    fontSize: 7.5,
    textTransform: "uppercase",
    color: theme.colors.mutedForeground,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 11,
    fontWeight: theme.primitives.fontWeights.semibold,
    color: theme.colors.foreground,
    marginBottom: 1,
  },
  insightSub: {
    fontSize: 8,
    color: theme.colors.mutedForeground,
  },
});

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel} noMargin>
        {label}
      </Text>
      <Text style={styles.kpiValue} noMargin>
        {value}
      </Text>
      {sub ? (
        <Text style={styles.kpiSubValue} noMargin>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function InsightCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightLabel} noMargin>
        {label}
      </Text>
      <Text style={styles.insightValue} noMargin>
        {value}
      </Text>
      <Text style={styles.insightSub} noMargin>
        {sub}
      </Text>
    </View>
  );
}

function RankingList({
  title,
  description,
  items,
  total,
  maxItems = 8,
  showInvoices = true,
}: {
  title: string;
  description?: string;
  items: SalesAggregate[];
  total: number;
  maxItems?: number;
  showInvoices?: boolean;
}) {
  const visible = items.slice(0, maxItems);
  const palette = EXECUTIVE_CHART_COLORS;
  const maxAbs = Math.max(...visible.map((i) => Math.abs(i.total)), 1);

  return (
    <View style={styles.rankingBlock} wrap={false}>
      <Text style={styles.sectionTitle} noMargin>
        {title}
      </Text>
      {description ? (
        <Text style={styles.sectionSubtitle} noMargin>
          {description}
        </Text>
      ) : null}
      {visible.length === 0 ? (
        <Text variant="sm" color="mutedForeground">
          Sin datos.
        </Text>
      ) : (
        visible.map((item, idx) => {
          const widthPct =
            Math.round((Math.abs(item.total) / maxAbs) * 1000) / 10;
          const sharePct =
            total !== 0
              ? Math.round((item.total / total) * 1000) / 10
              : 0;
          const color = palette[idx % palette.length];
          return (
            <View key={item.key} style={styles.rankingRow}>
              <Text style={styles.rankingIndex} noMargin>
                {idx + 1}.
              </Text>
              <View style={styles.rankingMain}>
                <View style={styles.rankingLabelRow}>
                  <Text style={styles.rankingLabel} noMargin>
                    {item.label}
                  </Text>
                  <Text style={styles.rankingAmount} noMargin>
                    {formatCompactMoney(item.total)}
                  </Text>
                </View>
                <View style={styles.rankingBarTrack}>
                  <View
                    style={[
                      styles.rankingBarFill,
                      {
                        width: `${Math.max(2, Math.min(100, widthPct))}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.rankingFooter}>
                  <Text style={styles.rankingMeta} noMargin>
                    {showInvoices
                      ? `${item.uniqueInvoices} factura${item.uniqueInvoices === 1 ? "" : "s"} · ${item.uniqueCustomers} cliente${item.uniqueCustomers === 1 ? "" : "s"}`
                      : `${item.count} línea${item.count === 1 ? "" : "s"}`}
                  </Text>
                  <Text style={styles.rankingPct} noMargin>
                    {sharePct.toFixed(1)}% del total
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function DonutBreakdown({
  items,
  total,
  centerLabel,
}: {
  items: SalesAggregate[];
  total: number;
  centerLabel: string;
}) {
  const top = items.slice(0, 7);
  const rest = items.slice(7);
  const othersTotal = rest.reduce((sum, i) => sum + Math.abs(i.total), 0);
  const series = top.map((i) => ({
    label: i.label,
    value: Math.abs(i.total),
  }));
  if (othersTotal > 0) series.push({ label: "Otros", value: othersTotal });
  const palette = EXECUTIVE_CHART_COLORS;

  return (
    <View style={styles.donutShell} wrap={false}>
      <View style={styles.donutRow}>
        <View style={styles.donutChartCol}>
          <PdfGraph
            variant="donut"
            data={series}
            centerLabel={centerLabel}
            height={200}
            width={200}
            colors={[...palette]}
            legend="none"
          />
        </View>
        <View style={styles.donutLegendCol}>
          {series.map((s, idx) => {
            const pct =
              total !== 0
                ? Math.round((s.value / Math.abs(total)) * 1000) / 10
                : 0;
            return (
              <View key={s.label} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: palette[idx % palette.length] },
                  ]}
                />
                <Text style={styles.legendLabel} noMargin>
                  {s.label}
                </Text>
                <Text style={styles.legendValue} noMargin>
                  {formatCompactMoney(s.value)}
                </Text>
                <Text style={styles.legendPct} noMargin>
                  {pct.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

type CustomerRow = {
  key: string;
  label: string;
  total: number;
  invoices: number;
};

function topCustomers(
  rows: SalesByCostCenterReport["rows"],
  limit: number,
): CustomerRow[] {
  const map = new Map<
    string,
    { label: string; total: number; invoiceIds: Set<number> }
  >();
  for (const row of rows) {
    const key = String(row.customerId ?? row.customerName);
    const existing = map.get(key);
    if (existing) {
      existing.total += row.total;
      existing.invoiceIds.add(row.invoiceId);
    } else {
      map.set(key, {
        label: row.customerName,
        total: row.total,
        invoiceIds: new Set([row.invoiceId]),
      });
    }
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: v.label,
      total: v.total,
      invoices: v.invoiceIds.size,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function SalesByCostCenterExecutivePdfDocument({
  report,
  filterLabel,
}: {
  report: SalesByCostCenterReport;
  filterLabel?: string | null;
}) {
  const rows = report.rows;
  const total = report.total;
  const uniqueInvoices = new Set(rows.map((r) => r.invoiceId)).size;
  const uniqueCustomers = new Set(rows.map((r) => r.customerName)).size;

  const byCostCenter = aggregateSalesBy(rows, (r) => ({
    key: r.costCenterId ?? r.costCenterName,
    label: r.costCenterName,
  }));
  const bySubCenter = aggregateSalesBy(rows, (r) => ({
    key: r.subCostCenterId ?? r.subCostCenterName,
    label: r.subCostCenterName ?? "Sin sub centro",
  }));
  const byTipoVenta = aggregateSalesBy(rows, (r) => ({
    key: r.tipoVentaId ?? r.tipoVentaName,
    label: r.tipoVentaName,
  }));
  const bySeller = aggregateSalesBy(rows, (r) => ({
    key: r.sellerId ?? r.sellerName,
    label: r.sellerName,
  }));

  const days = daysInRange(report.range.from, report.range.to);
  const avgPerInvoice = uniqueInvoices > 0 ? total / uniqueInvoices : 0;
  const avgPerDay = days > 0 ? total / days : 0;
  const avgPerCustomer = uniqueCustomers > 0 ? total / uniqueCustomers : 0;

  const topCenter = byCostCenter[0];
  const topTipo = byTipoVenta[0];
  const topSeller = bySeller[0];

  const centerShare =
    topCenter && total !== 0
      ? Math.round((topCenter.total / total) * 100)
      : 0;
  const tipoShare =
    topTipo && total !== 0 ? Math.round((topTipo.total / total) * 100) : 0;
  const sellerShare =
    topSeller && total !== 0
      ? Math.round((topSeller.total / total) * 100)
      : 0;

  const top10Customers = topCustomers(rows, 10);
  const periodLabel = formatRangeLabel(report.range.from, report.range.to);
  const filterSubtitle = filterLabel
    ? `Filtro: ${filterLabel}`
    : "Todos los centros de costos";

  const generatedAt = new Date().toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <PdfxThemeProvider theme={theme}>
      <Document
        title={`Resumen ejecutivo de facturación ${periodLabel}`}
        author="VEO Services"
      >
        <Page size="A4" style={pageStyle}>
          <PageHeader
            variant="two-column"
            title="Resumen ejecutivo de facturación"
            subtitle={filterSubtitle}
            rightText={periodLabel}
            rightSubText={`Generado el ${generatedAt}`}
            marginBottom={14}
          />

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel} noMargin>
              Total facturado del período
            </Text>
            <Text style={styles.heroValue} noMargin>
              {formatFullMoney(total)}
            </Text>
            <Text style={styles.heroMeta} noMargin>
              {uniqueInvoices.toLocaleString("en-US")} facturas ·{" "}
              {uniqueCustomers.toLocaleString("en-US")} clientes ·{" "}
              {bySeller.length} vendedores · {days} día
              {days === 1 ? "" : "s"} en el rango
            </Text>
          </View>

          <View style={styles.kpiRow}>
            <KpiCard
              label="Promedio por factura"
              value={formatCompactMoney(avgPerInvoice)}
              sub={`${uniqueInvoices} facturas`}
            />
            <KpiCard
              label="Promedio diario"
              value={formatCompactMoney(avgPerDay)}
              sub={`${days} día${days === 1 ? "" : "s"}`}
            />
            <KpiCard
              label="Ticket por cliente"
              value={formatCompactMoney(avgPerCustomer)}
              sub={`${uniqueCustomers} clientes`}
            />
            <KpiCard
              label="Centros activos"
              value={String(byCostCenter.length)}
              sub={`${bySubCenter.length} sub centros`}
            />
          </View>

          <View style={styles.insightsRow}>
            <InsightCard
              label="Centro líder"
              value={topCenter ? topCenter.label : "—"}
              sub={
                topCenter
                  ? `${formatCompactMoney(topCenter.total)} · ${centerShare}% del total`
                  : "Sin datos"
              }
            />
            <InsightCard
              label="Tipo de venta líder"
              value={topTipo ? topTipo.label : "—"}
              sub={
                topTipo
                  ? `${formatCompactMoney(topTipo.total)} · ${tipoShare}% del total`
                  : "Sin datos"
              }
            />
            <InsightCard
              label="Vendedor líder"
              value={topSeller ? topSeller.label : "—"}
              sub={
                topSeller
                  ? `${formatCompactMoney(topSeller.total)} · ${sellerShare}% del total`
                  : "Sin datos"
              }
            />
          </View>

          <Text style={styles.sectionTitle} noMargin>
            Distribución por centro de costos
          </Text>
          <Text style={styles.sectionSubtitle} noMargin>
            Participación de cada centro en el monto facturado del período.
          </Text>
          <DonutBreakdown
            items={byCostCenter}
            total={total}
            centerLabel={formatCompactMoney(total)}
          />

          <PageFooter
            variant="three-column"
            leftText="Confidencial · Uso interno"
            centerText="VEO Services"
            rightText="Pág. 1"
            sticky
            pagePadding={theme.spacing.page.marginLeft}
          />
        </Page>

        <Page size="A4" style={pageStyle}>
          <PageHeader
            variant="two-column"
            title="Detalle por categoría"
            subtitle={filterSubtitle}
            rightText={periodLabel}
            marginBottom={14}
          />

          <RankingList
            title="Por tipo de venta"
            description="Ranking ordenado por monto facturado con IVA e impuestos."
            items={byTipoVenta}
            total={total}
            maxItems={8}
          />

          <RankingList
            title="Por sub centro de costos"
            description="Sub centros con mayor aporte al período."
            items={bySubCenter}
            total={total}
            maxItems={8}
          />

          <PageFooter
            variant="three-column"
            leftText="Confidencial · Uso interno"
            centerText="VEO Services"
            rightText="Pág. 2"
            sticky
            pagePadding={theme.spacing.page.marginLeft}
          />
        </Page>

        <Page size="A4" style={pageStyle}>
          <PageHeader
            variant="two-column"
            title="Vendedores y clientes"
            subtitle={filterSubtitle}
            rightText={periodLabel}
            marginBottom={14}
          />

          <RankingList
            title="Top vendedores"
            description="Vendedores con mayor monto facturado en el período."
            items={bySeller}
            total={total}
            maxItems={8}
          />

          <View style={{ marginTop: 4 }}>
            <Text style={styles.sectionTitle} noMargin>
              Top 10 clientes
            </Text>
            <Text style={styles.sectionSubtitle} noMargin>
              Clientes con mayor monto facturado en el período seleccionado.
            </Text>
            <Table variant="line" zebraStripe>
              <TableHeader>
                <TableRow header>
                  <TableCell header width="6%">
                    #
                  </TableCell>
                  <TableCell header width="54%">
                    Cliente
                  </TableCell>
                  <TableCell header width="14%" align="right">
                    Facturas
                  </TableCell>
                  <TableCell header width="26%" align="right">
                    Monto
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top10Customers.length === 0 ? (
                  <TableRow>
                    <TableCell width="100%">Sin datos.</TableCell>
                  </TableRow>
                ) : (
                  top10Customers.map((c, idx) => (
                    <TableRow key={c.key}>
                      <TableCell width="6%">{String(idx + 1)}</TableCell>
                      <TableCell width="54%">{c.label}</TableCell>
                      <TableCell width="14%" align="right">
                        {c.invoices.toString()}
                      </TableCell>
                      <TableCell width="26%" align="right">
                        {formatCompactMoney(c.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </View>

          <PageFooter
            variant="three-column"
            leftText="Confidencial · Uso interno"
            centerText="VEO Services"
            rightText="Pág. 3"
            sticky
            pagePadding={theme.spacing.page.marginLeft}
          />
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}
