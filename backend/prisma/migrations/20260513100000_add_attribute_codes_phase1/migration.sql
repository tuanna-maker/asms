-- Phase 2: add `*_code` columns mapped to DataDefinition categories, backfill from existing enums.

ALTER TABLE "warranties"
  ADD COLUMN "priority_code" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN "status_code"   TEXT NOT NULL DEFAULT 'open';

UPDATE "warranties" SET "priority_code" = "priority"::text;
UPDATE "warranties" SET "status_code"   = "status"::text;

CREATE INDEX "idx_warranties_status_priority_code" ON "warranties"("status_code", "priority_code");

ALTER TABLE "tasks"
  ADD COLUMN "priority_code" TEXT NOT NULL DEFAULT 'medium';

UPDATE "tasks" SET "priority_code" = "priority"::text;

CREATE INDEX "idx_tasks_priority_code" ON "tasks"("priority_code");

ALTER TABLE "research_projects"
  ADD COLUMN "stage_code" TEXT NOT NULL DEFAULT 'planning';

UPDATE "research_projects" SET "stage_code" = "status"::text;

CREATE INDEX "idx_research_projects_stage_code" ON "research_projects"("stage_code");

ALTER TABLE "training_courses"
  ADD COLUMN "type_code" TEXT NOT NULL DEFAULT 'internal';

UPDATE "training_courses" SET "type_code" = "type"::text;

CREATE INDEX "idx_training_courses_type_code" ON "training_courses"("type_code");

ALTER TABLE "documents"
  ADD COLUMN "category_code" TEXT NOT NULL DEFAULT 'other';

UPDATE "documents" SET "category_code" = "category"::text;

CREATE INDEX "idx_documents_category_code" ON "documents"("category_code");

ALTER TABLE "handovers"
  ADD COLUMN "type_code" TEXT;

CREATE INDEX "idx_handovers_type_code" ON "handovers"("type_code");

ALTER TABLE "customers"
  ADD COLUMN "source_code"       TEXT,
  ADD COLUMN "company_type_code" TEXT;

CREATE INDEX "idx_customers_source_code"       ON "customers"("source_code");
CREATE INDEX "idx_customers_company_type_code" ON "customers"("company_type_code");
