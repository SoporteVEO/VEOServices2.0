import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import { EmailService } from '../email/email.service.js';
import { NotificationStatus, S3ImageType } from '@prisma/client';
import type { EndingSoonContract } from './entities/ending-soon-contract.js';
import type {
  ActiveContractImage,
  ActiveContractWithImages,
} from './entities/active-contract-with-images.js';
import type { CreateNotifiedContractDto } from './dto/create-notified-contract.dto.js';
import type { SendMaintenanceReportDto } from './dto/send-maintenance-report.dto.js';

interface SourceContractRow {
  mconId: number;
  dconId: number;
  mconAtencionA: string;
  dconFechaDesde: Date;
  dconFechaHasta: Date;
  mconCodigo: string;
  sitiDireccion: string;
  cliNombres: string;
  cliEmail: string;
}

interface ActiveContractRow extends SourceContractRow {
  caraCodigo: string;
  sitiGPSLat: number | null;
  sitiGPSLon: number | null;
}

const ENDING_SOON_CONTRACTS_SQL = `
SELECT DISTINCT
    maecon.mconId,
    detcon.dconId,
    maecon.mconAtencionA,
    detcon.dconFechaHasta,
    detcon.dconFechaDesde,
    maecon.mconCodigo,
    siti.sitiDireccion,
    cli.cliNombres,
    cli.cliEmail
FROM olVallas.dbo.maeContratos maecon
INNER JOIN olVallas.dbo.detContratos detcon
    ON detcon.mconId = maecon.mconId
INNER JOIN olVallas.dbo.Caras car
    ON detcon.caraId = car.caraId
INNER JOIN olVallas.dbo.Sitios siti
    ON car.sitiId = siti.sitiId
INNER JOIN olComun.dbo.Clientes cli
    ON maecon.cliId = cli.cliId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND detcon.dconFechaHasta >= @FechaDesde
  AND detcon.dconFechaHasta <  @FechaHasta
  AND NOT EXISTS (
      SELECT 1
      FROM olVallas.dbo.maeContratos child
      WHERE child.mconIdPadre = maecon.mconId
        AND child.mconAnulado <> 1
        AND child.mconPosteado <> 0
  )
ORDER BY detcon.dconFechaHasta ASC
`;

