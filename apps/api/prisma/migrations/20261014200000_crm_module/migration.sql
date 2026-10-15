-- CreateEnum
CREATE TYPE "CrmStageKind" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmDealStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CrmDealSource" AS ENUM ('REFERRAL', 'WEBSITE', 'COLD_CALL', 'EVENT', 'SOCIAL_MEDIA', 'EXISTING_CLIENT', 'AGENCY', 'OFFER', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('NOTE', 'CALL', 'MEETING', 'EMAIL', 'WHATSAPP', 'TASK_COMPLETED', 'STAGE_CHANGED', 'DEAL_CREATED', 'DEAL_WON', 'DEAL_LOST', 'DEAL_REOPENED', 'OFFER_LINKED');

-- CreateEnum
CREATE TYPE "CrmTaskType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'FOLLOW_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CrmMessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "CrmMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "CrmConnectionProvider" AS ENUM ('GMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CrmConnectionStatus" AS ENUM ('ACTIVE', 'ERROR');

-- AlterEnum
ALTER TYPE "SubRole" ADD VALUE 'VENTAS';

-- CreateTable
CREATE TABLE "crm_pipelines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "kind" "CrmStageKind" NOT NULL DEFAULT 'OPEN',
    "rotting_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "client_id" TEXT,
    "contact_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expected_close_date" DATE,
    "status" "CrmDealStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CrmPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "CrmDealSource",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "lost_reason" TEXT,
    "won_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stage_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deal_offers" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "job_title" TEXT,
    "notes" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_minutes" INTEGER,
    "deal_id" TEXT,
    "client_id" TEXT,
    "contact_id" TEXT,
    "actor_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CrmTaskType" NOT NULL DEFAULT 'FOLLOW_UP',
    "priority" "CrmPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "assignee_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "deal_id" TEXT,
    "client_id" TEXT,
    "contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_messages" (
    "id" TEXT NOT NULL,
    "channel" "CrmChannel" NOT NULL,
    "direction" "CrmMessageDirection" NOT NULL,
    "status" "CrmMessageStatus" NOT NULL,
    "user_id" TEXT,
    "to_address" TEXT NOT NULL,
    "from_address" TEXT,
    "cc" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "body_html" TEXT,
    "external_id" TEXT,
    "thread_id" TEXT,
    "error" TEXT,
    "deal_id" TEXT,
    "client_id" TEXT,
    "contact_id" TEXT,
    "template_id" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_channel_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "CrmConnectionProvider" NOT NULL,
    "status" "CrmConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "account_label" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "external_account_id" TEXT,
    "metadata" JSONB,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_pipelines_archived_position_idx" ON "crm_pipelines"("archived", "position");

-- CreateIndex
CREATE INDEX "crm_stages_pipeline_id_position_idx" ON "crm_stages"("pipeline_id", "position");

-- CreateIndex
CREATE INDEX "crm_deals_pipeline_id_stage_id_position_idx" ON "crm_deals"("pipeline_id", "stage_id", "position");

-- CreateIndex
CREATE INDEX "crm_deals_owner_id_status_idx" ON "crm_deals"("owner_id", "status");

-- CreateIndex
CREATE INDEX "crm_deals_client_id_idx" ON "crm_deals"("client_id");

-- CreateIndex
CREATE INDEX "crm_deals_contact_id_idx" ON "crm_deals"("contact_id");

-- CreateIndex
CREATE INDEX "crm_deals_status_won_at_idx" ON "crm_deals"("status", "won_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_deal_offers_offer_id_key" ON "crm_deal_offers"("offer_id");

-- CreateIndex
CREATE INDEX "crm_deal_offers_deal_id_idx" ON "crm_deal_offers"("deal_id");

-- CreateIndex
CREATE INDEX "crm_contacts_client_id_idx" ON "crm_contacts"("client_id");

-- CreateIndex
CREATE INDEX "crm_contacts_email_idx" ON "crm_contacts"("email");

-- CreateIndex
CREATE INDEX "crm_contacts_whatsapp_idx" ON "crm_contacts"("whatsapp");

-- CreateIndex
CREATE INDEX "crm_activities_deal_id_occurred_at_idx" ON "crm_activities"("deal_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_activities_client_id_occurred_at_idx" ON "crm_activities"("client_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_activities_contact_id_occurred_at_idx" ON "crm_activities"("contact_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_activities_actor_id_occurred_at_idx" ON "crm_activities"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_activities_type_occurred_at_idx" ON "crm_activities"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_tasks_assignee_id_completed_at_due_at_idx" ON "crm_tasks"("assignee_id", "completed_at", "due_at");

-- CreateIndex
CREATE INDEX "crm_tasks_deal_id_idx" ON "crm_tasks"("deal_id");

-- CreateIndex
CREATE INDEX "crm_tasks_client_id_idx" ON "crm_tasks"("client_id");

-- CreateIndex
CREATE INDEX "crm_email_templates_owner_id_idx" ON "crm_email_templates"("owner_id");

-- CreateIndex
CREATE INDEX "crm_email_templates_is_shared_idx" ON "crm_email_templates"("is_shared");

-- CreateIndex
CREATE INDEX "crm_messages_deal_id_sent_at_idx" ON "crm_messages"("deal_id", "sent_at");

-- CreateIndex
CREATE INDEX "crm_messages_client_id_sent_at_idx" ON "crm_messages"("client_id", "sent_at");

-- CreateIndex
CREATE INDEX "crm_messages_contact_id_sent_at_idx" ON "crm_messages"("contact_id", "sent_at");

-- CreateIndex
CREATE INDEX "crm_messages_user_id_sent_at_idx" ON "crm_messages"("user_id", "sent_at");

-- CreateIndex
CREATE INDEX "crm_messages_thread_id_idx" ON "crm_messages"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_messages_channel_external_id_key" ON "crm_messages"("channel", "external_id");

-- CreateIndex
CREATE INDEX "crm_channel_connections_provider_external_account_id_idx" ON "crm_channel_connections"("provider", "external_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_channel_connections_user_id_provider_key" ON "crm_channel_connections"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_offers" ADD CONSTRAINT "crm_deal_offers_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_offers" ADD CONSTRAINT "crm_deal_offers_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers_created"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_email_templates" ADD CONSTRAINT "crm_email_templates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "crm_email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_channel_connections" ADD CONSTRAINT "crm_channel_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

