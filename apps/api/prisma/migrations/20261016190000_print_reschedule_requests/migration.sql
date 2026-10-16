-- CreateEnum
CREATE TYPE "PrintRescheduleStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "print_reschedule_requests" (
    "id" TEXT NOT NULL,
    "production_order_item_id" TEXT NOT NULL,
    "status" "PrintRescheduleStatus" NOT NULL DEFAULT 'PENDING',
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "preferred_date" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "previous_start_at" TIMESTAMP(3),
    "requested_by_user_id" TEXT NOT NULL,
    "resolved_by_user_id" TEXT,
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_reschedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_reschedule_requests_production_order_item_id_status_idx" ON "print_reschedule_requests"("production_order_item_id", "status");

-- CreateIndex
CREATE INDEX "print_reschedule_requests_status_createdAt_idx" ON "print_reschedule_requests"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "print_reschedule_requests" ADD CONSTRAINT "print_reschedule_requests_production_order_item_id_fkey" FOREIGN KEY ("production_order_item_id") REFERENCES "production_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_reschedule_requests" ADD CONSTRAINT "print_reschedule_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_reschedule_requests" ADD CONSTRAINT "print_reschedule_requests_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
