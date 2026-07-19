-- bgImageBleed: controls whether background image bleeds to full page (1) or clips to content margins (0)
ALTER TABLE site_setting ADD COLUMN "bgImageBleed" INTEGER DEFAULT 1;
