-- CreateEnum
CREATE TYPE "UserNotificationStatus" AS ENUM ('PENDING', 'VIEWED', 'DELETED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "UserNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_createdAt_idx" ON "notifications"("user_id", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
