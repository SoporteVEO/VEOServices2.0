-- Expansión · Sitios: OpenStreetMap surroundings (road class, urban density)
-- captured when a planned site is placed or moved. Nullable, so existing rows
-- stay valid and get filled the next time their context is refreshed.

-- AlterTable
ALTER TABLE "expansion_sites" ADD COLUMN "location_context" JSONB;
