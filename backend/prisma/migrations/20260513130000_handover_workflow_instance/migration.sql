ALTER TABLE "handovers" ADD COLUMN "workflow_instance_id" TEXT;
CREATE INDEX "idx_handovers_workflow_instance_id" ON "handovers"("workflow_instance_id");
