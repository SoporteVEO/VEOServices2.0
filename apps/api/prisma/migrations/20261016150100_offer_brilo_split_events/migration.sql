-- Backfill the Brilo codes of offers synced before they were stored.
UPDATE "offers_created" o
SET "brilo_mcot_numero" = s.m[1],
    "brilo_mcon_codigo" = s.m[2]
FROM (
    SELECT DISTINCT ON ("offer_id")
        "offer_id",
        regexp_match("message", 'Cotizaci.n (\S+) y contrato (\S+) creados') AS m
    FROM "offer_events"
    WHERE "type" = 'BRILO_SYNCED'
    ORDER BY "offer_id", "createdAt" DESC
) s
WHERE s."offer_id" = o."id"
  AND s.m IS NOT NULL
  AND o."brilo_mcon_id" IS NOT NULL;

-- Split each combined sync entry into one entry per Brilo document.
INSERT INTO "offer_events" ("id", "offer_id", "type", "message", "changes", "actor_user_id", "createdAt")
SELECT
    gen_random_uuid()::text,
    e."offer_id",
    'BRILO_COTIZACION_CREATED',
    'Cotización ' || m[1] || ' creada en Brilo',
    NULL,
    e."actor_user_id",
    e."createdAt" - INTERVAL '1 millisecond'
FROM "offer_events" e,
     regexp_match(e."message", 'Cotizaci.n (\S+) y contrato (\S+) creados') AS m
WHERE e."type" = 'BRILO_SYNCED'
  AND m IS NOT NULL;

UPDATE "offer_events"
SET "type" = 'BRILO_CONTRATO_CREATED',
    "message" = 'Contrato ' || (regexp_match("message", 'contrato (\S+) creados'))[1] || ' creado en Brilo',
    "changes" = NULL
WHERE "type" = 'BRILO_SYNCED'
  AND "message" ~ 'Cotizaci.n (\S+) y contrato (\S+) creados';

UPDATE "offer_events"
SET "type" = CASE
        WHEN "message" LIKE 'No se pudo crear el contrato%' THEN 'BRILO_CONTRATO_FAILED'::"OfferEventType"
        ELSE 'BRILO_COTIZACION_FAILED'::"OfferEventType"
    END
WHERE "type" = 'BRILO_SYNC_FAILED';
