-- Background image zoom and position controls.
-- These columns back bgImageZoom, bgImagePositionX, and bgImagePositionY
-- in SettingsSchema/upsertSiteSettings.
ALTER TABLE site_setting ADD COLUMN "bgImageZoom" REAL DEFAULT 100;
ALTER TABLE site_setting ADD COLUMN "bgImagePositionX" REAL DEFAULT 50;
ALTER TABLE site_setting ADD COLUMN "bgImagePositionY" REAL DEFAULT 50;
