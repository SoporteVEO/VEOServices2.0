-- CreateEnum
CREATE TYPE "DigitalCampaignArt" AS ENUM ('RECEIVED', 'MISSING', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "DigitalCampaignDeal" AS ENUM ('COMMERCIAL', 'DONATION', 'EXCHANGE', 'DATION', 'BONUS');

-- CreateEnum
CREATE TYPE "DigitalBillboardLogType" AS ENUM ('NEW', 'RENEWED', 'EXTENDED', 'SHORTENED', 'EDITED', 'PAUSED', 'RESUMED', 'MOVED', 'REMOVED');

-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'PANTALLAS_PRODUCCION';
ALTER TYPE "SubRole" ADD VALUE 'PANTALLAS_COMERCIAL';

-- AlterTable
ALTER TABLE "digital_billboards" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "last_change_action" TEXT,
ADD COLUMN     "last_change_at" TIMESTAMP(3),
ADD COLUMN     "last_change_client" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "turn_off_at" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "turn_on_at" TEXT NOT NULL DEFAULT '05:30';

-- CreateTable
CREATE TABLE "digital_billboard_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "spots_per_hour" INTEGER NOT NULL DEFAULT 450,
    "min_hours" DOUBLE PRECISION NOT NULL DEFAULT 16.5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_billboard_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_billboard_sublists" (
    "id" TEXT NOT NULL,
    "digital_billboard_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 900,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_billboard_sublists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_billboard_campaigns" (
    "id" TEXT NOT NULL,
    "sublist_id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "campaign" TEXT NOT NULL DEFAULT '',
    "start_date" DATE,
    "end_date" DATE,
    "spots_per_day" INTEGER NOT NULL,
    "notes" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pause_reason" TEXT,
    "art" "DigitalCampaignArt" NOT NULL DEFAULT 'RECEIVED',
    "deal" "DigitalCampaignDeal" NOT NULL DEFAULT 'COMMERCIAL',
    "monthly_value" DOUBLE PRECISION,
    "spot_value" DOUBLE PRECISION,
    "total_value" DOUBLE PRECISION,
    "order_group_id" TEXT,
    "offer_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_billboard_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_billboard_campaign_versions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "start_date" DATE,
    "end_date" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "digital_billboard_campaign_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_billboard_logs" (
    "id" TEXT NOT NULL,
    "type" "DigitalBillboardLogType" NOT NULL,
    "client" TEXT NOT NULL,
    "campaign" TEXT,
    "screen_name" TEXT NOT NULL,
    "sublist_name" TEXT,
    "spots_per_day" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "previous_end_date" DATE,
    "previous_spots_per_day" INTEGER,
    "detail" TEXT,
    "order_group_id" TEXT,
    "new_sublist" BOOLEAN NOT NULL DEFAULT false,
    "actor_user_id" TEXT,
    "actor_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_billboard_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "digital_billboard_sublists_digital_billboard_id_position_idx" ON "digital_billboard_sublists"("digital_billboard_id", "position");

-- CreateIndex
CREATE INDEX "digital_billboard_campaigns_sublist_id_idx" ON "digital_billboard_campaigns"("sublist_id");

-- CreateIndex
CREATE INDEX "digital_billboard_campaigns_client_idx" ON "digital_billboard_campaigns"("client");

-- CreateIndex
CREATE INDEX "digital_billboard_campaigns_order_group_id_idx" ON "digital_billboard_campaigns"("order_group_id");

-- CreateIndex
CREATE INDEX "digital_billboard_campaigns_offer_item_id_idx" ON "digital_billboard_campaigns"("offer_item_id");

-- CreateIndex
CREATE INDEX "digital_billboard_campaigns_start_date_end_date_idx" ON "digital_billboard_campaigns"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "digital_billboard_campaign_versions_campaign_id_idx" ON "digital_billboard_campaign_versions"("campaign_id");

-- CreateIndex
CREATE INDEX "digital_billboard_logs_created_at_idx" ON "digital_billboard_logs"("created_at");

-- CreateIndex
CREATE INDEX "digital_billboard_logs_type_created_at_idx" ON "digital_billboard_logs"("type", "created_at");

-- CreateIndex
CREATE INDEX "digital_billboard_logs_client_idx" ON "digital_billboard_logs"("client");

-- AddForeignKey
ALTER TABLE "digital_billboard_sublists" ADD CONSTRAINT "digital_billboard_sublists_digital_billboard_id_fkey" FOREIGN KEY ("digital_billboard_id") REFERENCES "digital_billboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_billboard_campaigns" ADD CONSTRAINT "digital_billboard_campaigns_sublist_id_fkey" FOREIGN KEY ("sublist_id") REFERENCES "digital_billboard_sublists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_billboard_campaigns" ADD CONSTRAINT "digital_billboard_campaigns_offer_item_id_fkey" FOREIGN KEY ("offer_item_id") REFERENCES "offers_created_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_billboard_campaign_versions" ADD CONSTRAINT "digital_billboard_campaign_versions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "digital_billboard_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the singleton settings row
INSERT INTO "digital_billboard_settings" ("id", "updated_at") VALUES (1, CURRENT_TIMESTAMP);

-- Every existing screen starts with one full sublist
INSERT INTO "digital_billboard_sublists" ("id", "digital_billboard_id", "name", "capacity", "position", "updated_at")
SELECT gen_random_uuid()::text, b."id", UPPER(b."code") || ' 01', 900, 0, CURRENT_TIMESTAMP
FROM "digital_billboards" b;

-- Per-day usages become campaigns: consecutive days with the same screen,
-- offer item, name and spot count collapse into one date range.
WITH days AS (
    SELECT DISTINCT
        u."digitalBillboardId" AS board_id,
        u."offer_item_id" AS offer_item_id,
        COALESCE(NULLIF(TRIM(u."campaignName"), ''), 'SIN CLIENTE') AS client,
        COALESCE(u."campaignDescription", '') AS description,
        u."duration" AS spots,
        u."timestamp"::date AS day
    FROM "digital_billboard_usages" u
),
islands AS (
    SELECT *,
        day - (DENSE_RANK() OVER (
            PARTITION BY board_id, offer_item_id, client, description, spots
            ORDER BY day
        ))::int AS grp
    FROM days
),
ranges AS (
    SELECT board_id, offer_item_id, client, description, spots,
        MIN(day) AS start_date, MAX(day) AS end_date
    FROM islands
    GROUP BY board_id, offer_item_id, client, description, spots, grp
)
INSERT INTO "digital_billboard_campaigns" ("id", "sublist_id", "client", "campaign", "start_date", "end_date", "spots_per_day", "offer_item_id", "updated_at")
SELECT gen_random_uuid()::text, s."id", r.client, r.description, r.start_date, r.end_date, r.spots, r.offer_item_id, CURRENT_TIMESTAMP
FROM ranges r
JOIN "digital_billboard_sublists" s ON s."digital_billboard_id" = r.board_id;

-- DropForeignKey
ALTER TABLE "digital_billboard_usages" DROP CONSTRAINT "digital_billboard_usages_digitalBillboardId_fkey";

-- DropForeignKey
ALTER TABLE "digital_billboard_usages" DROP CONSTRAINT "digital_billboard_usages_offer_item_id_fkey";

-- DropTable
DROP TABLE "digital_billboard_usages";
