-- AlterTable
ALTER TABLE "maintenance_photos" ADD COLUMN     "s3_image_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_photos_s3_image_id_key" ON "maintenance_photos"("s3_image_id");

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_s3_image_id_fkey" FOREIGN KEY ("s3_image_id") REFERENCES "s3_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
