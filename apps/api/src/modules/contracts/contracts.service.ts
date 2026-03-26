import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { NotificationStatus } from '@prisma/client';
import type { EndingSoonContract } from './entities/ending-soon-contract.js';
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

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
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
