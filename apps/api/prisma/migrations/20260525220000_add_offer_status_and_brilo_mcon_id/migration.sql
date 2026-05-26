-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'DECLINED', 'ACCEPTED');

-- AlterTable
ALTER TABLE "offers_created" ADD COLUMN "status" "OfferStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "offers_created" ADD COLUMN "brilo_mcon_id" INTEGER;

-- CreateIndex
CREATE INDEX "offers_created_status_idx" ON "offers_created"("status");
