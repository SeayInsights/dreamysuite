-- effectBleed: controls whether background effect bleeds to full page (1) or clips to content margins (0)
ALTER TABLE site_setting ADD COLUMN "effectBleed" INTEGER DEFAULT 1;
