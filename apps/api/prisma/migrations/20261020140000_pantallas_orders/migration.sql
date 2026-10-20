-- CreateEnum
CREATE TYPE "DigitalOrderStatus" AS ENUM ('PENDING', 'INGESTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "DigitalOrderArtFormat" AS ENUM ('ANIMATED', 'STATIC', 'VIDEO');

-- CreateTable
CREATE TABLE "digital_orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "DigitalOrderStatus" NOT NULL DEFAULT 'PENDING',
    "executive" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "has_agency" BOOLEAN NOT NULL DEFAULT false,
    "agency_name" TEXT,
    "client" TEXT NOT NULL,
    "campaign" TEXT NOT NULL DEFAULT '',
    "art_format" "DigitalOrderArtFormat" NOT NULL DEFAULT 'ANIMATED',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "total_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "return_reason" TEXT,
    "returned_at" TIMESTAMP(3),
    "ingested_at" TIMESTAMP(3),
    "ingested_by" TEXT,
    "order_group_id" TEXT,
    "created_by_user_id" TEXT,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_order_screens" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "digital_billboard_id" TEXT,
    "screen_name" TEXT NOT NULL,
    "spots_per_day" INTEGER NOT NULL,
    "monthly_value" DOUBLE PRECISION,
    "spot_value" DOUBLE PRECISION,
    "spot_value_manual" BOOLEAN NOT NULL DEFAULT false,
    "deal" "DigitalCampaignDeal" NOT NULL DEFAULT 'COMMERCIAL',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "digital_order_screens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_orders_code_key" ON "digital_orders"("code");

-- CreateIndex
CREATE INDEX "digital_orders_status_updated_at_idx" ON "digital_orders"("status", "updated_at");

-- CreateIndex
CREATE INDEX "digital_orders_entry_date_idx" ON "digital_orders"("entry_date");

-- CreateIndex
CREATE INDEX "digital_order_screens_order_id_idx" ON "digital_order_screens"("order_id");

-- CreateIndex
CREATE INDEX "digital_order_screens_digital_billboard_id_idx" ON "digital_order_screens"("digital_billboard_id");

-- AddForeignKey
ALTER TABLE "digital_order_screens" ADD CONSTRAINT "digital_order_screens_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "digital_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_order_screens" ADD CONSTRAINT "digital_order_screens_digital_billboard_id_fkey" FOREIGN KEY ("digital_billboard_id") REFERENCES "digital_billboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
