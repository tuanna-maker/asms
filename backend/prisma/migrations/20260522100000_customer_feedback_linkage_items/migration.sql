-- AlterTable
ALTER TABLE "customer_feedbacks" ADD COLUMN "linkage_items" JSONB NOT NULL DEFAULT '[]';
