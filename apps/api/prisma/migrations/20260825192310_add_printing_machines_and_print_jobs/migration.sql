-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('SCHEDULED', 'SETUP', 'PRINTING', 'COOLDOWN', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "printing_machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "setup_minutes" INTEGER NOT NULL DEFAULT 15,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printing_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_rate_rules" (
    "id" TEXT NOT NULL,
    "width_meters" DOUBLE PRECISION NOT NULL,
    "print_minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_rate_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "production_order_item_id" TEXT NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_start_at" TIMESTAMP(3) NOT NULL,
    "setup_minutes" INTEGER NOT NULL,
    "print_minutes" INTEGER NOT NULL,
    "cooldown_minutes" INTEGER NOT NULL,
    "setup_started_at" TIMESTAMP(3),
    "print_started_at" TIMESTAMP(3),
    "cooldown_started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_rate_rules_width_meters_key" ON "print_rate_rules"("width_meters");

-- CreateIndex
CREATE INDEX "print_jobs_machine_id_scheduled_start_at_idx" ON "print_jobs"("machine_id", "scheduled_start_at");

-- CreateIndex
CREATE INDEX "print_jobs_production_order_item_id_idx" ON "print_jobs"("production_order_item_id");

-- CreateIndex
CREATE INDEX "print_jobs_status_idx" ON "print_jobs"("status");

-- CreateIndex
CREATE INDEX "print_jobs_scheduled_start_at_idx" ON "print_jobs"("scheduled_start_at");

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "printing_machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_production_order_item_id_fkey" FOREIGN KEY ("production_order_item_id") REFERENCES "production_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
