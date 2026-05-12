-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "business_email" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "vacations" INTEGER NOT NULL DEFAULT 0,
    "used_vacations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_user_id_key" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_business_email_key" ON "team_members"("business_email");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
