import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';

export type ClientContractStatus = 'ACTIVE' | 'UPCOMING' | 'FINISHED';

export interface ClientContract {
  contractSourceId: number;
  contractNumber: string;
  description: string | null;
  brand: string | null;
  customerName: string | null;
  executiveName: string | null;
  agencyName: string | null;
  signedAt: Date | null;
  startDate: Date;
  endDate: Date;
  totalBillboards: number;
  status: ClientContractStatus;
}

interface ClientContractRow {
  mconId: number;
  mconCodigo: string;
  mconAtencionA: string | null;
  mconMarca: string | null;
  mconFecha: Date | null;
  cliNombres: string | null;
  executiveName: string | null;
  agencyName: string | null;
  earliestStart: Date;
  latestEnd: Date;
  totalBillboards: number;
}

const MAX_CLIENT_CONTRACTS = 500;

// Brilo customers have no link to local clients, so they are matched by any
// of their stored emails. Superseded parent contracts are excluded so only the
// latest version of an amended contract is listed.
const CLIENT_CONTRACTS_SQL = `
SELECT TOP (${MAX_CLIENT_CONTRACTS})
    maecon.mconId,
    MAX(maecon.mconCodigo) AS mconCodigo,
    MAX(maecon.mconAtencionA) AS mconAtencionA,
    MAX(maecon.mconMarca) AS mconMarca,
    MAX(maecon.mconFecha) AS mconFecha,
    MAX(cli.cliNombres) AS cliNombres,
    MAX(ej.ejecNombre) AS executiveName,
    MAX(agen.agenNombre) AS agencyName,
    MIN(detcon.dconFechaDesde) AS earliestStart,
    MAX(detcon.dconFechaHasta) AS latestEnd,
    COUNT(DISTINCT detcon.caraId) AS totalBillboards
FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
INNER JOIN olVallas.dbo.detContratos detcon WITH (NOLOCK)
    ON detcon.mconId = maecon.mconId
INNER JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON maecon.cliId = cli.cliId
LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
    ON ej.ejecId = maecon.ejecId
LEFT JOIN olVallas.dbo.Agencias agen WITH (NOLOCK)
    ON agen.agenId = maecon.agenId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND NOT EXISTS (
      SELECT 1
      FROM olVallas.dbo.maeContratos child WITH (NOLOCK)
      WHERE child.mconIdPadre = maecon.mconId
        AND child.mconAnulado <> 1
        AND child.mconPosteado <> 0
  )
  AND (
      LOWER(LTRIM(RTRIM(cli.cliEmail))) IN (@Email1, @Email2)
      OR LOWER(LTRIM(RTRIM(cli.cliEmailFacturacion))) IN (@Email1, @Email2)
      OR LOWER(LTRIM(RTRIM(cli.cliEmailAdicional))) IN (@Email1, @Email2)
  )
GROUP BY maecon.mconId
ORDER BY MAX(detcon.dconFechaHasta) DESC, maecon.mconId DESC
`;

@Injectable()
export class ClientContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
  ) {}

  async listByClient(clientId: string): Promise<ClientContract[]> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true, billingEmail: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const email = client.email.trim().toLowerCase();
    const billingEmail = client.billingEmail?.trim().toLowerCase() || email;

    const rows = await this.brilo.query<ClientContractRow>(
      CLIENT_CONTRACTS_SQL,
      { Email1: email, Email2: billingEmail },
    );

    const today = startOfToday();
    return rows.map((row) => ({
      contractSourceId: row.mconId,
      contractNumber: row.mconCodigo,
      description: row.mconAtencionA?.trim() || null,
      brand: row.mconMarca?.trim() || null,
      customerName: row.cliNombres?.trim() || null,
      executiveName: row.executiveName?.trim() || null,
      agencyName: row.agencyName?.trim() || null,
      signedAt: row.mconFecha,
      startDate: row.earliestStart,
      endDate: row.latestEnd,
      totalBillboards: row.totalBillboards,
      status: resolveStatus(row.earliestStart, row.latestEnd, today),
    }));
  }
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function resolveStatus(
  start: Date,
  end: Date,
  today: Date,
): ClientContractStatus {
  if (end < today) return 'FINISHED';
  if (start > today) return 'UPCOMING';
  return 'ACTIVE';
}
