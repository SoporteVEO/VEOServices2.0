-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_images" (
    "id" TEXT NOT NULL,
    "absence_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absences_user_id_idx" ON "absences"("user_id");

-- CreateIndex
CREATE INDEX "absence_images_absence_id_idx" ON "absence_images"("absence_id");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_images" ADD CONSTRAINT "absence_images_absence_id_fkey" FOREIGN KEY ("absence_id") REFERENCES "absences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
