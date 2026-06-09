-- CreateEnum
CREATE TYPE "OfferItemType" AS ENUM ('STATIC_BILLBOARD', 'DIGITAL_BILLBOARD', 'MISC');

-- AlterTable
ALTER TABLE "digital_billboard_usages" ADD COLUMN     "offer_item_id" TEXT;

-- AlterTable
ALTER TABLE "offers_created_items" ADD COLUMN     "description" TEXT,
ADD COLUMN     "digital_billboard_id" TEXT,
ADD COLUMN     "item_type" "OfferItemType" NOT NULL DEFAULT 'STATIC_BILLBOARD',
ADD COLUMN     "spot_count" INTEGER,
ADD COLUMN     "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.13;

-- CreateIndex
CREATE INDEX "digital_billboard_usages_offer_item_id_idx" ON "digital_billboard_usages"("offer_item_id");

-- CreateIndex
CREATE INDEX "offers_created_items_digital_billboard_id_idx" ON "offers_created_items"("digital_billboard_id");

-- AddForeignKey
ALTER TABLE "digital_billboard_usages" ADD CONSTRAINT "digital_billboard_usages_offer_item_id_fkey" FOREIGN KEY ("offer_item_id") REFERENCES "offers_created_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_created_items" ADD CONSTRAINT "offers_created_items_digital_billboard_id_fkey" FOREIGN KEY ("digital_billboard_id") REFERENCES "digital_billboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
