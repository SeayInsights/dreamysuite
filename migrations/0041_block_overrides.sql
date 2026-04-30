-- Add overrides column to block table for per-breakpoint config (tablet/mobile)
ALTER TABLE block ADD COLUMN overrides TEXT;
