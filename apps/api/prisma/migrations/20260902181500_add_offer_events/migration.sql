-- CreateEnum
CREATE TYPE "OfferEventType" AS ENUM ('CREATED', 'UPDATED', 'ITEMS_UPDATED', 'PDF_ATTACHED', 'ACCEPTED', 'DECLINED', 'REOPENED');

-- CreateTable
CREATE TABLE "offer_events" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "type" "OfferEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "changes" JSONB,
    "actor_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_events_offer_id_createdAt_idx" ON "offer_events"("offer_id", "createdAt");

-- CreateIndex
CREATE INDEX "offer_events_type_createdAt_idx" ON "offer_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "offer_events" ADD CONSTRAINT "offer_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers_created"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_events" ADD CONSTRAINT "offer_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: seed a CREATED event for every pre-existing offer so the Historial
-- tab has a starting point instead of appearing empty for historical records.
INSERT INTO "offer_events" ("id", "offer_id", "type", "message", "actor_user_id", "createdAt")
SELECT
    gen_random_uuid()::text,
    o."id",
    'CREATED',
    'Cotización ' || o."offer_number" || ' creada',
    o."created_by_user_id",
    o."createdAt"
FROM "offers_created" o;
