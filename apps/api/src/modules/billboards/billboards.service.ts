import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { RedisService } from '../redis/redis.service.js';
import { TtlCache } from '../../lib/ttl-cache.js';
import type {
  AvailableBillboard,
  AvailableBillboardListing,
  AvailableBillboardReport,
  AvailableState,
} from './entities/available-billboard.js';

const CACHE_TTL_MS =
  Number(process.env.BILLBOARD_CACHE_TTL_MS) || 5 * 60 * 1000;
const IMAGE_REDIS_TTL_S =
  Number(process.env.BILLBOARD_IMAGE_REDIS_TTL_S) || 24 * 60 * 60;

interface BriloStateRow {
  departamentoId: number;
  departamento: string;
  availableCount: number;
}

interface BriloBillboardRow {
  caraId: number;
  caraCodigo: string | null;
  Dirección: string | null;
  Referencia: string | null;
  DepartamentoId: number | null;
  Departamento: string | null;
  Municipio: string | null;
  Calle: string | null;
  Alto: number | null;
  Ancho: number | null;
  Latitud: number | null;
  Longitud: number | null;
  Precio: number | null;
  ImagenId: number | null;
  ImagenFecha: Date | null;
  ImagenObservaciones: string | null;
  UltimaFechaContrato: Date | null;
}

interface BriloBillboardListingRow {
  caraId: number;
  caraCodigo: string | null;
  Dirección: string | null;
  Referencia: string | null;
  DepartamentoId: number | null;
  Departamento: string | null;
  Municipio: string | null;
  Calle: string | null;
  Alto: number | null;
  Ancho: number | null;
  Latitud: number | null;
  Longitud: number | null;
  Precio: number | null;
  UltimaFechaContrato: Date | null;
  IsOccupied?: number | boolean | null;
}

interface BriloBillboardReportRow extends BriloBillboardRow {
  PrecioImpresion: number | null;
}

const AVAILABLE_STATES_SQL = `
SELECT
    dpto.dptoId      AS departamentoId,
    dpto.dptoNombre  AS departamento,
    COUNT(DISTINCT car.caraId) AS availableCount
FROM olVallas.dbo.Caras AS car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios AS siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId
LEFT JOIN olComun.dbo.DeptosEstados AS dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId
    AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
WHERE
    siti.sitiActivo = 1
    AND car.caraActivo = 1
    AND dpto.dptoId IS NOT NULL
    AND prca_def.Precio IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
        INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
            ON maecon.mconId = detcon.mconId
        WHERE detcon.caraId = car.caraId
          AND maecon.mconPosteado <> 0
          AND maecon.mconAnulado <> 1
          AND detcon.dconFechaDesde <= @FechaFin
          AND detcon.dconFechaHasta >= @FechaInicio
    )
GROUP BY dpto.dptoId, dpto.dptoNombre
ORDER BY dpto.dptoNombre ASC;
`;

const AVAILABLE_BILLBOARDS_SQL = `
SELECT
    car.caraId,
    car.caraCodigo,

    siti.sitiReferencia AS [Referencia],
    siti.sitiDireccion  AS [Dirección],
    dpto.dptoId         AS [DepartamentoId],
    dpto.dptoNombre     AS [Departamento],
    muni.muniNombre     AS [Municipio],
    calle.callNombre    AS [Calle],

    car.caraAlto        AS [Alto],
    car.caraAncho       AS [Ancho],

    siti.sitiGPSLat     AS [Latitud],
    siti.sitiGPSLon     AS [Longitud],

    ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) AS [Precio],

    img.imagId            AS [ImagenId],
    img.imagFecha         AS [ImagenFecha],
    img.imagObservaciones AS [ImagenObservaciones],

    last_contract.dconFechaHasta AS [UltimaFechaContrato]

FROM olVallas.dbo.Caras AS car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios AS siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId

LEFT JOIN olComun.dbo.DeptosEstados AS dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN olComun.dbo.MuniCondados AS muni WITH (NOLOCK)
    ON siti.muniId = muni.muniId
LEFT JOIN olComun.dbo.Calles AS calle WITH (NOLOCK)
    ON siti.callId = calle.callId

LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId

OUTER APPLY (
    SELECT TOP 1
        i.imagId,
        i.imagFecha,
        i.imagObservaciones
    FROM olVallas.dbo.imagenes i WITH (NOLOCK)
    WHERE i.caraId = car.caraId
    AND i.tiimId <> 1
    AND i.tiimId <> 5
    ORDER BY i.imagFecha DESC, i.imagId DESC
) img

OUTER APPLY (
    SELECT TOP 1 detcon.dconFechaHasta
    FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
        ON maecon.mconId = detcon.mconId
    WHERE detcon.caraId = car.caraId
      AND maecon.mconPosteado <> 0
      AND maecon.mconAnulado <> 1
    ORDER BY detcon.dconFechaHasta DESC
) last_contract

WHERE
    siti.sitiActivo = 1
    AND car.caraActivo = 1
    AND dpto.dptoId = @DepartamentoId
    AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
    AND NOT EXISTS (
        SELECT 1
        FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
        INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
            ON maecon.mconId = detcon.mconId
        WHERE detcon.caraId = car.caraId
          AND maecon.mconPosteado <> 0
          AND maecon.mconAnulado <> 1
          AND detcon.dconFechaDesde <= @FechaFin
          AND detcon.dconFechaHasta >= @FechaInicio
    )
ORDER BY car.caraCodigo DESC;
`;

