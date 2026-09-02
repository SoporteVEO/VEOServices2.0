-- Reports can now be generated for past months, so the month a report covers
-- is no longer implied by when it was sent.

-- AlterTable
ALTER TABLE "report_sended" ADD COLUMN "period_start" TIMESTAMP(3);

-- Existing rows always covered the month they were sent in, resolved in the
-- business timezone so sends near midnight land in the right month.
UPDATE "report_sended"
SET "period_start" = date_trunc(
  'month',
  "createdAt" AT TIME ZONE 'America/El_Salvador'
) AT TIME ZONE 'America/El_Salvador'
WHERE "period_start" IS NULL;

ALTER TABLE "report_sended" ALTER COLUMN "period_start" SET NOT NULL;

-- CreateIndex
CREATE INDEX "report_sended_contract_number_reportType_period_start_idx" ON "report_sended"("contract_number", "reportType", "period_start");
