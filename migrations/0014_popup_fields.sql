-- Add popup customization fields and nav underline toggle
ALTER TABLE site_setting ADD COLUMN popupEnabled INTEGER DEFAULT 1;
ALTER TABLE site_setting ADD COLUMN popupTitle TEXT;
ALTER TABLE site_setting ADD COLUMN popupTicker INTEGER DEFAULT 0;
ALTER TABLE site_setting ADD COLUMN popupAfterAnimation INTEGER DEFAULT 0;
