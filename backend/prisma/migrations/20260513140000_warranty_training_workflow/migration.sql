ALTER TABLE "warranties" ADD COLUMN "workflow_instance_id" TEXT;
CREATE INDEX "idx_warranties_workflow_instance_id" ON "warranties"("workflow_instance_id");

ALTER TABLE "training_courses" ADD COLUMN "workflow_instance_id" TEXT;
CREATE INDEX "idx_training_courses_workflow_instance_id" ON "training_courses"("workflow_instance_id");
