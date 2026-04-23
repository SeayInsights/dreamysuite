-- Migration 0040: Multi-Type Foundation
-- Creates universal tables (contact, submission) and type-specific config (site_type_config, site_type_settings, template)
-- Recreates site_setting as slim universal table, migrates wedding-specific fields to JSON
-- Drops legacy tables (guest, guest_book_entry)

-- Step 1: Add site_type and template_id to site table
ALTER TABLE site ADD COLUMN site_type TEXT DEFAULT 'wedding';
ALTER TABLE site ADD COLUMN template_id TEXT;

-- Step 2: Create site_type_config table
CREATE TABLE site_type_config (
  site_type TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  feature_flags TEXT NOT NULL DEFAULT '{}',
  available_blocks TEXT NOT NULL DEFAULT '[]',
  default_theme TEXT DEFAULT '{}',
  created_at INTEGER DEFAULT (unixepoch())
);

-- Step 3: Create template table
CREATE TABLE template (
  id TEXT PRIMARY KEY,
  site_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_r2_key TEXT,
  default_pages TEXT NOT NULL DEFAULT '[]',
  default_theme TEXT DEFAULT '{}',
  default_settings TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_type) REFERENCES site_type_config(site_type)
);

-- Step 4: Create site_type_settings table (wedding-specific fields go here as JSON)
CREATE TABLE site_type_settings (
  site_id TEXT PRIMARY KEY,
  site_type TEXT NOT NULL,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE
);

-- Step 5: Create contact table (universal people table)
CREATE TABLE contact (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_type TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  metadata TEXT DEFAULT '{}',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE
);

-- Step 6: Create submission table (universal submissions/forms table)
CREATE TABLE submission (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  block_id TEXT,
  contact_id TEXT,
  submission_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data TEXT NOT NULL DEFAULT '{}',
  amount_cents INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE SET NULL
);

