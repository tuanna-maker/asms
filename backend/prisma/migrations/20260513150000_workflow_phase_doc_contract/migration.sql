-- workflow_steps: phase + require document
ALTER TABLE "workflow_steps"
    ADD COLUMN "phase_code" TEXT NOT NULL DEFAULT 'other',
    ADD COLUMN "require_document" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "idx_workflow_steps_phase_code" ON "workflow_steps"("phase_code");

-- Suy diễn phase_code cho step hệ thống dựa trên moduleKey của workflow chứa nó.
UPDATE "workflow_steps" s
SET "phase_code" = w."module_key"
FROM "workflow_definitions" w
WHERE s."workflow_id" = w."id"
    AND w."module_key" IN ('handover', 'warranty', 'training');

-- workflow_instance_documents
CREATE TABLE "workflow_instance_documents" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "step_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_instance_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_workflow_instance_documents_instance_step" ON "workflow_instance_documents"("instance_id", "step_id");

ALTER TABLE "workflow_instance_documents"
    ADD CONSTRAINT "workflow_instance_documents_instance_id_fkey"
        FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_instance_documents_step_id_fkey"
        FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_instance_documents_uploaded_by_id_fkey"
        FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- contracts.workflow_id + workflow_instance_id
ALTER TABLE "contracts"
    ADD COLUMN "workflow_id" TEXT,
    ADD COLUMN "workflow_instance_id" TEXT;
CREATE INDEX "idx_contracts_workflow_id" ON "contracts"("workflow_id");
CREATE INDEX "idx_contracts_workflow_instance_id" ON "contracts"("workflow_instance_id");

ALTER TABLE "contracts"
    ADD CONSTRAINT "contracts_workflow_id_fkey"
        FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
