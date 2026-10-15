-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "href" TEXT;

-- CreateTable
CREATE TABLE "patch_notes" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patch_notes_version_key" ON "patch_notes"("version");

-- CreateIndex
CREATE INDEX "patch_notes_created_at_idx" ON "patch_notes"("created_at");

-- AddForeignKey
ALTER TABLE "patch_notes" ADD CONSTRAINT "patch_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed
INSERT INTO "patch_notes" ("id", "version", "title", "body", "updated_at")
VALUES (
    gen_random_uuid()::text,
    '1.0.0',
    'Actualizaciones y notificaciones con enlace',
    E'## Novedades\n\n- Nueva sección **Actualizaciones**: aquí encontrarás las notas de cada versión de VEO Services.\n- Las **notificaciones** ahora se pueden abrir con un clic y te llevan directo al módulo correspondiente.\n- Cada nueva actualización te llegará como notificación.',
    CURRENT_TIMESTAMP
);
