/*
  Warnings:

  - Added the required column `type` to the `s3_images` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "S3ImageType" AS ENUM ('STATIC_BILLBOARD_MONTHLY');

-- AlterTable
ALTER TABLE "s3_images" ADD COLUMN     "type" "S3ImageType" NOT NULL;
