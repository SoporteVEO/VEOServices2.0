-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "brilo_cli_id" INTEGER;

-- CreateIndex
CREATE INDEX "clients_brilo_cli_id_idx" ON "clients"("brilo_cli_id");
