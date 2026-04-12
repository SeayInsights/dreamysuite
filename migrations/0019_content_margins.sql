-- Per-site content margins (applies to tiles/content only, not nav)
ALTER TABLE site_setting ADD COLUMN marginTop INTEGER;
ALTER TABLE site_setting ADD COLUMN marginRight INTEGER;
ALTER TABLE site_setting ADD COLUMN marginBottom INTEGER;
ALTER TABLE site_setting ADD COLUMN marginLeft INTEGER;
