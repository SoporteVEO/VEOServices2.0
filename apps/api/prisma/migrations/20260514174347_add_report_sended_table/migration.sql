-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MONTHLY', 'INSTALLATION', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "report_sended" (
    "id" TEXT NOT NULL,
    "team_member_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportType" "ReportType" NOT NULL DEFAULT 'MONTHLY',
    "contract_number" TEXT NOT NULL,
    "staticBillboardCodeId" TEXT,
    "sent_to_email" TEXT,

    CONSTRAINT "report_sended_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- AddForeignKey
ALTER TABLE "report_sended" ADD CONSTRAINT "report_sended_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sended" ADD CONSTRAINT "report_sended_staticBillboardCodeId_fkey" FOREIGN KEY ("staticBillboardCodeId") REFERENCES "static_billboard_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