const AVAILABLE_BILLBOARDS_ALL_SQL = `
SELECT
    car.caraId,
    car.caraCodigo,

    siti.sitiReferencia AS [Referencia],
    siti.sitiDireccion  AS [Dirección],
    dpto.dptoId         AS [DepartamentoId],
    dpto.dptoNombre     AS [Departamento],
    muni.muniNombre     AS [Municipio],
    calle.callNombre    AS [Calle],

    car.caraAlto        AS [Alto],
    car.caraAncho       AS [Ancho],

    siti.sitiGPSLat     AS [Latitud],
    siti.sitiGPSLon     AS [Longitud],

    ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) AS [Precio],

    last_contract.dconFechaHasta AS [UltimaFechaContrato]

FROM olVallas.dbo.Caras AS car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios AS siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId

LEFT JOIN olComun.dbo.DeptosEstados AS dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN olComun.dbo.MuniCondados AS muni WITH (NOLOCK)
    ON siti.muniId = muni.muniId
LEFT JOIN olComun.dbo.Calles AS calle WITH (NOLOCK)
    ON siti.callId = calle.callId

LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId

OUTER APPLY (
    SELECT TOP 1 detcon.dconFechaHasta
    FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
        ON maecon.mconId = detcon.mconId
    WHERE detcon.caraId = car.caraId
      AND maecon.mconPosteado <> 0
      AND maecon.mconAnulado <> 1
    ORDER BY detcon.dconFechaHasta DESC
) last_contract

WHERE
    siti.sitiActivo = 1
    AND car.caraActivo = 1
    AND dpto.dptoId IS NOT NULL
    AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
    AND NOT EXISTS (
        SELECT 1
        FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
        INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
            ON maecon.mconId = detcon.mconId
        WHERE detcon.caraId = car.caraId
          AND maecon.mconPosteado <> 0
          AND maecon.mconAnulado <> 1
          AND detcon.dconFechaDesde <= @FechaFin
          AND detcon.dconFechaHasta >= @FechaInicio
    )
ORDER BY dpto.dptoNombre ASC, car.caraCodigo DESC;
`;

