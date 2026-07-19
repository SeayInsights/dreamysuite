-- Effect system: preset + per-category effect selections
ALTER TABLE site_setting ADD COLUMN "effectPreset" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectBg" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectNav" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectText" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectCard" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectTransition" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectCursor" TEXT DEFAULT NULL;
ALTER TABLE site_setting ADD COLUMN "effectDecoration" TEXT DEFAULT NULL;
