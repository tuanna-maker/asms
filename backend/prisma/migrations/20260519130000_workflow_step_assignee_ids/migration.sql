-- AlterTable
ALTER TABLE "workflow_steps" ADD COLUMN "assignee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