const ALL_BILLBOARDS_WITH_STATUS_SQL = `
SELECT
    car.caraId,
    car.caraCodigo,

    siti.sitiReferencia AS [Referencia],
    siti.sitiDireccion  AS [Dirección],
    dpto.dptoId         AS [DepartamentoId],
    dpto.dptoNombre     AS [Departamento],
    muni.muniNombre     AS [Municipio],
    calle.callNombre    AS [Calle],

    car.caraAlto        AS [Alto],
    car.caraAncho       AS [Ancho],

    siti.sitiGPSLat     AS [Latitud],
    siti.sitiGPSLon     AS [Longitud],

    ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) AS [Precio],

    last_contract.dconFechaHasta AS [UltimaFechaContrato],

    CASE WHEN EXISTS (
        SELECT 1
        FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
        INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
            ON maecon.mconId = detcon.mconId
        WHERE detcon.caraId = car.caraId
          AND maecon.mconPosteado <> 0
          AND maecon.mconAnulado <> 1
          AND detcon.dconFechaDesde <= @FechaFin
          AND detcon.dconFechaHasta >= @FechaInicio
    ) THEN 1 ELSE 0 END AS [IsOccupied]

FROM olVallas.dbo.Caras AS car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios AS siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId

LEFT JOIN olComun.dbo.DeptosEstados AS dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN olComun.dbo.MuniCondados AS muni WITH (NOLOCK)
    ON siti.muniId = muni.muniId
LEFT JOIN olComun.dbo.Calles AS calle WITH (NOLOCK)
    ON siti.callId = calle.callId

LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId

OUTER APPLY (
    SELECT TOP 1 detcon.dconFechaHasta
    FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
        ON maecon.mconId = detcon.mconId
    WHERE detcon.caraId = car.caraId
      AND maecon.mconPosteado <> 0
      AND maecon.mconAnulado <> 1
    ORDER BY detcon.dconFechaHasta DESC
) last_contract

WHERE
    siti.sitiActivo = 1
    AND car.caraActivo = 1
    AND dpto.dptoId IS NOT NULL
    AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
ORDER BY dpto.dptoNombre ASC, car.caraCodigo DESC;
`;

const AVAILABLE_BILLBOARDS_REPORT_SQL = `
SELECT
    car.caraId,
    car.caraCodigo,

    siti.sitiReferencia AS [Referencia],
    siti.sitiDireccion  AS [Dirección],
    dpto.dptoId         AS [DepartamentoId],
    dpto.dptoNombre     AS [Departamento],
    muni.muniNombre     AS [Municipio],
    calle.callNombre    AS [Calle],

    car.caraAlto        AS [Alto],
    car.caraAncho       AS [Ancho],

    siti.sitiGPSLat     AS [Latitud],
    siti.sitiGPSLon     AS [Longitud],

    ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) AS [Precio],
    prca_def.PrecioImpresion AS [PrecioImpresion],

    img.imagId            AS [ImagenId],
    img.imagFecha         AS [ImagenFecha],
    img.imagObservaciones AS [ImagenObservaciones],

    last_contract.dconFechaHasta AS [UltimaFechaContrato]

FROM olVallas.dbo.Caras AS car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios AS siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId

LEFT JOIN olComun.dbo.DeptosEstados AS dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN olComun.dbo.MuniCondados AS muni WITH (NOLOCK)
    ON siti.muniId = muni.muniId
LEFT JOIN olComun.dbo.Calles AS calle WITH (NOLOCK)
    ON siti.callId = calle.callId

LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio,
        MAX(CASE WHEN tp1.tiprEsDefault <> 1 THEN pc1.prcaPrecio ELSE NULL END) AS PrecioImpresion
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId

OUTER APPLY (
    SELECT TOP 1
        i.imagId,
        i.imagFecha,
        i.imagObservaciones
    FROM olVallas.dbo.imagenes i WITH (NOLOCK)
    WHERE i.caraId = car.caraId
    AND i.tiimId <> 1
    AND i.tiimId <> 5
    ORDER BY i.imagFecha DESC, i.imagId DESC
) img

OUTER APPLY (
    SELECT TOP 1 detcon.dconFechaHasta
    FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
        ON maecon.mconId = detcon.mconId
    WHERE detcon.caraId = car.caraId
      AND maecon.mconPosteado <> 0
      AND maecon.mconAnulado <> 1
    ORDER BY detcon.dconFechaHasta DESC
) last_contract

WHERE
    siti.sitiActivo = 1
    AND car.caraActivo = 1
    AND dpto.dptoId IS NOT NULL
    AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
    AND NOT EXISTS (
        SELECT 1
        FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
        INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
            ON maecon.mconId = detcon.mconId
        WHERE detcon.caraId = car.caraId
          AND maecon.mconPosteado <> 0
          AND maecon.mconAnulado <> 1
          AND detcon.dconFechaDesde <= @FechaFin
          AND detcon.dconFechaHasta >= @FechaInicio
    )
ORDER BY dpto.dptoNombre ASC, car.caraCodigo DESC;
`;

const BILLBOARD_IMAGE_SQL = `
SELECT i.imagImagen AS [Imagen]
FROM olVallas.dbo.imagenes i WITH (NOLOCK)
WHERE i.imagId = @ImagenId
`;

