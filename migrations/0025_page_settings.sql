ALTER TABLE site_setting ADD COLUMN sectionSpacing TEXT;
ALTER TABLE site_setting ADD COLUMN pageTemplate TEXT;
ALTER TABLE site_setting ADD COLUMN seoTitle TEXT;
ALTER TABLE site_setting ADD COLUMN seoDescription TEXT;
ALTER TABLE site_setting ADD COLUMN ogImage TEXT;
ALTER TABLE site_setting ADD COLUMN animationsDisabled INTEGER DEFAULT 0;
ALTER TABLE site_setting ADD COLUMN defaultAnimation TEXT;
