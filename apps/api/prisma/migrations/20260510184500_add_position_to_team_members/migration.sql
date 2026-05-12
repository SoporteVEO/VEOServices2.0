-- AlterTable
ALTER TABLE "team_members" ADD COLUMN "position" TEXT NOT NULL DEFAULT '';

-- Drop the default once existing rows are backfilled with empty string.
ALTER TABLE "team_members" ALTER COLUMN "position" DROP DEFAULT;