const CONTRACTS_IN_RANGE_SQL = `
SELECT
    detcon.caraId        AS caraId,
    detcon.dconFechaDesde AS [FechaDesde],
    detcon.dconFechaHasta AS [FechaHasta]
FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    ON maecon.mconId = detcon.mconId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND detcon.dconFechaDesde <= @FechaFin
  AND detcon.dconFechaHasta >= @FechaInicio;
`;

interface BriloContractRangeRow {
  caraId: number;
  FechaDesde: Date;
  FechaHasta: Date;
}

function applyDiscount(
  price: number | null,
  discount: number | null,
): number | null {
  if (price == null) return null;
  if (discount != null && discount > 0) {
    return Math.round(price * (1 - discount / 100) * 100) / 100;
  }
  return price;
}

function getDiscountForMonthsWithoutPurchase(
  monthsWithoutPurchase: number | null,
): number | null {
  if (monthsWithoutPurchase == null) return null;
  if (monthsWithoutPurchase >= 3) return 45;
  if (monthsWithoutPurchase === 2) return 30;
  if (monthsWithoutPurchase === 1) return 20;
  return null;
}

function calendarMonthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1
  );
}

function calculateMonthsWithoutContractInRange(
  contracts: { from: Date; to: Date }[],
  rangeFrom: Date,
  rangeTo: Date,
): number {
  const totalMonths = calendarMonthsBetween(rangeFrom, rangeTo);
  if (totalMonths <= 0) return 0;

  const coveredMonthKeys = new Set<number>();

  for (const contract of contracts) {
    const start = contract.from > rangeFrom ? contract.from : rangeFrom;
    const end = contract.to < rangeTo ? contract.to : rangeTo;
    if (start > end) continue;

    const cursorYear = start.getFullYear();
    const cursorMonth = start.getMonth();
    const stopKey = end.getFullYear() * 12 + end.getMonth();
    let key = cursorYear * 12 + cursorMonth;

    while (key <= stopKey) {
      coveredMonthKeys.add(key);
      key += 1;
    }
  }

  return Math.max(0, totalMonths - coveredMonthKeys.size);
}

function detectImageMimeType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return 'image/png';
  if (buf.length >= 6) {
    const header = buf.toString('ascii', 0, 6);
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  return null;
}

@Injectable()
export class BillboardsService {
  private readonly logger = new Logger(BillboardsService.name);
  private readonly statesCache = new TtlCache<AvailableState[]>(CACHE_TTL_MS);
  private readonly billboardsCache = new TtlCache<AvailableBillboard[]>(
    CACHE_TTL_MS,
  );
  private readonly billboardsAllCache = new TtlCache<
    AvailableBillboardListing[]
  >(CACHE_TTL_MS);
  private readonly billboardsAllIncludingOccupiedCache = new TtlCache<
    AvailableBillboardListing[]
  >(CACHE_TTL_MS);
  private readonly billboardsReportCache = new TtlCache<
    AvailableBillboardReport[]
  >(CACHE_TTL_MS);
  private readonly imageCache = new TtlCache<{
    buffer: Buffer;
    mime: string;
  } | null>(30 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
    private readonly redis: RedisService,
  ) {
    this.logger.log(`Billboard cache TTL: ${CACHE_TTL_MS}ms`);
  }

  async getAvailableStates(from: Date, to: Date): Promise<AvailableState[]> {
    const key = `${from.toISOString()}|${to.toISOString()}`;
    return this.statesCache.getOrFetch(key, async () => {
      const rows = await this.brilo.query<BriloStateRow>(AVAILABLE_STATES_SQL, {
        FechaInicio: from,
        FechaFin: to,
      });
      return rows.map((r) => ({
        departmentId: Number(r.departamentoId),
        departmentName: String(r.departamento ?? ''),
        availableCount: Number(r.availableCount ?? 0),
      }));
    });
  }

  async getAvailableBillboardsInRange(
    from: Date,
    to: Date,
    options: { includeUnavailable?: boolean } = {},
  ): Promise<AvailableBillboardListing[]> {
    const { includeUnavailable = false } = options;
    const key = `${includeUnavailable ? 'all-with-occupied' : 'all'}|${from.toISOString()}|${to.toISOString()}`;
    const cache = includeUnavailable
      ? this.billboardsAllIncludingOccupiedCache
      : this.billboardsAllCache;
    return cache.getOrFetch(key, () =>
      this.fetchBillboardsAll(from, to, { includeUnavailable }),
    );
  }

