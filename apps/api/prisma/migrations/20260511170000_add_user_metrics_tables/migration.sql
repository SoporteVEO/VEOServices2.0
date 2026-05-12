-- CreateTable
CREATE TABLE "user_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_tick_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_metrics_days" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "active_ms" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_metrics_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_metrics_user_id_key" ON "user_metrics"("user_id");

-- CreateIndex
CREATE INDEX "user_metrics_days_user_id_date_idx" ON "user_metrics_days"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_metrics_days_user_id_date_key" ON "user_metrics_days"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_metrics" ADD CONSTRAINT "user_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_metrics_days" ADD CONSTRAINT "user_metrics_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
