-- AlterTable
ALTER TABLE "production_order_items" ADD COLUMN     "assigned_vulcanizador_id" TEXT;

-- CreateIndex
CREATE INDEX "production_order_items_assigned_vulcanizador_id_idx" ON "production_order_items"("assigned_vulcanizador_id");

-- AddForeignKey
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_assigned_vulcanizador_id_fkey" FOREIGN KEY ("assigned_vulcanizador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Operarios used to be picked in the installer slot; move them to their own.
UPDATE "production_order_items" AS poi
SET "assigned_vulcanizador_id" = poi."assigned_installer_id",
    "assigned_installer_id" = NULL
FROM "users" AS u
WHERE u."id" = poi."assigned_installer_id"
  AND u."role" = 'WORKER';
