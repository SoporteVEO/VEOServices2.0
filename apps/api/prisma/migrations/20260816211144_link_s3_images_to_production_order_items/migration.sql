-- AlterTable
ALTER TABLE "s3_images" ADD COLUMN     "production_order_item_id" TEXT;

-- CreateIndex
CREATE INDEX "s3_images_production_order_item_id_idx" ON "s3_images"("production_order_item_id");

-- AddForeignKey
ALTER TABLE "s3_images" ADD CONSTRAINT "s3_images_production_order_item_id_fkey" FOREIGN KEY ("production_order_item_id") REFERENCES "production_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
