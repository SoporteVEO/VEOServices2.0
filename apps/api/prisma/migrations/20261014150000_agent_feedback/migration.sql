-- CreateEnum
CREATE TYPE "AgentFeedbackRating" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "AgentFeedbackReason" AS ENUM ('WRONG_DATA', 'MISUNDERSTOOD', 'INCOMPLETE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgentFeedbackReview" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AgentLearningStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgentLearningSource" AS ENUM ('FEEDBACK', 'CONVERSATION', 'MANUAL');

-- CreateTable
CREATE TABLE "agent_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "rating" "AgentFeedbackRating" NOT NULL,
    "reason" "AgentFeedbackReason",
    "comment" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "tool_calls" JSONB NOT NULL,
    "model" TEXT,
    "review" "AgentFeedbackReview" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_learnings" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "example" TEXT,
    "status" "AgentLearningStatus" NOT NULL DEFAULT 'PENDING',
    "source" "AgentLearningSource" NOT NULL,
    "feedback_id" TEXT,
    "thread_id" TEXT,
    "proposed_by_id" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_learnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_feedback_review_created_at_idx" ON "agent_feedback"("review", "created_at");

-- CreateIndex
CREATE INDEX "agent_feedback_thread_id_idx" ON "agent_feedback"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_feedback_user_id_message_id_key" ON "agent_feedback"("user_id", "message_id");

-- CreateIndex
CREATE INDEX "agent_learnings_status_updated_at_idx" ON "agent_learnings"("status", "updated_at");

-- CreateIndex
CREATE INDEX "agent_learnings_proposed_by_id_status_idx" ON "agent_learnings"("proposed_by_id", "status");

-- AddForeignKey
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_learnings" ADD CONSTRAINT "agent_learnings_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "agent_feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_learnings" ADD CONSTRAINT "agent_learnings_proposed_by_id_fkey" FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_learnings" ADD CONSTRAINT "agent_learnings_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
