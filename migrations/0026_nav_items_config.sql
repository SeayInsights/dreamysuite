-- Add navItemsConfig column for custom nav item ordering/visibility
ALTER TABLE site_setting ADD COLUMN "navItemsConfig" TEXT;
