/*
  Warnings:

  - You are about to drop the column `used_vacations` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `vacations` on the `team_members` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `team_members` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'TEMPORAL', 'FREELANCE', 'PART_TIME', 'INTERNSHIP', 'PROFESSIONAL_SERVICES');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "used_vacations",
DROP COLUMN "vacations",
ADD COLUMN     "afp_entity" TEXT,
ADD COLUMN     "afp_number" TEXT,
ADD COLUMN     "bank_account" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "born_date" TIMESTAMP(3),
ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "direct_boss_id" TEXT,
ADD COLUMN     "dui" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "emergency_contact_relationship" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "inss" TEXT,
ADD COLUMN     "second_last_name" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "team_member_comments" (
    "id" TEXT NOT NULL,
    "team_member_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "show_to_user" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_direct_boss_id_fkey" FOREIGN KEY ("direct_boss_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member_comments" ADD CONSTRAINT "team_member_comments_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
