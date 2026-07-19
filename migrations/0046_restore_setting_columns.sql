-- Restore site_setting columns dropped by the 0040 rebuild.
-- 0040 recreated site_setting as a slim universal table (site_setting_new) but
-- omitted 7 columns that remain in SettingsSchema/ALLOWED_FIELDS
-- (src/lib/schemas/settings.ts). Because upsertSiteSettings INSERTs every
-- ALLOWED_FIELDS column, new-site settings creation failed with
-- "no such column", and PUT of any of these fields 500'd.
-- Re-add them with their original definitions (from 0037/0038/0039).
ALTER TABLE site_setting ADD COLUMN "effectBleed" INTEGER DEFAULT 1;
ALTER TABLE site_setting ADD COLUMN "venueName" TEXT;
ALTER TABLE site_setting ADD COLUMN "venuePlaceId" TEXT;
ALTER TABLE site_setting ADD COLUMN "venueCoordinates" TEXT;
ALTER TABLE site_setting ADD COLUMN "venueHotels" TEXT;
ALTER TABLE site_setting ADD COLUMN "venueNote" TEXT;
ALTER TABLE site_setting ADD COLUMN "guestCategories" TEXT DEFAULT NULL;
