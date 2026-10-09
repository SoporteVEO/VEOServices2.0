-- CreateEnum
CREATE TYPE "FleetServiceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'OTHER');

-- CreateTable
CREATE TABLE "fleet_vehicles" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "notes" TEXT,
    "photo_s3_key" TEXT,
    "initial_mileage_km" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_maintenances" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "type" "FleetServiceType" NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "mileage_km" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "workshop" TEXT,
    "invoice_number" TEXT,
    "description" TEXT NOT NULL,
    "next_service_km" INTEGER,
    "next_service_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fleet_vehicles_plate_key" ON "fleet_vehicles"("plate");

-- CreateIndex
CREATE INDEX "fleet_vehicles_archived_idx" ON "fleet_vehicles"("archived");

-- CreateIndex
CREATE INDEX "fleet_maintenances_vehicle_id_performed_at_idx" ON "fleet_maintenances"("vehicle_id", "performed_at");

-- CreateIndex
CREATE INDEX "fleet_maintenances_performed_at_idx" ON "fleet_maintenances"("performed_at");

-- AddForeignKey
ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_maintenances" ADD CONSTRAINT "fleet_maintenances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "fleet_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_maintenances" ADD CONSTRAINT "fleet_maintenances_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
