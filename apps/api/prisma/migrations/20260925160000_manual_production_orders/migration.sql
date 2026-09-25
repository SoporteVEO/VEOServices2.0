-- Production orders can now be created by hand, without an offer. Customer and
-- billboard data is copied onto the order so both kinds read the same columns.

-- AlterTable
ALTER TABLE "production_orders"
    ALTER COLUMN "offer_id" DROP NOT NULL,
    ADD COLUMN "order_number" TEXT,
    ADD COLUMN "customer_name" TEXT,
    ADD COLUMN "customer_company" TEXT,
    ADD COLUMN "advisor_full_name" TEXT,
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "created_by_user_id" TEXT;

-- Backfill from the originating offer
UPDATE "production_orders" AS po
SET "order_number" = o."offer_number",
    "customer_name" = o."customer_name",
    "customer_company" = o."customer_company",
    "advisor_full_name" = o."advisor_full_name",
    "created_by_user_id" = o."created_by_user_id"
FROM "offers_created" AS o
WHERE o."id" = po."offer_id";

ALTER TABLE "production_orders"
    ALTER COLUMN "order_number" SET NOT NULL,
    ALTER COLUMN "customer_name" SET NOT NULL,
    ALTER COLUMN "created_by_user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "production_order_items"
    ALTER COLUMN "offer_item_id" DROP NOT NULL,
    ADD COLUMN "billboard_id" INTEGER,
    ADD COLUMN "billboard_code" TEXT,
    ADD COLUMN "address" TEXT,
    ADD COLUMN "city_name" TEXT,
    ADD COLUMN "department_name" TEXT,
    ADD COLUMN "width" DOUBLE PRECISION,
    ADD COLUMN "height" DOUBLE PRECISION,
    ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- Backfill from the originating offer item
UPDATE "production_order_items" AS poi
SET "billboard_id" = oci."billboard_id",
    "billboard_code" = oci."billboard_code",
    "address" = oci."address",
    "city_name" = oci."city_name",
    "department_name" = oci."department_name",
    "width" = oci."width",
    "height" = oci."height",
    "quantity" = oci."quantity"
FROM "offers_created_items" AS oci
WHERE oci."id" = poi."offer_item_id";

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_order_number_key" ON "production_orders"("order_number");

-- CreateIndex
CREATE INDEX "production_orders_created_by_user_id_idx" ON "production_orders"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "last_used_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
