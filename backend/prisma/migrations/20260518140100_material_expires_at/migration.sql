-- PAKD tracking: expiry date on materials
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