-- Step 7: Create indexes for contact table
CREATE INDEX idx_site_type ON site(site_type);
CREATE INDEX idx_template_type ON template(site_type, is_active);
CREATE INDEX idx_contact_site_type ON contact(site_id, contact_type);
CREATE INDEX idx_contact_email ON contact(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contact_status ON contact(site_id, status);

-- Step 8: Create indexes for submission table
CREATE INDEX idx_submission_site_type ON submission(site_id, submission_type);
CREATE INDEX idx_submission_contact ON submission(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_submission_status ON submission(site_id, status);
CREATE INDEX idx_submission_amount ON submission(site_id, amount_cents) WHERE amount_cents IS NOT NULL;

-- Step 9: Create new slim site_setting table with only universal columns
CREATE TABLE site_setting_new (
  siteId TEXT PRIMARY KEY,
  -- Fonts
  headingFont TEXT DEFAULT 'Georgia',
  bodyFont TEXT DEFAULT 'Inter',
  headingFontVi TEXT,
  bodyFontVi TEXT,
  -- Colors
  accentColor TEXT DEFAULT '#B8921A',
  bgColor TEXT DEFAULT '#ffffff',
  headingColor TEXT,
  bodyColor TEXT,
  siteTextColor TEXT,
  siteBorderColor TEXT,
  -- Nav colors
  navBg TEXT DEFAULT 'white',
  navBrandColor TEXT DEFAULT '#1C1917',
  navLinkColor TEXT DEFAULT '#6B6560',
  navHighlightColor TEXT DEFAULT '#B8921A',
  -- Language
  mainLanguage TEXT DEFAULT 'en',
  secondLanguage TEXT,
  siteLanguages TEXT,
  -- SEO
  seoTitle TEXT,
  seoDescription TEXT,
  ogImage TEXT,
  -- Nav config
  navPosition TEXT DEFAULT 'fixed',
  navShape TEXT,
  navMaterial TEXT,
  navLinkPadding TEXT,
  navUnderline TEXT DEFAULT 'on',
  navItemsConfig TEXT,
  showNavBrand INTEGER DEFAULT 1,
  -- Buttons
  buttonStyle TEXT DEFAULT 'filled',
  buttonBorderWidth TEXT DEFAULT '1.5px',
  musicBtnBg TEXT,
  musicBtnColor TEXT,
  -- Popup
  popupEnabled INTEGER DEFAULT 1,
  popupTitle TEXT,
  popupTicker INTEGER DEFAULT 0,
  popupAfterAnimation INTEGER DEFAULT 0,
  popupBundle INTEGER DEFAULT 0,
  -- Margins/layout
  marginTop TEXT,
  marginRight TEXT,
  marginBottom TEXT,
  marginLeft TEXT,
  siteMaxWidth TEXT,
  sectionSpacing TEXT,
  -- Background
  bgImage TEXT,
  bgImageLayer TEXT DEFAULT 'behind',
  bgImageOpacity REAL DEFAULT 1.0,
  pageBgDisabled INTEGER DEFAULT 0,
  -- Animation
  animation TEXT,
  defaultAnimation TEXT,
  defaultAnimDuration REAL,
  defaultAnimDelay REAL,
  defaultAnimTrigger TEXT,
  -- Effects
  effectPreset TEXT,
  effectBg TEXT,
  effectNav TEXT,
  effectNavStyle TEXT,
  effectText TEXT,
  effectCard TEXT,
  effectTransition TEXT,
  effectCursor TEXT,
  effectDecoration TEXT,
  effectColor1 TEXT,
  effectColor2 TEXT,
  effectColor3 TEXT,
  -- State
  isLive INTEGER DEFAULT 0,
  updatedAt INTEGER,
  -- Access
  guestPassword TEXT,
  passwordPages TEXT,
  -- Template
  pageTemplate TEXT,
  FOREIGN KEY (siteId) REFERENCES site(id) ON DELETE CASCADE
);

-- Step 10: Migrate universal columns from old site_setting to new (only columns that exist)
INSERT INTO site_setting_new (
  siteId, headingFont, bodyFont, headingFontVi, bodyFontVi,
  accentColor, bgColor, headingColor, bodyColor, siteTextColor, siteBorderColor,
  navBg, navBrandColor, navLinkColor, navHighlightColor,
  mainLanguage, secondLanguage, siteLanguages,
  seoTitle, seoDescription, ogImage,
  navPosition, navShape, navMaterial, navLinkPadding, navUnderline, navItemsConfig, showNavBrand,
  buttonStyle, buttonBorderWidth, musicBtnBg, musicBtnColor,
  popupEnabled, popupTitle, popupTicker, popupAfterAnimation, popupBundle,
  marginTop, marginRight, marginBottom, marginLeft, siteMaxWidth, sectionSpacing,
  bgImage, bgImageLayer, bgImageOpacity, pageBgDisabled,
  animation, defaultAnimation, defaultAnimDuration, defaultAnimDelay, defaultAnimTrigger,
  effectPreset, effectBg, effectNav, effectNavStyle, effectText, effectCard, effectTransition, effectCursor, effectDecoration,
  effectColor1, effectColor2, effectColor3,
  isLive, updatedAt, guestPassword, passwordPages, pageTemplate
)
SELECT
  siteId, headingFont, bodyFont, headingFontVi, bodyFontVi,
  accentColor, bgColor, headingColor, bodyColor, siteTextColor, siteBorderColor,
  navBg, navBrandColor, navLinkColor, navHighlightColor,
  mainLanguage, secondLanguage, siteLanguages,
  seoTitle, seoDescription, ogImage,
  navPosition, navShape, navMaterial, navLinkPadding, navUnderline, navItemsConfig, showNavBrand,
  buttonStyle, buttonBorderWidth, musicBtnBg, musicBtnColor,
  popupEnabled, popupTitle, popupTicker, popupAfterAnimation, popupBundle,
  marginTop, marginRight, marginBottom, marginLeft, siteMaxWidth, sectionSpacing,
  bgImage, bgImageLayer, bgImageOpacity, pageBgDisabled,
  animation, defaultAnimation, defaultAnimDuration, defaultAnimDelay, defaultAnimTrigger,
  effectPreset, effectBg, effectNav, effectNavStyle, effectText, effectCard, effectTransition, effectCursor, effectDecoration,
  effectColor1, effectColor2, effectColor3,
  isLive, updatedAt, guestPassword, passwordPages, pageTemplate
FROM site_setting;

-- Step 11: Extract wedding-specific columns and create site_type_settings JSON (only columns that exist)
INSERT INTO site_type_settings (site_id, site_type, settings, created_at, updated_at)
SELECT
  siteId,
  'wedding',
  json_object(
    'eventName', eventName,
    'eventDate', eventDate,
    'eventLocation', eventLocation,
    'greeting', greeting,
    'musicUrl', musicUrl,
    'songPages', songPages,
    'songResetPages', songResetPages,
    'sealInitials', sealInitials,
    'cardColor', cardColor,
    'cardImage', cardImage,
    'envelopeColor', envelopeColor
  ),
  unixepoch(),
  updatedAt
FROM site_setting;

-- Step 12: Drop old site_setting table
DROP TABLE site_setting;

-- Step 13: Rename new table to site_setting
ALTER TABLE site_setting_new RENAME TO site_setting;

-- Step 14: Drop legacy tables
DROP TABLE IF EXISTS guest;
DROP TABLE IF EXISTS guest_book_entry;

-- Step 15: Seed wedding site type config
INSERT INTO site_type_config (site_type, display_name, description, feature_flags, created_at)
VALUES (
  'wedding',
  'Wedding',
  'Beautiful wedding websites with RSVP and guest management',
  '{"rsvp": true, "guest_book": true, "registry": true, "photos": true}',
  unixepoch()
);
