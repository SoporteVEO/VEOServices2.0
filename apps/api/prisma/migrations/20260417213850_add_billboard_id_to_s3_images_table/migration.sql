-- AlterTable
ALTER TABLE "s3_images" ADD COLUMN     "billboardId" TEXT,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];
