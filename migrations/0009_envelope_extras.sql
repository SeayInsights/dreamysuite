-- Add wax-seal initials and invitation-card background colour to site_setting
ALTER TABLE site_setting ADD COLUMN sealInitials TEXT;
ALTER TABLE site_setting ADD COLUMN cardColor TEXT;
