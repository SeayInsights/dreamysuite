-- Guest management: extend guest table with contact, tracking, and seating fields
ALTER TABLE guest ADD COLUMN "address" TEXT DEFAULT NULL;
ALTER TABLE guest ADD COLUMN "phone" TEXT DEFAULT NULL;
-- "email" is added earlier by 0022_guest_email.sql; adding it again here made a
-- fresh `migrations apply` fail on a duplicate column. Removed to keep the chain
-- idempotent (prod already applied 0038, so its history is unaffected).
ALTER TABLE guest ADD COLUMN "invitedBy" TEXT DEFAULT NULL;
ALTER TABLE guest ADD COLUMN "category" TEXT DEFAULT NULL;
ALTER TABLE guest ADD COLUMN "invited" INTEGER DEFAULT 0;
ALTER TABLE guest ADD COLUMN "ceremonyOrReception" TEXT DEFAULT 'both';
ALTER TABLE guest ADD COLUMN "invitationType" TEXT DEFAULT 'digital';
ALTER TABLE guest ADD COLUMN "tableNumber" TEXT DEFAULT NULL;
ALTER TABLE guest ADD COLUMN "giftDescription" TEXT DEFAULT NULL;
ALTER TABLE guest ADD COLUMN "thankYouSent" INTEGER DEFAULT 0;
ALTER TABLE guest ADD COLUMN "customResponses" TEXT DEFAULT NULL;

-- Guest management: add guestCategories to site settings
ALTER TABLE site_setting ADD COLUMN "guestCategories" TEXT DEFAULT NULL;
