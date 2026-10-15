-- AlterTable
ALTER TABLE "production_order_items" ADD COLUMN     "art_file_name" TEXT,
ADD COLUMN     "art_mime_type" TEXT,
ADD COLUMN     "art_s3_key" TEXT,
ADD COLUMN     "art_uploaded_at" TIMESTAMP(3);
