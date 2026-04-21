-- CreateTable
CREATE TABLE "s3_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "deleteUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedUserId" TEXT NOT NULL,

    CONSTRAINT "s3_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "s3_images" ADD CONSTRAINT "s3_images_uploadedUserId_fkey" FOREIGN KEY ("uploadedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
