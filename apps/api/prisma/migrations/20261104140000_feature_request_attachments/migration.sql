-- CreateTable
CREATE TABLE "feature_request_attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_request_attachments_request_id_idx" ON "feature_request_attachments"("request_id");

-- AddForeignKey
ALTER TABLE "feature_request_attachments" ADD CONSTRAINT "feature_request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
