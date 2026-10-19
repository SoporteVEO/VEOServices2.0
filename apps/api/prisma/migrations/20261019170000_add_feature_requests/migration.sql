-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeatureRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FeatureRequestEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'COMMENT', 'COLLABORATOR_ADDED', 'COLLABORATOR_REMOVED', 'SIGNED', 'PROBLEM_REPORTED', 'APPROVED');

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priority" "FeatureRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "requester_id" TEXT NOT NULL,
    "file_s3_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "completion_round" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_request_collaborators" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_request_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_request_signatures" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT,
    "round" INTEGER NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "image_s3_key" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_request_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_request_events" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" "FeatureRequestEventType" NOT NULL,
    "from_status" "FeatureRequestStatus",
    "to_status" "FeatureRequestStatus",
    "message" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_request_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_requests_number_key" ON "feature_requests"("number");

-- CreateIndex
CREATE INDEX "feature_requests_status_created_at_idx" ON "feature_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "feature_requests_requester_id_idx" ON "feature_requests"("requester_id");

-- CreateIndex
CREATE INDEX "feature_request_collaborators_user_id_idx" ON "feature_request_collaborators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_request_collaborators_request_id_user_id_key" ON "feature_request_collaborators"("request_id", "user_id");

-- CreateIndex
CREATE INDEX "feature_request_signatures_request_id_round_idx" ON "feature_request_signatures"("request_id", "round");

-- CreateIndex
CREATE UNIQUE INDEX "feature_request_signatures_request_id_user_id_round_key" ON "feature_request_signatures"("request_id", "user_id", "round");

-- CreateIndex
CREATE INDEX "feature_request_events_request_id_created_at_idx" ON "feature_request_events"("request_id", "created_at");

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_collaborators" ADD CONSTRAINT "feature_request_collaborators_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_collaborators" ADD CONSTRAINT "feature_request_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_collaborators" ADD CONSTRAINT "feature_request_collaborators_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_signatures" ADD CONSTRAINT "feature_request_signatures_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_signatures" ADD CONSTRAINT "feature_request_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_events" ADD CONSTRAINT "feature_request_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_events" ADD CONSTRAINT "feature_request_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
