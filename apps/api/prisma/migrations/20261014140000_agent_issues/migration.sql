-- CreateEnum
CREATE TYPE "AgentIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AgentIssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'DESARROLLADOR';

-- CreateTable
CREATE TABLE "agent_issues" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "AgentIssueStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "AgentIssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technical_details" TEXT NOT NULL,
    "user_request" TEXT NOT NULL,
    "steps_to_reproduce" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expected_behavior" TEXT,
    "diagnostics" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "thread_id" TEXT,
    "reporter_id" TEXT,
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_issues_number_key" ON "agent_issues"("number");

-- CreateIndex
CREATE INDEX "agent_issues_status_created_at_idx" ON "agent_issues"("status", "created_at");

-- AddForeignKey
ALTER TABLE "agent_issues" ADD CONSTRAINT "agent_issues_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_issues" ADD CONSTRAINT "agent_issues_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
