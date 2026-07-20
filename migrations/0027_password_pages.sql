-- Per-page password protection: JSON array of page IDs, null = all pages gated
ALTER TABLE site_setting ADD COLUMN "passwordPages" TEXT DEFAULT NULL;
