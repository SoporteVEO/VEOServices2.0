-- Expansión module: planned billboard sites (with comments and documents),
-- the monthly operating cost per Brilo billboard face used for rentabilidad,
-- and the EXPANSION sub-role that grants access to it.

-- CreateEnum
CREATE TYPE "ExpansionSiteStatus" AS ENUM ('PROPOSED', 'EVALUATING', 'APPROVED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ExpansionSitePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'EXPANSION';

-- CreateTable
CREATE TABLE "expansion_sites" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExpansionSiteStatus" NOT NULL DEFAULT 'PROPOSED',
    "priority" "ExpansionSitePriority" NOT NULL DEFAULT 'MEDIUM',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "department_name" TEXT,
    "description" TEXT,
    "format_code" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "estimated_monthly_cost" DOUBLE PRECISION,
    "estimated_monthly_price" DOUBLE PRECISION,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expansion_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expansion_site_comments" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expansion_site_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expansion_site_documents" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expansion_site_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expansion_billboard_costs" (
    "billboard_id" INTEGER NOT NULL,
    "monthly_cost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "updated_by_user_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expansion_billboard_costs_pkey" PRIMARY KEY ("billboard_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expansion_sites_number_key" ON "expansion_sites"("number");

-- CreateIndex
CREATE INDEX "expansion_sites_status_idx" ON "expansion_sites"("status");

-- CreateIndex
CREATE INDEX "expansion_site_comments_site_id_created_at_idx" ON "expansion_site_comments"("site_id", "created_at");

-- CreateIndex
CREATE INDEX "expansion_site_documents_site_id_created_at_idx" ON "expansion_site_documents"("site_id", "created_at");

-- AddForeignKey
ALTER TABLE "expansion_sites" ADD CONSTRAINT "expansion_sites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_site_comments" ADD CONSTRAINT "expansion_site_comments_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "expansion_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_site_comments" ADD CONSTRAINT "expansion_site_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_site_documents" ADD CONSTRAINT "expansion_site_documents_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "expansion_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_site_documents" ADD CONSTRAINT "expansion_site_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_billboard_costs" ADD CONSTRAINT "expansion_billboard_costs_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
