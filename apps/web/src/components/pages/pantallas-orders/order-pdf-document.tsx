import { Document, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { DigitalOrder } from "@/api/pantallas/pantallas.types";
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
import { ART_FORMAT_LABELS, DEAL_SHORT_LABELS } from "../pantallas/pantallas-const";
import {
  formatCount,
  formatIso,
  formatMoney,
  formatSpotMoney,
} from "../pantallas/pantallas-format";
import { agencyLabel, orderLabel, orderTotals } from "./pantallas-orders-logic";

const pageStyle: Style = { padding: 32 };
const muted = "#6b7280";

const COLUMNS = [
  { title: "Pantalla", width: "28%" },
  { title: "Spots/día", width: "12%" },
  { title: "Spots vigencia", width: "16%" },
  { title: "Valor", width: "16%" },
  { title: "Costo x spot", width: "14%" },
  { title: "Modalidad", width: "14%" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "33%", marginBottom: 8 }}>
      <Text variant="xs" color={muted} noMargin>
        {label}
      </Text>
      <Text variant="sm" weight="semibold" noMargin>
        {value}
      </Text>
    </View>
  );
}

export function OrderPdfDocument({ order }: { order: DigitalOrder }) {
  const { days, spots } = orderTotals(order);

  return (
    <PdfxThemeProvider>
      <Document>
        <Page size="A4" style={pageStyle}>
          <Heading level={2}>{orderLabel(order)}</Heading>
          <Text variant="sm" color={muted}>
            Orden de pauta DOOH
            {order.revision > 1 ? ` · corrección ${order.revision}` : ""} · generada el{" "}
            {new Date().toLocaleString("es-SV")}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            <Field label="Marca" value={order.client} />
            <Field label="Campaña" value={order.campaign || "—"} />
            <Field label="Formato de arte" value={ART_FORMAT_LABELS[order.artFormat]} />
            <Field
              label="Vigencia"
              value={`${formatIso(order.startDate)} a ${formatIso(order.endDate)} · ${days} días`}
            />
            <Field label="Ejecutivo/a" value={order.executive} />
            <Field label="Agencia" value={agencyLabel(order)} />
            <Field label="Fecha de ingreso" value={formatIso(order.entryDate)} />
          </View>

          <Table variant="compact" zebraStripe>
            <TableHeader>
              <TableRow header variant="compact">
                {COLUMNS.map((c) => (
                  <TableCell key={c.title} header width={c.width}>
                    {c.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.screens.map((screen) => (
                <TableRow key={screen.screenName} variant="compact">
                  <TableCell width={COLUMNS[0].width}>{screen.screenName}</TableCell>
                  <TableCell width={COLUMNS[1].width}>{formatCount(screen.spotsPerDay)}</TableCell>
                  <TableCell width={COLUMNS[2].width}>
                    {formatCount(screen.spotsPerDay * days)}
                  </TableCell>
                  <TableCell width={COLUMNS[3].width}>{formatMoney(screen.monthlyValue)}</TableCell>
                  <TableCell width={COLUMNS[4].width}>{formatSpotMoney(screen.spotValue)}</TableCell>
                  <TableCell width={COLUMNS[5].width}>{DEAL_SHORT_LABELS[screen.deal]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <View style={{ marginTop: 10 }}>
            <Text variant="sm" noMargin>
              Spots en la vigencia: {formatCount(spots)}
            </Text>
            <Text variant="sm" noMargin>
              Valor total: {formatMoney(order.totalValue)}
            </Text>
            <Text variant="sm" weight="semibold" noMargin>
              Valor mensual: {formatMoney(order.monthlyValue)}
            </Text>
          </View>

          {order.links.length ? (
            <View style={{ marginTop: 10 }}>
              <Text variant="xs" color={muted} noMargin>
                Enlaces de descarga
              </Text>
              {order.links.map((link, index) => (
                <Text key={link} variant="xs" noMargin>
                  Arte {index + 1}: {link}
                </Text>
              ))}
            </View>
          ) : null}

          {order.instructions ? (
            <View style={{ marginTop: 10 }}>
              <Text variant="xs" color={muted} noMargin>
                Indicaciones especiales
              </Text>
              <Text variant="sm" noMargin>
                {order.instructions}
              </Text>
            </View>
          ) : null}
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}
