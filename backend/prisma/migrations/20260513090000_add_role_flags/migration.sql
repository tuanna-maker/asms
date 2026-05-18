-- AlterTable
ALTER TABLE "roles" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "roles" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Backfill seed roles as system
UPDATE "roles" SET "is_system" = true WHERE "code" IN ('admin', 'manager', 'technician', 'viewer', 'sales');
