-- CreateEnum
CREATE TYPE "SubRole" AS ENUM ('HR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sub_roles" "SubRole"[] DEFAULT ARRAY[]::"SubRole"[];
