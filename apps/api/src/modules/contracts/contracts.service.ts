import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import {
  S3StorageService,
  type PresignedPutResult,
} from '../s3-images/s3-storage.service.js';
import { EmailService } from '../email/email.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationStatus, ReportType, S3ImageType } from '@prisma/client';
import type { EndingSoonContract } from './entities/ending-soon-contract.js';
import type {
  ActiveContractGroup,
  ActiveContractImage,
  ActiveContractWithImages,
  PaginatedActiveContracts,
} from './entities/active-contract-with-images.js';
import type { CreateNotifiedContractDto } from './dto/create-notified-contract.dto.js';
import {
  REPORT_UPLOAD_FOLDER,
  type ContractReportType,
  type SendMaintenanceReportDto,
} from './dto/send-maintenance-report.dto.js';

const REPORT_TYPE_EMAIL_LABELS: Record<
  ContractReportType,
  { subject: string; heading: string; body: string }
> = {
  monthly: {
    subject: 'Reporte Mensual de Vallas',
    heading: 'Reporte Mensual de Vallas',
    body: 'el reporte mensual de vallas',
  },
  installation: {
    subject: 'Reporte de Instalación de Vallas',
    heading: 'Reporte de Instalación de Vallas',
    body: 'el reporte de instalación de vallas',
  },
  maintenance: {
    subject: 'Reporte de Mantenimiento de Vallas',
    heading: 'Reporte de Mantenimiento de Vallas',
    body: 'el reporte de mantenimiento de vallas',
  },
};

const REPORT_TYPE_DB_MAP: Record<ContractReportType, ReportType> = {
  monthly: ReportType.MONTHLY,
  installation: ReportType.INSTALLATION,
  maintenance: ReportType.MAINTENANCE,
};

const IMAGE_TYPE_TO_REPORT_TYPE: Record<S3ImageType, ReportType> = {
  [S3ImageType.STATIC_BILLBOARD_MONTHLY]: ReportType.MONTHLY,
  [S3ImageType.STATIC_BILLBOARD_INSTALLATION]: ReportType.INSTALLATION,
  [S3ImageType.STATIC_BILLBOARD_MAINTENANCE]: ReportType.MAINTENANCE,
};

const REPORT_TYPE_TO_API: Record<ReportType, ContractReportType> = {
  [ReportType.MONTHLY]: 'monthly',
  [ReportType.INSTALLATION]: 'installation',
  [ReportType.MAINTENANCE]: 'maintenance',
};

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

interface ActiveContractGroupRow {
  mconId: number;
  mconCodigo: string;
  mconAtencionA: string;
  cliNombres: string;
  cliEmail: string;
  earliestStart: Date;
  latestEnd: Date;
  totalCount: number;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

const ACTIVE_CONTRACTS_PAGE_SQL = `
WITH FilteredContracts AS (
    SELECT
        maecon.mconId,
        MIN(detcon.dconFechaDesde) AS earliestStart,
        MAX(detcon.dconFechaHasta) AS latestEnd,
        MAX(maecon.mconCodigo) AS mconCodigo,
        MAX(maecon.mconAtencionA) AS mconAtencionA,
        MAX(cli.cliNombres) AS cliNombres,
        MAX(cli.cliEmail) AS cliEmail
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
      AND NOT EXISTS (
          SELECT 1
          FROM olVallas.dbo.maeContratos child
          WHERE child.mconIdPadre = maecon.mconId
            AND child.mconAnulado <> 1
            AND child.mconPosteado <> 0
      )
      AND (
          @Search = ''
          OR maecon.mconCodigo LIKE @SearchLike ESCAPE '\\'
          OR maecon.mconAtencionA LIKE @SearchLike ESCAPE '\\'
          OR cli.cliNombres LIKE @SearchLike ESCAPE '\\'
          OR cli.cliEmail LIKE @SearchLike ESCAPE '\\'
          OR car.caraCodigo LIKE @SearchLike ESCAPE '\\'
      )
    GROUP BY maecon.mconId
)
SELECT
    mconId,
    mconCodigo,
    mconAtencionA,
    cliNombres,
    cliEmail,
    earliestStart,
    latestEnd,
    COUNT(*) OVER () AS totalCount
FROM FilteredContracts
ORDER BY latestEnd ASC, mconId ASC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
`;

const ACTIVE_CONTRACT_DETAILS_SQL = `
SELECT
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
WHERE maecon.mconId IN (__IDS__)
ORDER BY maecon.mconId, detcon.dconFechaHasta ASC
`;

const REPORT_FILE_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const REPORT_FILE_EXTENSION = 'pptx';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
    private readonly s3Storage: S3StorageService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
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

