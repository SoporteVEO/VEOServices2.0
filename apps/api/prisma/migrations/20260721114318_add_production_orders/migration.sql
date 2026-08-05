-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'PRODUCTION';

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('RECEIVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order_items" (
    "id" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "offer_item_id" TEXT NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "production_document_s3_key" TEXT,
    "design_document_s3_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_offer_id_key" ON "production_orders"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_items_offer_item_id_key" ON "production_order_items"("offer_item_id");

-- CreateIndex
CREATE INDEX "production_order_items_production_order_id_idx" ON "production_order_items"("production_order_id");

-- CreateIndex
CREATE INDEX "production_order_items_status_idx" ON "production_order_items"("status");

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers_created"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_items" ADD CONSTRAINT "production_order_items_offer_item_id_fkey" FOREIGN KEY ("offer_item_id") REFERENCES "offers_created_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
