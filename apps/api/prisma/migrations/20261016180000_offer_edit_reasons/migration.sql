-- CreateEnum
CREATE TYPE "OfferEditReason" AS ENUM ('CLIENT_BUDGET', 'CAMPAIGN_SCOPE', 'AVAILABILITY', 'LOCATION', 'PRICE_NEGOTIATION', 'CAMPAIGN_DATES', 'CORRECTION', 'OTHER');

-- AlterTable
ALTER TABLE "offer_events"
    ADD COLUMN "edit_reason" "OfferEditReason",
    ADD COLUMN "edit_reason_note" TEXT,
    ADD COLUMN "billboards_before" INTEGER,
    ADD COLUMN "billboards_after" INTEGER,
    ADD COLUMN "amount_before" DOUBLE PRECISION,
    ADD COLUMN "amount_after" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "offer_events_edit_reason_createdAt_idx" ON "offer_events"("edit_reason", "createdAt");
