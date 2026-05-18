-- CreateEnum
CREATE TYPE "AnniversaryType" AS ENUM ('traditional_day', 'medal_day', 'leader_birthday', 'other');

-- AlterTable: add type column with default 'other'
ALTER TABLE "customer_anniversaries" ADD COLUMN "type" "AnniversaryType" NOT NULL DEFAULT 'other';
