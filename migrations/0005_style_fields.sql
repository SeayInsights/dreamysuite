ALTER TABLE site_setting ADD COLUMN "headingColor" TEXT;
ALTER TABLE site_setting ADD COLUMN "bodyColor" TEXT;
ALTER TABLE site_setting ADD COLUMN "siteTextColor" TEXT;
ALTER TABLE site_setting ADD COLUMN "siteBorderColor" TEXT;
ALTER TABLE site_setting ADD COLUMN "buttonStyle" TEXT DEFAULT 'filled';
ALTER TABLE site_setting ADD COLUMN "buttonBorderWidth" TEXT DEFAULT '1.5px';
ALTER TABLE site_setting ADD COLUMN "headingFontVi" TEXT;
ALTER TABLE site_setting ADD COLUMN "bodyFontVi" TEXT;
