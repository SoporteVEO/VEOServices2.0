export const MAX_EXPIRING_CONTRACTS = 500;

/**
 * One row per billboard line of every contract whose latest end date falls in
 * [@FechaDesde, @FechaHasta] (both inclusive). Contracts already renewed (they
 * have a posted child contract) are left out, like in the ending-soon list.
 * The seller filter matches the executive name only.
 */
export const EXPIRING_CONTRACTS_SQL = `
WITH ExpiringContracts AS (
    SELECT TOP (@MaxContracts)
        maecon.mconId,
        MAX(detcon.dconFechaHasta) AS latestEnd
    FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.detContratos detcon WITH (NOLOCK)
        ON detcon.mconId = maecon.mconId
    INNER JOIN olVallas.dbo.Caras car WITH (NOLOCK)
        ON detcon.caraId = car.caraId
    INNER JOIN olVallas.dbo.Sitios siti WITH (NOLOCK)
        ON car.sitiId = siti.sitiId
    LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
        ON ej.ejecId = maecon.ejecId
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
          @ApplyEjecutivoFilter = 0
          OR (
              ej.ejecNombre IS NOT NULL
              AND ej.ejecNombre LIKE @Token1Like ESCAPE '\\'
              AND (@TokenCount < 2 OR ej.ejecNombre LIKE @Token2Like ESCAPE '\\')
              AND (@TokenCount < 3 OR ej.ejecNombre LIKE @Token3Like ESCAPE '\\')
              AND (@TokenCount < 4 OR ej.ejecNombre LIKE @Token4Like ESCAPE '\\')
          )
      )
    GROUP BY maecon.mconId
    HAVING MAX(detcon.dconFechaHasta) >= @FechaDesde
       AND MAX(detcon.dconFechaHasta) <= @FechaHasta
    ORDER BY MAX(detcon.dconFechaHasta) ASC, maecon.mconId ASC
)
SELECT
    expiring.mconId,
    expiring.latestEnd,
    maecon.mconCodigo,
    cli.cliNombres,
    cli.cliEmail,
    ej.ejecNombre,
    car.caraCodigo
FROM ExpiringContracts expiring
INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    ON maecon.mconId = expiring.mconId
INNER JOIN olVallas.dbo.detContratos detcon WITH (NOLOCK)
    ON detcon.mconId = expiring.mconId
INNER JOIN olVallas.dbo.Caras car WITH (NOLOCK)
    ON detcon.caraId = car.caraId
INNER JOIN olVallas.dbo.Sitios siti WITH (NOLOCK)
    ON car.sitiId = siti.sitiId
INNER JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON maecon.cliId = cli.cliId
LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
    ON ej.ejecId = maecon.ejecId
ORDER BY expiring.latestEnd ASC, expiring.mconId ASC, car.caraCodigo ASC
`;
