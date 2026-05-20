-- AlterTable: canAccess -> CRUD columns
ALTER TABLE "role_permissions" ADD COLUMN "can_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "role_permissions" ADD COLUMN "can_create" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "role_permissions" ADD COLUMN "can_update" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "role_permissions" ADD COLUMN "can_delete" BOOLEAN NOT NULL DEFAULT false;

UPDATE "role_permissions"
SET
  "can_read" = "can_access",
  "can_create" = "can_access",
  "can_update" = "can_access",
  "can_delete" = false
WHERE "can_access" = true;

ALTER TABLE "role_permissions" DROP COLUMN "can_access";
