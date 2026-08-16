-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'INSTALLER';
ALTER TYPE "Role" ADD VALUE 'WORKER';

-- AlterTable
ALTER TABLE "production_order_items" ADD COLUMN     "assigned_installer_id" TEXT,
ADD COLUMN     "installed_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_installation_at" TIMESTAMP(3),
ADD COLUMN     "vulcanizado_image_s3_key" TEXT;

-- CreateIndex
CREATE INDEX "production_order_items_assigned_installer_id_idx" ON "production_order_items"("assigned_installer_id");

-- AddForeignKey
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_assigned_installer_id_fkey" FOREIGN KEY ("assigned_installer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