  async getActiveContractsWithImages(args: {
    from: Date;
    to: Date;
    imageType?: S3ImageType;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedActiveContracts> {
    const page = clampPage(args.page);
    const pageSize = clampPageSize(args.pageSize);
    const search = (args.search ?? '').trim();
    const searchLike = `%${escapeLikePattern(search)}%`;
    const offset = (page - 1) * pageSize;
    const imageType = args.imageType ?? S3ImageType.STATIC_BILLBOARD_MONTHLY;

    const groupRows = await this.brilo.query<ActiveContractGroupRow>(
      ACTIVE_CONTRACTS_PAGE_SQL,
      {
        FechaDesde: args.from,
        Search: search,
        SearchLike: searchLike,
        Offset: offset,
        PageSize: pageSize,
      },
    );

    if (groupRows.length === 0) {
      return { data: [], total: 0, page, pageSize };
    }

    const total = groupRows[0]?.totalCount ?? 0;
    const mconIds = groupRows.map((row) => row.mconId);

    const detailRows = await this.fetchContractDetails(mconIds);

    const billboardCodes = Array.from(
      new Set(
        detailRows
          .map((row) => row.caraCodigo)
          .filter((code): code is string => Boolean(code)),
      ),
    );

    const imagesByCode = await this.fetchImagesByBillboardCode(
      billboardCodes,
      args.from,
      args.to,
      imageType,
    );

    const billboardsByContract = new Map<number, ActiveContractWithImages[]>();
    for (const row of detailRows) {
      const billboard: ActiveContractWithImages = {
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
      };
      const existing = billboardsByContract.get(row.mconId);
      if (existing) {
        existing.push(billboard);
      } else {
        billboardsByContract.set(row.mconId, [billboard]);
      }
    }

    const data: ActiveContractGroup[] = groupRows.map((row) => {
      const billboards = billboardsByContract.get(row.mconId) ?? [];
      const totalImages = billboards.reduce(
        (sum, b) => sum + b.images.length,
        0,
      );
      const billboardsWithImages = billboards.filter(
        (b) => b.images.length > 0,
      ).length;

      return {
        contractNumber: row.mconCodigo,
        contractSourceId: row.mconId,
        description: row.mconAtencionA,
        customerName: row.cliNombres,
        customerEmail: row.cliEmail,
        startDate: row.earliestStart,
        endDate: row.latestEnd,
        billboards,
        totalBillboards: billboards.length,
        totalImages,
        billboardsWithImages,
        reportsSendedCount: 0,
      };
    });

    const reportDbType = IMAGE_TYPE_TO_REPORT_TYPE[imageType];
    const countByContract = await this.countReportsSendedByContracts(
      data.map((g) => g.contractNumber),
      reportDbType,
    );

    const dataWithCounts = data.map((g) => ({
      ...g,
      reportsSendedCount: countByContract.get(g.contractNumber) ?? 0,
    }));

    return { data: dataWithCounts, total, page, pageSize };
  }

  async listReportsSended(
    contractNumber: string,
    reportType: ContractReportType,
  ) {
    const rows = await this.prisma.reportSended.findMany({
      where: {
        contractNumber,
        reportType: REPORT_TYPE_DB_MAP[reportType],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        teamMember: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      sentToEmail: r.sentToEmail,
      reportType: REPORT_TYPE_TO_API[r.reportType],
      sentBy: {
        firstName: r.teamMember.user.firstName,
        lastName: r.teamMember.user.lastName,
        email: r.teamMember.user.email,
      },
    }));
  }

  private async countReportsSendedByContracts(
    contractNumbers: string[],
    reportType: ReportType,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (contractNumbers.length === 0) return result;

    const grouped = await this.prisma.reportSended.groupBy({
      by: ['contractNumber'],
      where: {
        contractNumber: { in: contractNumbers },
        reportType,
      },
      _count: { _all: true },
    });

    for (const row of grouped) {
      result.set(row.contractNumber, row._count._all);
    }
    return result;
  }

  private async fetchContractDetails(
    mconIds: number[],
  ): Promise<ActiveContractRow[]> {
    if (mconIds.length === 0) return [];

    const params: Record<string, unknown> = {};
    const placeholders = mconIds
      .map((id, i) => {
        params[`mconId${i}`] = id;
        return `@mconId${i}`;
      })
      .join(',');

    const sql = ACTIVE_CONTRACT_DETAILS_SQL.replace('__IDS__', placeholders);
    return this.brilo.query<ActiveContractRow>(sql, params);
  }

  private async fetchImagesByBillboardCode(
    codes: string[],
    from: Date,
    to: Date,
    imageType: S3ImageType,
  ): Promise<Map<string, ActiveContractImage[]>> {
    const result = new Map<string, ActiveContractImage[]>();
    if (codes.length === 0) return result;

    const codeRows = await this.prisma.staticBillboardCodes.findMany({
      where: { code: { in: codes } },
      include: {
        s3Images: {
          where: {
            type: imageType,
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

  async createReportUploadUrl(): Promise<PresignedPutResult> {
    return this.s3Storage.getPresignedPutUrl({
      extension: REPORT_FILE_EXTENSION,
      mimeType: REPORT_FILE_MIME_TYPE,
      folder: REPORT_UPLOAD_FOLDER,
    });
  }

  async sendMaintenanceReport(userId: string, dto: SendMaintenanceReportDto) {
    let fileBuffer: Buffer;
    try {
      fileBuffer = await this.s3Storage.getObjectBuffer(dto.fileKey);
    } catch (err) {
      this.logger.error(
        `No se pudo descargar el reporte ${dto.fileKey}: ${String(err)}`,
      );
      throw new InternalServerErrorException(
        'No se pudo recuperar el archivo del reporte',
      );
    }

    const reportType = dto.reportType ?? 'monthly';
    const labels = REPORT_TYPE_EMAIL_LABELS[reportType];
    const subject = `${labels.subject} - Contrato ${dto.contractNumber} (${dto.period})`;
    const htmlContent = buildMaintenanceReportEmailHtml({
      contractNumber: dto.contractNumber,
      customerName: dto.customerName,
      description: dto.description ?? '',
      period: dto.period,
      heading: labels.heading,
      body: labels.body,
    });

    try {
      const { error } = await this.email.sendEmail(
        dto.email,
        subject,
        htmlContent,
        [
          {
            filename: dto.fileName,
            content: fileBuffer,
            contentType: REPORT_FILE_MIME_TYPE,
          },
        ],
      );

      if (error) {
        throw new InternalServerErrorException(
          `No se pudo enviar el reporte: ${error.message}`,
        );
      }

      await this.recordSentReport({
        userId,
        contractNumber: dto.contractNumber,
        email: dto.email,
        reportType,
      });

      return { success: true };
    } finally {
      await this.s3Storage.deleteByKey(dto.fileKey);
    }
  }

  private async recordSentReport(input: {
    userId: string;
    contractNumber: string;
    email: string;
    reportType: ContractReportType;
  }) {
    try {
      const teamMember = await this.prisma.teamMember.findUnique({
        where: { userId: input.userId },
        select: { id: true },
      });

      if (teamMember) {
        await this.prisma.reportSended.create({
          data: {
            teamMemberId: teamMember.id,
            contractNumber: input.contractNumber,
            sentToEmail: input.email,
            reportType: REPORT_TYPE_DB_MAP[input.reportType],
          },
        });
      } else {
        this.logger.warn(
          `No se registró ReportSended: el usuario ${input.userId} no es miembro de plantilla`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `No se pudo registrar ReportSended para el usuario ${input.userId}`,
        err instanceof Error ? err.stack : err,
      );
    }

    try {
      await this.notifications.createOne({
        userId: input.userId,
        description: `Tu reporte del contrato ${input.contractNumber} se ha enviado correctamente al correo ${input.email}`,
        priority: 'LOW',
      });
    } catch (err) {
      this.logger.warn(
        `No se pudo crear la notificación de reporte enviado para el usuario ${input.userId}`,
        err instanceof Error ? err.stack : err,
      );
    }
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

function clampPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

function clampPageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_[]/g, (char) => `\\${char}`);
}

function buildMaintenanceReportEmailHtml(params: {
  contractNumber: string;
  customerName: string;
  description: string;
  period: string;
  heading: string;
  body: string;
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
                <h1 style="margin:6px 0 0;font-size:22px;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
                  Adjunto encontrarás ${escapeHtml(params.body)} correspondiente al periodo
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
