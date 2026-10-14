import { Document, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { PantallasBoard } from "@/api/pantallas/pantallas.types";
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
import { describeReportRow, type ReportBlock } from "./order-report-logic";
import { formatCount, formatIso, formatMoney, formatMoneyRange } from "./pantallas-format";

const pageStyle: Style = { padding: 28 };
const muted = "#6b7280";

const COLUMNS = [
  { title: "Fecha de ingreso", width: "10%" },
  { title: "Cliente", width: "20%" },
  { title: "Inicio", width: "8%" },
  { title: "Fin", width: "11%" },
  { title: "Estado", width: "12%" },
  { title: "Pantallas y frecuencia", width: "22%" },
  { title: "Valores", width: "17%" },
];

function Small({ children, color = muted }: { children: React.ReactNode; color?: string }) {
  return (
    <Text variant="xs" color={color} noMargin>
      {children}
    </Text>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="xs" weight="semibold" noMargin>
      {children}
    </Text>
  );
}

export function OrderReportPdfDocument({
  board,
  blocks,
  periodLabel,
  includeLabel,
}: {
  board: PantallasBoard;
  blocks: ReportBlock[];
  periodLabel: string;
  includeLabel: string;
}) {
  const visible = blocks.filter((b) => b.rows.length);
  const total = visible.reduce((sum, b) => sum + b.rows.length, 0);

  return (
    <PdfxThemeProvider>
      <Document>
        <Page size="A4" orientation="landscape" style={pageStyle}>
          <View>
            <Heading level={2}>Reporte OP · Pantallas</Heading>
            <Text variant="sm" color={muted} noMargin>
              Periodo: {periodLabel} · Incluye: {includeLabel} · {total}{" "}
              {total === 1 ? "cliente" : "clientes"}
            </Text>
            <Text variant="xs" color={muted}>
              Generado el {new Date().toLocaleString("es-SV")}
            </Text>
          </View>
          {visible.map((block) => (
            <View key={block.key} style={{ marginTop: 10 }}>
              <Heading level={4}>
                {block.title} · {block.rows.length}
              </Heading>
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
                  {block.rows.map((row) => {
                    const view = describeReportRow(row, board, formatIso);
                    return (
                      <TableRow key={`${block.key}-${row.key}`} variant="compact">
                        <TableCell width={COLUMNS[0].width}>
                          <View>
                            {view.date ? (
                              <>
                                <Strong>{view.date}</Strong>
                                <Small>{view.time}</Small>
                              </>
                            ) : (
                              <Small>antes del historial</Small>
                            )}
                          </View>
                        </TableCell>
                        <TableCell width={COLUMNS[1].width}>
                          <View>
                            <Strong>{row.client}</Strong>
                            {view.campaign ? <Small>{view.campaign}</Small> : null}
                            {view.deal ? <Small>{view.deal}</Small> : null}
                          </View>
                        </TableCell>
                        <TableCell width={COLUMNS[2].width}>{formatIso(row.startDate)}</TableCell>
                        <TableCell width={COLUMNS[3].width}>
                          <View>
                            <Strong>{formatIso(row.endDate)}</Strong>
                            {view.daysText ? <Small>{view.daysText}</Small> : null}
                          </View>
                        </TableCell>
                        <TableCell width={COLUMNS[4].width}>
                          <View>
                            <Strong>{view.state}</Strong>
                            {view.movedLabel ? <Small>{view.movedLabel}</Small> : null}
                            {view.previous ? <Small>{view.previous}</Small> : null}
                          </View>
                        </TableCell>
                        <TableCell width={COLUMNS[5].width}>
                          <View>
                            {view.locations.length ? (
                              view.locations.map((l, i) => (
                                <Small key={i} color={l.paused ? "#7c3aed" : "#111827"}>
                                  {l.screen} · {formatCount(l.spotsPerDay)}
                                  {l.paused ? " (pausa)" : ""}
                                </Small>
                              ))
                            ) : (
                              <Small>ya no está al aire</Small>
                            )}
                          </View>
                        </TableCell>
                        <TableCell width={COLUMNS[6].width}>
                          <View>
                            {view.values.total === null ? (
                              <Small>—</Small>
                            ) : (
                              <>
                                <Strong>{formatMoney(view.values.total)}</Strong>
                                <Small>
                                  mes {formatMoneyRange(view.values.monthlyMin, view.values.monthlyMax)}
                                </Small>
                                <Small>
                                  spot {formatMoneyRange(view.values.spotMin, view.values.spotMax, true)}
                                </Small>
                                {view.values.missing ? (
                                  <Small>
                                    {view.values.missing}{" "}
                                    {view.values.missing === 1 ? "pantalla" : "pantallas"} sin valor
                                  </Small>
                                ) : null}
                              </>
                            )}
                          </View>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </View>
          ))}
        </Page>
      </Document>
    </PdfxThemeProvider>
  );
}
