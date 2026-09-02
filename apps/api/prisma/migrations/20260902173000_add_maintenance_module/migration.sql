-- CreateEnum
CREATE TYPE "MaintenanceJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceEventType" AS ENUM ('CREATED', 'UPDATED', 'REASSIGNED', 'RESCHEDULED', 'STARTED', 'PHOTO_UPLOADED', 'PHOTO_DELETED', 'COMPLETED', 'REOPENED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANTENIMIENTO';

-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'MANTENIMIENTO';

-- CreateTable
CREATE TABLE "maintenance_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_jobs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "billboard_id" INTEGER,
    "billboard_code" TEXT,
    "address" TEXT,
    "city_name" TEXT,
    "department_name" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "category_id" TEXT,
    "assigned_user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "MaintenanceJobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "completion_notes" TEXT,
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_photos" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "note" TEXT,
    "uploaded_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "type" "MaintenanceEventType" NOT NULL,
    "message" TEXT,
    "actor_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_categories_name_key" ON "maintenance_categories"("name");

-- CreateIndex
CREATE INDEX "maintenance_categories_archived_idx" ON "maintenance_categories"("archived");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_jobs_code_key" ON "maintenance_jobs"("code");

-- CreateIndex
CREATE INDEX "maintenance_jobs_assigned_user_id_status_idx" ON "maintenance_jobs"("assigned_user_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_jobs_status_idx" ON "maintenance_jobs"("status");

-- CreateIndex
CREATE INDEX "maintenance_jobs_scheduled_at_idx" ON "maintenance_jobs"("scheduled_at");

-- CreateIndex
CREATE INDEX "maintenance_jobs_category_id_idx" ON "maintenance_jobs"("category_id");

-- CreateIndex
CREATE INDEX "maintenance_jobs_billboard_id_idx" ON "maintenance_jobs"("billboard_id");

-- CreateIndex
CREATE INDEX "maintenance_photos_job_id_createdAt_idx" ON "maintenance_photos"("job_id", "createdAt");

-- CreateIndex
CREATE INDEX "maintenance_events_job_id_createdAt_idx" ON "maintenance_events"("job_id", "createdAt");

-- CreateIndex
CREATE INDEX "maintenance_events_type_createdAt_idx" ON "maintenance_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "maintenance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "maintenance_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "maintenance_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
