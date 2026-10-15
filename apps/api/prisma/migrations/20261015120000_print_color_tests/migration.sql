-- CreateEnum
CREATE TYPE "PrintJobKind" AS ENUM ('PRODUCTION', 'COLOR_TEST');

-- AlterTable
ALTER TABLE "print_jobs" ADD COLUMN     "color_test_id" TEXT,
ADD COLUMN     "kind" "PrintJobKind" NOT NULL DEFAULT 'PRODUCTION';

-- CreateTable
CREATE TABLE "print_color_tests" (
    "id" TEXT NOT NULL,
    "production_order_item_id" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_color_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_color_tests_production_order_item_id_idx" ON "print_color_tests"("production_order_item_id");

-- CreateIndex
CREATE INDEX "print_jobs_color_test_id_idx" ON "print_jobs"("color_test_id");

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_color_test_id_fkey" FOREIGN KEY ("color_test_id") REFERENCES "print_color_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_color_tests" ADD CONSTRAINT "print_color_tests_production_order_item_id_fkey" FOREIGN KEY ("production_order_item_id") REFERENCES "production_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_color_tests" ADD CONSTRAINT "print_color_tests_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
