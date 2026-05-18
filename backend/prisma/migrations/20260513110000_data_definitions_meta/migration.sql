-- Phase 3: tag seeded DataDefinitions as system + track who created/updated.

ALTER TABLE "data_definitions"
  ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "created_by_id" TEXT,
  ADD COLUMN "updated_by_id" TEXT;

-- Backfill: tất cả category đã được seed bởi `seed-definitions.ts` đánh dấu là hệ thống.
UPDATE "data_definitions"
SET "is_system" = TRUE
WHERE "category" IN (
  'warehouse',
  'material_unit',
  'contract_type',
  'warranty_priority',
  'warranty_status',
  'task_priority',
  'training_type',
  'research_stage',
  'document_type',
  'handover_type',
  'customer_source',
  'company_type',
  'product_category'
);

ALTER TABLE "data_definitions"
  ADD CONSTRAINT "data_definitions_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "data_definitions_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
