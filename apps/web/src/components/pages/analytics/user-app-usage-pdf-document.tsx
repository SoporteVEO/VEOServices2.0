import { Document, Page, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { Heading } from "@/components/pdfx/heading/pdfx-heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/pdfx/table/pdfx-table";
import { Text } from "@/components/pdfx/text/pdfx-text";
import type { UserAppUsageReport } from "@/api/analytics/analytics.types";
import { PdfxThemeProvider } from "@/lib/pdfx-theme-context";

const pagePad: Style = { padding: 36 };

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function userLabel(u: UserAppUsageReport["users"][number]): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email;
}

export function UserAppUsagePdfDocument({
  report,
}: {
  report: UserAppUsageReport;
}) {
  const totalMs = report.users.reduce((s, u) => s + u.totalMs, 0);
  const uniqueUsers = report.users.length;
  const dailyChunks =
    report.daily.length === 0 ? [[]] : chunk(report.daily, 32);
  const userChunks =
    report.users.length === 0 ? [] : chunk(report.users, 24);

  return (
    <PdfxThemeProvider>
      <Document>
        {dailyChunks.map((days, idx) => (
          <Page key={`daily-${idx}`} size="A4" style={pagePad}>
            {idx === 0 ? (
              <View>
                <Heading level={1}>Reporte: uso de la aplicación</Heading>
                <Text variant="sm" color="mutedForeground" noMargin>
                  Período: {report.range.from} — {report.range.to}
                </Text>
                <Text variant="sm" color="mutedForeground">
                  Usuarios con actividad: {uniqueUsers} · Tiempo activo total:{" "}
                  {formatMs(totalMs)}
                </Text>
              </View>
            ) : null}
            <Heading level={3} noMargin={idx > 0}>
              Actividad por día
              {dailyChunks.length > 1
                ? ` (${idx + 1}/${dailyChunks.length})`
                : ""}
            </Heading>
            <Table variant="compact" zebraStripe>
              <TableHeader>
                <TableRow header variant="compact">
                  <TableCell header width="28%">
                    Fecha
                  </TableCell>
                  <TableCell header width="22%">
                    Usuarios
                  </TableCell>
                  <TableCell header width="50%">
                    Tiempo total
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((d) => (
                  <TableRow key={d.date} variant="compact">
                    <TableCell width="28%">{d.date}</TableCell>
                    <TableCell width="22%">{String(d.activeUserCount)}</TableCell>
                    <TableCell width="50%">{formatMs(d.totalMs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Page>
        ))}

        {userChunks.map((rows, pageIdx) => (
          <Page key={`users-${pageIdx}`} size="A4" style={pagePad}>
            <Heading level={3}>
              Detalle por usuario ({pageIdx + 1}/{userChunks.length})
            </Heading>
            <Table variant="compact" zebraStripe>
              <TableHeader>
                <TableRow header variant="compact">
                  <TableCell header width="26%">
                    Usuario
                  </TableCell>
                  <TableCell header width="34%">
                    Correo
                  </TableCell>
                  <TableCell header width="12%">
                    Rol
                  </TableCell>
                  <TableCell header width="10%">
                    Días
                  </TableCell>
                  <TableCell header width="18%">
                    Total
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.userId} variant="compact">
                    <TableCell width="26%">{userLabel(u)}</TableCell>
                    <TableCell width="34%">{u.email}</TableCell>
                    <TableCell width="12%">{u.role}</TableCell>
                    <TableCell width="10%">{String(u.activeDays)}</TableCell>
                    <TableCell width="18%">{formatMs(u.totalMs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Page>
        ))}
      </Document>
    </PdfxThemeProvider>
  );
}
