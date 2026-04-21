import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import { NotificationStatus, S3ImageType } from '@prisma/client';
import type { EndingSoonContract } from './entities/ending-soon-contract.js';
import type {
  ActiveContractImage,
  ActiveContractWithImages,
} from './entities/active-contract-with-images.js';
import type { CreateNotifiedContractDto } from './dto/create-notified-contract.dto.js';

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
