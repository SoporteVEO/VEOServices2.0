// NOTE: This file mirrors apps/web/src/components/pages/rh/absence-pdf-report.tsx.
// Keep both files in sync — the API uses this to generate the email PDF and
// the web app uses the other to generate the download PDF. They must produce
// identical output.

import { Document, Image, Page, View } from '@react-pdf/renderer';
import { Badge } from '../../components/pdfx/badge/pdfx-badge.js';
import { Divider } from '../../components/pdfx/divider/pdfx-divider.js';
import { Heading } from '../../components/pdfx/heading/pdfx-heading.js';
import { KeyValue } from '../../components/pdfx/key-value/pdfx-key-value.js';
import { PageFooter } from '../../components/pdfx/page-footer/pdfx-page-footer.js';
import { PageHeader } from '../../components/pdfx/page-header/pdfx-page-header.js';
import { PdfPageNumber } from '../../components/pdfx/page-number/pdfx-page-number.js';
import { Section } from '../../components/pdfx/section/pdfx-section.js';
import { Stack } from '../../components/pdfx/stack/pdfx-stack.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/pdfx/table/pdfx-table.js';
import { Text } from '../../components/pdfx/text/pdfx-text.js';
import { theme } from '../../lib/pdfx-theme.js';
import { computeAbsenceDays, formatLongDate } from './absence-pdf-utils.js';

export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AbsenceImageInput = {
  id: string;
  url: string;
  createdAt: string;
};

export type AbsenceUserInput = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
};

export type AbsenceInput = {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: AbsenceStatus;
  createdAt: string;
  updatedAt: string;
  images: AbsenceImageInput[];
  user: AbsenceUserInput;
};

type AbsenceImageSrc = string | { data: Buffer; format: 'png' | 'jpg' };

export type AbsencePdfImage = {
  id: string;
  src: AbsenceImageSrc;
  createdAt: string;
};

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

const STATUS_LABELS: Record<AbsenceStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const STATUS_VARIANTS: Record<AbsenceStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

function formatGeneratedAt(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export interface AbsencePdfReportProps {
  absence: AbsenceInput;
  images?: AbsencePdfImage[];
  generatedAt?: Date;
}

export function AbsencePdfReport({
  absence,
  images,
  generatedAt = new Date(),
}: AbsencePdfReportProps) {
  const days = computeAbsenceDays(absence.fromDate, absence.toDate);
  const fullName =
    [absence.user.firstName, absence.user.lastName].filter(Boolean).join(' ') ||
    'Sin nombre';
  const statusLabel = STATUS_LABELS[absence.status];
  const statusVariant = STATUS_VARIANTS[absence.status];

  const resolvedImages: AbsencePdfImage[] =
    images ??
    absence.images.map((img) => ({
      id: img.id,
      src: img.url,
      createdAt: img.createdAt,
    }));

  return (
    <Document
      title={`Reporte de incapacidad - ${fullName}`}
      author="VEO Services"
      subject="Reporte de incapacidad"
      creator="VEO Services"
    >
      <Page
        size={theme.page.size}
        orientation={theme.page.orientation}
        style={{
          paddingTop: theme.spacing.page.marginTop,
          paddingRight: theme.spacing.page.marginRight,
          paddingBottom: theme.spacing.page.marginBottom,
          paddingLeft: theme.spacing.page.marginLeft,
          fontFamily: theme.typography.body.fontFamily,
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.foreground,
        }}
      >
        <PageHeader
          title="Reporte de incapacidad"
          subtitle="VEO Services — Recursos Humanos"
          rightText={`Generado el ${formatGeneratedAt(generatedAt)}`}
          rightSubText={`ID: ${absence.id.slice(0, 8).toUpperCase()}`}
          variant="simple"
        />

        <Section spacing="md">
          <Stack direction="horizontal" align="center" gap="md">
            <Heading level={2} noMargin>
              {fullName}
            </Heading>
            <Badge label={statusLabel} variant={statusVariant} size="md" />
          </Stack>
          <Text variant="sm" color="mutedForeground">
            {absence.user.email}
          </Text>
        </Section>

        <Section spacing="md" variant="card" padding="md" border>
          <Heading level={4} noMargin>
            Resumen de la solicitud
          </Heading>
          <Divider spacing="sm" />
          <KeyValue
            direction="horizontal"
            divided
            size="md"
            items={[
              {
                key: 'Fecha de inicio',
                value: formatLongDate(absence.fromDate),
              },
              {
                key: 'Fecha de fin',
                value: formatLongDate(absence.toDate),
              },
              {
                key: 'Días totales',
                value: `${days} ${days === 1 ? 'día' : 'días'}`,
              },
              {
                key: 'Estado',
                value: statusLabel,
              },
              {
                key: 'Solicitada el',
                value: formatLongDate(absence.createdAt),
              },
              {
                key: 'Última actualización',
                value: formatLongDate(absence.updatedAt),
              },
            ]}
          />
        </Section>

        <Section spacing="md">
          <Heading level={4}>Motivo de la incapacidad</Heading>
          <Section
            variant="callout"
            padding="md"
            accentColor={theme.colors.info}
          >
            <Text>{absence.reason}</Text>
          </Section>
        </Section>

        <Section spacing="md">
          <Heading level={4}>Información del empleado</Heading>
          <Table variant="grid">
            <TableHeader>
              <TableRow>
                <TableCell header>Campo</TableCell>
                <TableCell header>Valor</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Nombre completo</TableCell>
                <TableCell>{fullName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Correo electrónico</TableCell>
                <TableCell>{absence.user.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ID de usuario</TableCell>
                <TableCell>{absence.user.id}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section spacing="md">
          <Heading level={4}>Documentos adjuntos</Heading>
          {resolvedImages.length === 0 ? (
            <Text color="mutedForeground" italic>
              Esta solicitud no incluye documentos adjuntos.
            </Text>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing.componentGap,
              }}
            >
              {resolvedImages.map((image, index) => (
                <View
                  key={image.id}
                  wrap={false}
                  style={{
                    width: '48%',
                    borderWidth: 0.5,
                    borderColor: theme.colors.border,
                    borderStyle: 'solid',
                    borderRadius: theme.primitives.borderRadius.md,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={image.src}
                    style={{
                      width: '100%',
                      height: 220,
                      objectFit: 'contain',
                      backgroundColor: theme.colors.muted,
                    }}
                  />
                  <View
                    style={{
                      paddingVertical: theme.primitives.spacing[1],
                      paddingHorizontal: theme.primitives.spacing[2],
                      borderTopWidth: 0.5,
                      borderTopColor: theme.colors.border,
                      borderTopStyle: 'solid',
                    }}
                  >
                    <Text
                      variant="xs"
                      color="mutedForeground"
                      align="center"
                      noMargin
                    >
                      {`Documento ${index + 1} · ${formatLongDate(image.createdAt)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>

        <View style={{ marginTop: theme.spacing.sectionGap }}>
          <Divider spacing="md" />
          <Text variant="xs" color="mutedForeground" align="center">
            Este documento es un reporte oficial generado automáticamente por el
            sistema de Recursos Humanos de VEO Services.
          </Text>
        </View>

        <PageFooter
          variant="simple"
          leftText="VEO Services — Recursos Humanos"
          centerText="Confidencial"
          rightText=""
          fixed
        />
        <PdfPageNumber
          format="Página {page} de {total}"
          align="right"
          size="xs"
          fixed
        />
      </Page>
    </Document>
  );
}
