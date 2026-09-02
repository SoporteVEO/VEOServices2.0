-- AlterTable
ALTER TABLE "print_jobs" ADD COLUMN     "area_m2" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "printing_machines" ADD COLUMN     "daily_capacity_m2" DOUBLE PRECISION NOT NULL DEFAULT 595,
ADD COLUMN     "print_speed_m2_per_hour" DOUBLE PRECISION NOT NULL DEFAULT 85;

-- Backfill the printed area of jobs scheduled before the column existed, so a
-- machine's consumed daily capacity accounts for work already on the calendar.
UPDATE "print_jobs" AS pj
SET "area_m2" = COALESCE(oci."width", 0)
              * COALESCE(oci."height", 0)
              * GREATEST(COALESCE(oci."quantity", 1), 1)
FROM "production_order_items" AS poi
JOIN "offers_created_items" AS oci ON oci."id" = poi."offer_item_id"
WHERE poi."id" = pj."production_order_item_id";

-- DropTable
DROP TABLE "print_rate_rules";
