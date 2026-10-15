-- CreateEnum
CREATE TYPE "CrmMediaType" AS ENUM ('STATIC', 'DIGITAL', 'MIXED');

-- CreateEnum
CREATE TYPE "CrmSiteKind" AS ENUM ('STATIC', 'DIGITAL');

-- CreateEnum
CREATE TYPE "CrmSiteStatus" AS ENUM ('PROPOSED', 'HELD', 'BOOKED', 'RELEASED');

-- AlterEnum
ALTER TYPE "CrmActivityType" ADD VALUE 'INVENTORY_CHANGED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CrmDealSource" ADD VALUE 'RENEWAL';
ALTER TYPE "CrmDealSource" ADD VALUE 'WEB_SHOP';

-- AlterTable
ALTER TABLE "crm_deals" ADD COLUMN     "agency_commission_pct" DOUBLE PRECISION,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "campaign_end" DATE,
ADD COLUMN     "campaign_start" DATE,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "media_type" "CrmMediaType",
ADD COLUMN     "renewal_of" TEXT,
ADD COLUMN     "target_zones" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "crm_deal_sites" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "kind" "CrmSiteKind" NOT NULL,
    "billboard_id" INTEGER,
    "digital_billboard_id" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "city_name" TEXT,
    "department_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "spots_per_day" INTEGER,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CrmSiteStatus" NOT NULL DEFAULT 'PROPOSED',
    "held_at" TIMESTAMP(3),
    "hold_until" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deal_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_deal_sites_deal_id_idx" ON "crm_deal_sites"("deal_id");

-- CreateIndex
CREATE INDEX "crm_deal_sites_billboard_id_start_date_end_date_idx" ON "crm_deal_sites"("billboard_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "crm_deal_sites_digital_billboard_id_start_date_end_date_idx" ON "crm_deal_sites"("digital_billboard_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "crm_deal_sites_status_hold_until_idx" ON "crm_deal_sites"("status", "hold_until");

-- CreateIndex
CREATE INDEX "crm_deals_renewal_of_idx" ON "crm_deals"("renewal_of");

-- AddForeignKey
ALTER TABLE "crm_deal_sites" ADD CONSTRAINT "crm_deal_sites_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_sites" ADD CONSTRAINT "crm_deal_sites_digital_billboard_id_fkey" FOREIGN KEY ("digital_billboard_id") REFERENCES "digital_billboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_sites" ADD CONSTRAINT "crm_deal_sites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename the untouched default pipeline to the OOH funnel
UPDATE "crm_stages" s
SET "name" = v.new_name, "probability" = v.probability, "rotting_days" = v.rotting_days, "updated_at" = CURRENT_TIMESTAMP
FROM (VALUES
    ('Prospecto', 'Brief recibido', 10, 7),
    ('Contactado', 'Propuesta y disponibilidad', 30, 7),
    ('Cotización enviada', 'Reserva activa', 60, 5),
    ('Negociación', 'Negociación', 80, 5),
    ('Ganado', 'Orden firmada', 100, NULL)
) AS v(old_name, new_name, probability, rotting_days)
WHERE s."name" = v.old_name
  AND s."pipeline_id" IN (
      SELECT p."id" FROM "crm_pipelines" p
      WHERE p."is_default" = true
        AND (SELECT COUNT(*) FROM "crm_stages" x WHERE x."pipeline_id" = p."id"
             AND x."name" IN ('Prospecto', 'Contactado', 'Cotización enviada', 'Negociación', 'Ganado', 'Perdido')) = 6
  );

