-- Background image layer order and site max-width
ALTER TABLE site_setting ADD COLUMN bgImageLayer TEXT DEFAULT 'behind';
ALTER TABLE site_setting ADD COLUMN bgImageOpacity REAL DEFAULT 1.0;
ALTER TABLE site_setting ADD COLUMN siteMaxWidth INTEGER;