  async getAvailableBillboardsForReport(
    from: Date,
    to: Date,
  ): Promise<AvailableBillboardReport[]> {
    const key = `report|${from.toISOString()}|${to.toISOString()}`;
    return this.billboardsReportCache.getOrFetch(key, () =>
      this.fetchBillboardsReport(from, to),
    );
  }

  async getAvailableBillboardsByState(
    departmentId: number,
    from: Date,
    to: Date,
  ): Promise<AvailableBillboard[]> {
    const key = `${departmentId}|${from.toISOString()}|${to.toISOString()}`;
    return this.billboardsCache.getOrFetch(key, () =>
      this.fetchBillboards(departmentId, from, to),
    );
  }

  private async fetchBillboardsAll(
    from: Date,
    to: Date,
    options: { includeUnavailable?: boolean } = {},
  ): Promise<AvailableBillboardListing[]> {
    const { includeUnavailable = false } = options;
    const sql = includeUnavailable
      ? ALL_BILLBOARDS_WITH_STATUS_SQL
      : AVAILABLE_BILLBOARDS_ALL_SQL;

    const rows = await this.brilo.query<BriloBillboardListingRow>(sql, {
      FechaInicio: from,
      FechaFin: to,
    });

    const filtered = rows.filter((r) => {
      if (r.Precio == null) return false;
      const numeric = Number(r.Precio);
      return Number.isFinite(numeric) && numeric > 0;
    });

    const billboardIds = [
      ...new Set(
        filtered
          .map((r) => r.caraId)
          .filter((id): id is number => id != null)
          .map(Number)
          .filter(Number.isFinite),
      ),
    ];

    let purchasedSet = new Set<number>();
    if (billboardIds.length > 0) {
      const overlapping = await this.prisma.purchaseItem.findMany({
        where: {
          billboardId: { in: billboardIds },
          purchase: { status: 'COMPLETED' },
          AND: [{ from: { lte: to } }, { to: { gte: from } }],
        },
        select: { billboardId: true },
      });
      purchasedSet = new Set(
        overlapping
          .map((i) => i.billboardId)
          .filter((id): id is number => id != null),
      );
    }

    const contractsByBillboard = includeUnavailable
      ? await this.fetchContractsByBillboardInRange(from, to)
      : null;

    const now = new Date();
    const visible = includeUnavailable
      ? filtered
      : filtered.filter((r) => !purchasedSet.has(Number(r.caraId)));

    return visible.map((r): AvailableBillboardListing => {
      const billboardId = Number(r.caraId);

      let monthsWithoutPurchase: number | null;
      let availableDiscount: number | null;

      if (includeUnavailable) {
        const contracts = contractsByBillboard?.get(billboardId) ?? [];
        monthsWithoutPurchase = calculateMonthsWithoutContractInRange(
          contracts,
          from,
          to,
        );
        availableDiscount = null;
      } else {
        const lastDate = r.UltimaFechaContrato;
        monthsWithoutPurchase = lastDate
          ? Math.max(
              0,
              (now.getFullYear() - lastDate.getFullYear()) * 12 +
                (now.getMonth() - lastDate.getMonth()),
            )
          : null;
        availableDiscount = getDiscountForMonthsWithoutPurchase(
          monthsWithoutPurchase,
        );
      }

      const isOccupiedInBrilo = includeUnavailable
        ? Boolean(Number(r.IsOccupied ?? 0))
        : false;
      const isPurchased = purchasedSet.has(billboardId);
      const isAvailable = !isOccupiedInBrilo && !isPurchased;

      return {
        billboardId,
        billboardCode: r.caraCodigo ?? null,
        reference: r.Referencia ?? null,
        address: r['Dirección'] ?? null,
        departmentId: r.DepartamentoId ?? null,
        departmentName: r.Departamento ?? null,
        cityName: r.Municipio ?? null,
        streetName: r.Calle ?? null,
        height: r.Alto ?? null,
        width: r.Ancho ?? null,
        latitude: r.Latitud ?? null,
        longitude: r.Longitud ?? null,
        price: r.Precio ?? null,
        monthsWithoutPurchase,
        availableDiscount,
        totalPrice: applyDiscount(r.Precio ?? null, availableDiscount),
        isAvailable,
      };
    });
  }

