-- CreateEnum
CREATE TYPE "BriloSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterEnum
ALTER TYPE "OfferEventType" ADD VALUE 'BRILO_SYNCED';
ALTER TYPE "OfferEventType" ADD VALUE 'BRILO_SYNC_FAILED';

-- AlterTable
ALTER TABLE "offers_created" ADD COLUMN     "brilo_cli_id" INTEGER,
ADD COLUMN     "brilo_ejec_id" INTEGER,
ADD COLUMN     "brilo_mcot_id" INTEGER,
ADD COLUMN     "brilo_sync_error" TEXT,
ADD COLUMN     "brilo_sync_status" "BriloSyncStatus";
