-- Plantilla: "Cargo" and "Área / Gerencia" become HR-managed catalogs.
-- Existing free-text positions are copied into hr_positions (case-insensitive
-- duplicates collapse into one entry) and linked before the column is dropped.

-- CreateTable
CREATE TABLE "hr_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_departments_name_key" ON "hr_departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hr_positions_name_key" ON "hr_positions"("name");

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN "department_id" TEXT,
ADD COLUMN "position_id" TEXT;

-- Migrate existing positions into the catalog
INSERT INTO "hr_positions" ("id", "name", "updated_at")
SELECT gen_random_uuid()::text, MIN(TRIM("position")), CURRENT_TIMESTAMP
FROM "team_members"
WHERE TRIM(COALESCE("position", '')) <> ''
GROUP BY LOWER(TRIM("position"));

UPDATE "team_members" tm
SET "position_id" = p."id"
FROM "hr_positions" p
WHERE LOWER(TRIM(tm."position")) = LOWER(p."name");

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "position";

-- CreateIndex
CREATE INDEX "team_members_department_id_idx" ON "team_members"("department_id");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hr_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mentorías Keep / Stop / Start (VEO-TH-MAN-01 · VEO-FOR-03)

-- CreateEnum
CREATE TYPE "MentorshipStartOutcome" AS ENUM ('YES', 'PARTIAL', 'NO');

-- CreateTable
CREATE TABLE "mentorship_sessions" (
    "id" TEXT NOT NULL,
    "collaborator_id" TEXT NOT NULL,
    "mentor_id" TEXT,
    "session_number" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "collaborator_name" TEXT NOT NULL,
    "collaborator_position" TEXT,
    "collaborator_department" TEXT,
    "mentor_name" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "next_follow_up_date" DATE NOT NULL,
    "previous_session_id" TEXT,
    "previous_start_outcome" "MentorshipStartOutcome",
    "previous_start_evidence" TEXT,
    "keep_what" TEXT NOT NULL,
    "keep_how" TEXT NOT NULL,
    "keep_when" TEXT NOT NULL,
    "keep_indicator" TEXT NOT NULL,
    "stop_what" TEXT NOT NULL,
    "stop_how" TEXT NOT NULL,
    "stop_when" TEXT NOT NULL,
    "stop_indicator" TEXT NOT NULL,
    "start_what" TEXT NOT NULL,
    "start_how" TEXT NOT NULL,
    "start_when" TEXT NOT NULL,
    "start_indicator" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledgement_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_session_revisions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_session_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_notices" (
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_notices_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentorship_sessions_previous_session_id_key" ON "mentorship_sessions"("previous_session_id");

-- CreateIndex
CREATE INDEX "mentorship_sessions_quarter_idx" ON "mentorship_sessions"("quarter");

-- CreateIndex
CREATE INDEX "mentorship_sessions_mentor_id_idx" ON "mentorship_sessions"("mentor_id");

-- CreateIndex
CREATE INDEX "mentorship_sessions_next_follow_up_date_idx" ON "mentorship_sessions"("next_follow_up_date");

-- CreateIndex
CREATE UNIQUE INDEX "mentorship_sessions_collaborator_id_session_number_key" ON "mentorship_sessions"("collaborator_id", "session_number");

-- CreateIndex
CREATE UNIQUE INDEX "mentorship_sessions_collaborator_id_quarter_key" ON "mentorship_sessions"("collaborator_id", "quarter");

-- CreateIndex
CREATE INDEX "mentorship_session_revisions_session_id_created_at_idx" ON "mentorship_session_revisions"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_previous_session_id_fkey" FOREIGN KEY ("previous_session_id") REFERENCES "mentorship_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_session_revisions" ADD CONSTRAINT "mentorship_session_revisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "mentorship_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_session_revisions" ADD CONSTRAINT "mentorship_session_revisions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
