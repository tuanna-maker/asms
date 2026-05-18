-- AlterTable: add rank, department, birthday, notes to contacts
ALTER TABLE "contacts" ADD COLUMN "rank" TEXT;
ALTER TABLE "contacts" ADD COLUMN "department" TEXT;
ALTER TABLE "contacts" ADD COLUMN "birthday" DATE;
ALTER TABLE "contacts" ADD COLUMN "notes" TEXT;
