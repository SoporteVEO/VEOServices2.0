-- CreateTable
CREATE TABLE "offers_created" (
    "id" TEXT NOT NULL,
    "offer_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_company" TEXT,
    "customer_email" TEXT,
    "customer_contact" TEXT,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "special_conditions" TEXT,
    "subtotal_impression" DOUBLE PRECISION NOT NULL,
    "iva_impression" DOUBLE PRECISION NOT NULL,
    "total_impression" DOUBLE PRECISION NOT NULL,
    "subtotal_rental" DOUBLE PRECISION NOT NULL,
    "iva_rental" DOUBLE PRECISION NOT NULL,
    "total_rental" DOUBLE PRECISION NOT NULL,
    "pdf_s3_key" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_created_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers_created_items" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "billboard_id" INTEGER,
    "billboard_code" TEXT,
    "address" TEXT,
    "city_name" TEXT,
    "department_name" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "impression_price" DOUBLE PRECISION NOT NULL,
    "rental_price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_created_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_created_offer_number_key" ON "offers_created"("offer_number");

-- CreateIndex
CREATE INDEX "offers_created_createdAt_idx" ON "offers_created"("createdAt");

-- CreateIndex
CREATE INDEX "offers_created_created_by_user_id_idx" ON "offers_created"("created_by_user_id");

-- CreateIndex
CREATE INDEX "offers_created_items_offer_id_idx" ON "offers_created_items"("offer_id");

-- AddForeignKey
ALTER TABLE "offers_created" ADD CONSTRAINT "offers_created_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_created_items" ADD CONSTRAINT "offers_created_items_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers_created"("id") ON DELETE CASCADE ON UPDATE CASCADE;
