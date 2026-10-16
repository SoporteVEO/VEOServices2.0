-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANTENIMIENTO_PANTALLAS';

-- AlterEnum
ALTER TYPE "MaintenanceJobStatus" ADD VALUE 'CLOSED' BEFORE 'CANCELLED';

-- AlterEnum
ALTER TYPE "MaintenanceEventType" ADD VALUE 'COMMENTED' BEFORE 'COMPLETED';

-- AlterEnum
ALTER TYPE "MaintenanceEventType" ADD VALUE 'CLOSED' BEFORE 'REOPENED';

-- CreateEnum
CREATE TYPE "MaintenanceJobKind" AS ENUM ('STATIC', 'DIGITAL');

-- AlterTable
ALTER TABLE "maintenance_categories" ADD COLUMN "kind" "MaintenanceJobKind" NOT NULL DEFAULT 'STATIC';

-- DropIndex
DROP INDEX "maintenance_categories_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_categories_kind_name_key" ON "maintenance_categories"("kind", "name");

-- AlterTable
ALTER TABLE "maintenance_jobs" ADD COLUMN "kind" "MaintenanceJobKind" NOT NULL DEFAULT 'STATIC',
ADD COLUMN "digital_billboard_id" TEXT,
ADD COLUMN "billboard_name" TEXT,
ADD COLUMN "closed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "maintenance_jobs_kind_status_idx" ON "maintenance_jobs"("kind", "status");

-- CreateIndex
CREATE INDEX "maintenance_jobs_digital_billboard_id_idx" ON "maintenance_jobs"("digital_billboard_id");

-- AddForeignKey
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_digital_billboard_id_fkey" FOREIGN KEY ("digital_billboard_id") REFERENCES "digital_billboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "maintenance_comments" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_comments_job_id_createdAt_idx" ON "maintenance_comments"("job_id", "createdAt");

-- AddForeignKey
ALTER TABLE "maintenance_comments" ADD CONSTRAINT "maintenance_comments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "maintenance_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_comments" ADD CONSTRAINT "maintenance_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
