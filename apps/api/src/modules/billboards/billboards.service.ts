import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { RedisService } from '../redis/redis.service.js';
import { TtlCache } from '../../lib/ttl-cache.js';
import type {
  AvailableBillboard,
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
    img.imagObservaciones AS [ImagenObservaciones]

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

const BILLBOARD_IMAGE_SQL = `
SELECT i.imagImagen AS [Imagen]
FROM olVallas.dbo.imagenes i WITH (NOLOCK)
WHERE i.imagId = @ImagenId
`;

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

    return filtered
      .filter((r) => !purchasedSet.has(Number(r.caraId)))
      .map(
        (r): AvailableBillboard => ({
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
        }),
      );
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
