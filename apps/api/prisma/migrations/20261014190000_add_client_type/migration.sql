-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('DIRECT', 'AGENCY');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "type" "ClientType" NOT NULL DEFAULT 'DIRECT';

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");
