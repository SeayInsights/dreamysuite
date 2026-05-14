-- Persist the editor background margin mode.
ALTER TABLE site_setting ADD COLUMN "bgImageBleed" INTEGER DEFAULT 1;
