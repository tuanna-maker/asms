-- Add configurable product specs (JSON array)
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "specs" JSONB NOT NULL DEFAULT '[]';