  private async fetchContractsByBillboardInRange(
    from: Date,
    to: Date,
  ): Promise<Map<number, { from: Date; to: Date }[]>> {
    const rows = await this.brilo.query<BriloContractRangeRow>(
      CONTRACTS_IN_RANGE_SQL,
      {
        FechaInicio: from,
        FechaFin: to,
      },
    );

    const byBillboard = new Map<number, { from: Date; to: Date }[]>();
    for (const row of rows) {
      const billboardId = Number(row.caraId);
      if (!Number.isFinite(billboardId)) continue;
      if (!(row.FechaDesde instanceof Date) || !(row.FechaHasta instanceof Date)) {
        continue;
      }
      const list = byBillboard.get(billboardId) ?? [];
      list.push({ from: row.FechaDesde, to: row.FechaHasta });
      byBillboard.set(billboardId, list);
    }
    return byBillboard;
  }

  private async fetchBillboardsReport(
    from: Date,
    to: Date,
  ): Promise<AvailableBillboardReport[]> {
    const rows = await this.brilo.query<BriloBillboardReportRow>(
      AVAILABLE_BILLBOARDS_REPORT_SQL,
      {
        FechaInicio: from,
        FechaFin: to,
      },
    );

    const filtered = rows.filter((r) => {
      if (r.Precio == null) return false;
      const numeric = Number(r.Precio);
      return Number.isFinite(numeric) && numeric > 0;
    });

    const billboardIds = [
      ...new Set(
        filtered
          .map((r) => r.caraId)
          .filter((id): id is number => id != null)
          .map(Number)
          .filter(Number.isFinite),
      ),
    ];

    let purchasedSet = new Set<number>();
    if (billboardIds.length > 0) {
      const overlapping = await this.prisma.purchaseItem.findMany({
        where: {
          billboardId: { in: billboardIds },
          purchase: { status: 'COMPLETED' },
          AND: [{ from: { lte: to } }, { to: { gte: from } }],
        },
        select: { billboardId: true },
      });
      purchasedSet = new Set(
        overlapping
          .map((i) => i.billboardId)
          .filter((id): id is number => id != null),
      );
    }

    const now = new Date();
    return filtered
      .filter((r) => !purchasedSet.has(Number(r.caraId)))
      .map((r): AvailableBillboardReport => {
        const lastDate = r.UltimaFechaContrato;
        const monthsWithoutPurchase = lastDate
          ? Math.max(
              0,
              (now.getFullYear() - lastDate.getFullYear()) * 12 +
                (now.getMonth() - lastDate.getMonth()),
            )
          : null;

        let availableDiscount: number | null = null;
        if (monthsWithoutPurchase != null && monthsWithoutPurchase >= 3) {
          availableDiscount = 45;
        } else if (monthsWithoutPurchase === 2) {
          availableDiscount = 30;
        } else if (monthsWithoutPurchase === 1) {
          availableDiscount = 20;
        }

        return {
          billboardId: Number(r.caraId),
          billboardCode: r.caraCodigo ?? null,
          reference: r.Referencia ?? null,
          address: r['Dirección'] ?? null,
          departmentId: r.DepartamentoId ?? null,
          departmentName: r.Departamento ?? null,
          cityName: r.Municipio ?? null,
          streetName: r.Calle ?? null,
          height: r.Alto ?? null,
          width: r.Ancho ?? null,
          latitude: r.Latitud ?? null,
          longitude: r.Longitud ?? null,
          price: r.Precio ?? null,
          imageId: r.ImagenId ?? null,
          imageDate: r.ImagenFecha ?? null,
          imageNotes: r.ImagenObservaciones ?? null,
          impressionPrice: r.PrecioImpresion ?? null,
          monthsWithoutPurchase,
          availableDiscount,
          totalPrice: applyDiscount(r.Precio ?? null, availableDiscount),
          isAvailable: true,
        };
      });
  }