const ACTIVE_CONTRACTS_SQL = `
SELECT DISTINCT
    maecon.mconId,
    detcon.dconId,
    maecon.mconAtencionA,
    detcon.dconFechaHasta,
    detcon.dconFechaDesde,
    maecon.mconCodigo,
    car.caraCodigo,
    siti.sitiDireccion,
    siti.sitiGPSLat,
    siti.sitiGPSLon,
    cli.cliNombres,
    cli.cliEmail
FROM olVallas.dbo.maeContratos maecon
INNER JOIN olVallas.dbo.detContratos detcon
    ON detcon.mconId = maecon.mconId
INNER JOIN olVallas.dbo.Caras car
    ON detcon.caraId = car.caraId
INNER JOIN olVallas.dbo.Sitios siti
    ON car.sitiId = siti.sitiId
INNER JOIN olComun.dbo.Clientes cli
    ON maecon.cliId = cli.cliId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND detcon.dconFechaDesde <= @FechaHasta
  AND detcon.dconFechaHasta >= @FechaDesde
  AND NOT EXISTS (
      SELECT 1
      FROM olVallas.dbo.maeContratos child
      WHERE child.mconIdPadre = maecon.mconId
        AND child.mconAnulado <> 1
        AND child.mconPosteado <> 0
  )
ORDER BY detcon.dconFechaHasta ASC
`;

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
    private readonly s3Storage: S3StorageService,
    private readonly email: EmailService,
  ) {}

  async getEndingSoonContracts(
    from: Date,
    to: Date,
  ): Promise<EndingSoonContract[]> {
    const rows = await this.brilo.query<SourceContractRow>(
      ENDING_SOON_CONTRACTS_SQL,
      {
        FechaDesde: from,
        FechaHasta: to,
      },
    );
    return this.mapSourceContracts(rows);
  }

  async getEndingSoonContractsFiltered(
    from: Date,
    to: Date,
  ): Promise<EndingSoonContract[]> {
    const sourceRows = await this.brilo.query<SourceContractRow>(
      ENDING_SOON_CONTRACTS_SQL,
      {
        FechaDesde: from,
        FechaHasta: to,
      },
    );

    if (sourceRows.length === 0) return [];

    const sourceIdsInRange = sourceRows.map((r) => r.dconId);
    const notified = await this.prisma.notifiedContract.findMany({
      where: {
        contractDetailSourceId: { in: sourceIdsInRange },
        status: { not: NotificationStatus.FAILED },
      },
      select: { contractDetailSourceId: true },
    });
    const notifiedSourceIds = new Set(
      notified.map((n) => n.contractDetailSourceId),
    );

    return this.mapSourceContracts(
      sourceRows.filter((row) => !notifiedSourceIds.has(row.dconId)),
    );
  }

  async getNotifiedContracts() {
    return this.prisma.notifiedContract.findMany({
      where: { status: NotificationStatus.SENT },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNotifiedContract(dto: CreateNotifiedContractDto) {
    return this.prisma.notifiedContract.create({
      data: {
        contractSourceId: dto.contractSourceId,
        contractDetailSourceId: dto.contractDetailSourceId,
        contractNumber: dto.contractNumber,
        status: dto.status,
        errorMessage: dto.errorMessage ?? null,
      },
    });
  }

  async getActiveContractsWithImages(
    from: Date,
    to: Date,
  ): Promise<ActiveContractWithImages[]> {
    const sourceRows = await this.brilo.query<ActiveContractRow>(
      ACTIVE_CONTRACTS_SQL,
      {
        FechaDesde: from,
        FechaHasta: to,
      },
    );

    if (sourceRows.length === 0) return [];

    const billboardCodes = Array.from(
      new Set(
        sourceRows
          .map((row) => row.caraCodigo)
          .filter((code): code is string => Boolean(code)),
      ),
    );

    const imagesByCode = await this.fetchImagesByBillboardCode(
      billboardCodes,
      from,
      to,
    );

    return sourceRows.map((row) => ({
      contractSourceId: row.mconId,
      contractDetailSourceId: row.dconId,
      description: row.mconAtencionA,
      startDate: row.dconFechaDesde,
      endDate: row.dconFechaHasta,
      contractNumber: row.mconCodigo,
      billboardCode: row.caraCodigo,
      billboardAddress: row.sitiDireccion,
      billboardLatitude: row.sitiGPSLat,
      billboardLongitude: row.sitiGPSLon,
      customerName: row.cliNombres,
      customerEmail: row.cliEmail,
      images: imagesByCode.get(row.caraCodigo) ?? [],
    }));
  }

  private async fetchImagesByBillboardCode(
    codes: string[],
    from: Date,
    to: Date,
  ): Promise<Map<string, ActiveContractImage[]>> {
    const result = new Map<string, ActiveContractImage[]>();
    if (codes.length === 0) return result;

    const codeRows = await this.prisma.staticBillboardCodes.findMany({
      where: { code: { in: codes } },
      include: {
        s3Images: {
          where: {
            type: S3ImageType.STATIC_BILLBOARD_MONTHLY,
            createdAt: { gte: from, lte: to },
          },
          include: {
            uploadedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const allImages = codeRows.flatMap((codeRow) =>
      codeRow.s3Images.map((image) => ({ code: codeRow.code, image })),
    );

    const signedUrls = await Promise.all(
      allImages.map(({ image }) =>
        this.s3Storage.getSignedUrl(image.deleteUrl),
      ),
    );

    allImages.forEach(({ code, image }, index) => {
      const mapped: ActiveContractImage = {
        id: image.id,
        url: signedUrls[index],
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
        tags: image.tags,
        type: image.type,
        uploadedUser: image.uploadedUser,
      };
      const existing = result.get(code);
      if (existing) {
        existing.push(mapped);
      } else {
        result.set(code, [mapped]);
      }
    });

    return result;
  }

  async sendMaintenanceReport(dto: SendMaintenanceReportDto) {
    const fileBuffer = decodeReportFile(dto.fileBase64);

    const subject = `Reporte de Mantenimiento - Contrato ${dto.contractNumber} (${dto.period})`;
    const htmlContent = buildMaintenanceReportEmailHtml({
      contractNumber: dto.contractNumber,
      customerName: dto.customerName,
      description: dto.description ?? '',
      period: dto.period,
    });

    const { error } = await this.email.sendEmail(
      dto.email,
      subject,
      htmlContent,
      [
        {
          filename: dto.fileName,
          content: fileBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      ],
    );

    if (error) {
      throw new InternalServerErrorException(
        `No se pudo enviar el reporte: ${error.message}`,
      );
    }

    return { success: true };
  }

  private mapSourceContracts(
    contracts: SourceContractRow[],
  ): EndingSoonContract[] {
    return contracts.map((c) => ({
      contractSourceId: c.mconId,
      contractDetailSourceId: c.dconId,
      description: c.mconAtencionA,
      startDate: c.dconFechaDesde,
      endDate: c.dconFechaHasta,
      contractNumber: c.mconCodigo,
      billboardAddress: c.sitiDireccion,
      customerName: c.cliNombres,
      customerEmail: c.cliEmail,
    }));
  }
}

function decodeReportFile(input: string): Buffer {
  const cleaned = input.includes(',') ? (input.split(',').pop() ?? '') : input;
  return Buffer.from(cleaned, 'base64');
}

function buildMaintenanceReportEmailHtml(params: {
  contractNumber: string;
  customerName: string;
  description: string;
  period: string;
}): string {
  const greeting = params.customerName
    ? `Estimado(a) ${escapeHtml(params.customerName)},`
    : 'Estimado(a) cliente,';

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#003366;padding:24px 32px;color:#ffffff;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;color:#7aa3c8;">VEO MEDIA</p>
                <h1 style="margin:6px 0 0;font-size:22px;">Reporte de Mantenimiento</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
                  Adjunto encontrarás el reporte de mantenimiento correspondiente al periodo
                  <strong>${escapeHtml(params.period)}</strong> para el contrato
                  <strong>${escapeHtml(params.contractNumber)}</strong>.
                </p>
                ${
                  params.description
                    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
                        <em>${escapeHtml(params.description)}</em>
                      </p>`
                    : ''
                }
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:#f0f4f8;border-radius:8px;">
                  <tr>
                    <td style="padding:14px 16px;font-size:13px;color:#003366;">
                      <strong>Contrato:</strong> ${escapeHtml(params.contractNumber)}<br/>
                      <strong>Periodo:</strong> ${escapeHtml(params.period)}
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">
                  El archivo está adjunto a este correo en formato PowerPoint (.pptx).
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;">
                <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                  Saludos cordiales,<br/>
                  <strong>Equipo VEO Media</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                  Este es un correo automático. Por favor no responder a esta dirección.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
