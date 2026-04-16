-- Add invitation card photo and nav bar shape to site_setting
ALTER TABLE site_setting ADD COLUMN cardImage TEXT;
ALTER TABLE site_setting ADD COLUMN navShape TEXT;
