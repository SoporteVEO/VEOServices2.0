/*
  Warnings:

  - You are about to drop the column `billboardId` on the `s3_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "s3_images" DROP COLUMN "billboardId",
ADD COLUMN     "staticBillboardCodeId" TEXT;

-- CreateTable
CREATE TABLE "static_billboard_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "static_billboard_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "static_billboard_codes_code_key" ON "static_billboard_codes"("code");

-- AddForeignKey
ALTER TABLE "s3_images" ADD CONSTRAINT "s3_images_staticBillboardCodeId_fkey" FOREIGN KEY ("staticBillboardCodeId") REFERENCES "static_billboard_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