  private async fetchBillboards(
    departmentId: number,
    from: Date,
    to: Date,
  ): Promise<AvailableBillboard[]> {
    const rows = await this.brilo.query<BriloBillboardRow>(
      AVAILABLE_BILLBOARDS_SQL,
      {
        DepartamentoId: departmentId,
        FechaInicio: from,
        FechaFin: to,
      },
    );

    const filtered = rows.filter((r) => {
      if (r.Precio == null) return false;
      const numeric = Number(r.Precio);
      return Number.isFinite(numeric) && numeric > 0;
    });

    const billboardIds = [
      ...new Set(
        filtered
          .map((r) => r.caraId)
          .filter((id): id is number => id != null)
          .map(Number)
          .filter(Number.isFinite),
      ),
    ];

    let purchasedSet = new Set<number>();
    if (billboardIds.length > 0) {
      const overlapping = await this.prisma.purchaseItem.findMany({
        where: {
          billboardId: { in: billboardIds },
          purchase: { status: 'COMPLETED' },
          AND: [{ from: { lte: to } }, { to: { gte: from } }],
        },
        select: { billboardId: true },
      });
      purchasedSet = new Set(
        overlapping
          .map((i) => i.billboardId)
          .filter((id): id is number => id != null),
      );
    }

    const now = new Date();
    return filtered
      .filter((r) => !purchasedSet.has(Number(r.caraId)))
      .map((r): AvailableBillboard => {
        const lastDate = r.UltimaFechaContrato;
        const monthsWithoutPurchase = lastDate
          ? Math.max(
              0,
              (now.getFullYear() - lastDate.getFullYear()) * 12 +
                (now.getMonth() - lastDate.getMonth()),
            )
          : null;

        let availableDiscount: number | null = null;
        if (monthsWithoutPurchase != null && monthsWithoutPurchase >= 3) {
          availableDiscount = 45;
        } else if (monthsWithoutPurchase === 2) {
          availableDiscount = 30;
        } else if (monthsWithoutPurchase === 1) {
          availableDiscount = 20;
        }

        return {
          billboardId: Number(r.caraId),
          billboardCode: r.caraCodigo ?? null,
          reference: r.Referencia ?? null,
          address: r['Dirección'] ?? null,
          departmentId: r.DepartamentoId ?? null,
          departmentName: r.Departamento ?? null,
          cityName: r.Municipio ?? null,
          streetName: r.Calle ?? null,
          height: r.Alto ?? null,
          width: r.Ancho ?? null,
          latitude: r.Latitud ?? null,
          longitude: r.Longitud ?? null,
          price: r.Precio ?? null,
          imageId: r.ImagenId ?? null,
          imageDate: r.ImagenFecha ?? null,
          imageNotes: r.ImagenObservaciones ?? null,
          monthsWithoutPurchase,
          availableDiscount,
          totalPrice: applyDiscount(r.Precio ?? null, availableDiscount),
          isAvailable: true,
        };
      });
  }

  async getBillboardImage(
    imageId: number,
  ): Promise<{ buffer: Buffer; mime: string } | null> {
    return this.imageCache.getOrFetch(String(imageId), () =>
      this.fetchImageWithRedis(imageId),
    );
  }

  private async fetchImageWithRedis(
    imageId: number,
  ): Promise<{ buffer: Buffer; mime: string } | null> {
    const redisKey = `billboard:img:${imageId}`;

    const [cachedMime, cachedData] = await Promise.all([
      this.redis.get(`${redisKey}:mime`),
      this.redis.getBuffer(`${redisKey}:data`),
    ]);

    if (cachedMime && cachedData) {
      return { buffer: cachedData, mime: cachedMime };
    }

    const rows = await this.brilo.query<{ Imagen: unknown }>(
      BILLBOARD_IMAGE_SQL,
      { ImagenId: imageId },
    );

    if (rows.length === 0 || !rows[0].Imagen) return null;

    const buf = Buffer.isBuffer(rows[0].Imagen)
      ? rows[0].Imagen
      : Buffer.from(rows[0].Imagen as ArrayBuffer);
    if (!buf.length) return null;

    const mime = detectImageMimeType(buf) ?? 'application/octet-stream';

    await Promise.all([
      this.redis.setex(`${redisKey}:mime`, IMAGE_REDIS_TTL_S, mime),
      this.redis.setex(`${redisKey}:data`, IMAGE_REDIS_TTL_S, buf),
    ]);

    return { buffer: buf, mime };
  }
}
