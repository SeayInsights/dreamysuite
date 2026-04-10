-- =========================================================
-- Seed: Dannis & Naomi site in DreamySuite database
-- =========================================================

INSERT INTO site (id, userId, name, slug, customDomain, eventType, previewColor, status, createdAt, updatedAt)
VALUES (
  'site-dannis-naomi',
  'YSPWEvHJ7qjiEnUwH9sxAeXFsEahczAo',
  'Dannis & Naomi',
  'dannis-naomi',
  'dannisnaomi.com',
  'wedding',
  '#E75850',
  'published',
  1744236000000,
  1744236000000
);

INSERT INTO site_setting (
  siteId, eventName, eventDate, eventLocation, greeting, musicUrl,
  mainLanguage, secondLanguage, guestPassword, isLive,
  headingFont, bodyFont, accentColor, bgColor,
  headingColor, bodyColor, siteTextColor, siteBorderColor,
  buttonStyle, buttonBorderWidth, headingFontVi, bodyFontVi,
  songPages, songResetPages,
  navBg, navPosition, navBrandColor, navLinkColor, navHighlightColor,
  updatedAt
) VALUES (
  'site-dannis-naomi',
  'Dannis & Naomi',
  '2027-01-17',
  '97XF+X6M, Phuoc Hai, Ho Chi Minh, Vietnam',
  NULL,
  'https://youtu.be/wzH3MHmIWvU?si=H-eyynxssoecMaEY',
  'en',
  'vi',
  NULL,
  1,
  '',
  '',
  '#ffffff',
  '#e75850',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  'transparent',
  'outline',
  '1.5px',
  'playfair',
  'playfair',
  '["home","story","travel","schedule","accommodations","registry","faq","rsvp"]',
  '["story"]',
  'transparent',
  'scroll-away',
  '#ffffff',
  '#ffffff',
  '#E75850',
  1744236000000
);

INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES
  ('page-dn-home',     'site-dannis-naomi', 'home',           'Home',          1, 0, 0, 1744236000000, 1744236000000),
  ('page-dn-rsvp',     'site-dannis-naomi', 'rsvp',           'RSVP',          0, 0, 1, 1744236000000, 1744236000000),
  ('page-dn-story',    'site-dannis-naomi', 'story',          'Story',         1, 0, 2, 1744236000000, 1744236000000),
  ('page-dn-accomm',   'site-dannis-naomi', 'accommodations', 'Where to Stay', 1, 0, 3, 1744236000000, 1744236000000),
  ('page-dn-travel',   'site-dannis-naomi', 'travel',         'Travel',        1, 0, 4, 1744236000000, 1744236000000),
  ('page-dn-schedule', 'site-dannis-naomi', 'schedule',       'Schedule',      1, 0, 5, 1744236000000, 1744236000000),
  ('page-dn-registry', 'site-dannis-naomi', 'registry',       'Registry',      1, 0, 6, 1744236000000, 1744236000000),
  ('page-dn-faq',      'site-dannis-naomi', 'faq',            'Q & A',         1, 0, 7, 1744236000000, 1744236000000);
