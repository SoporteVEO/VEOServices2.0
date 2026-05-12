-- AlterTable
ALTER TABLE "users" ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);
