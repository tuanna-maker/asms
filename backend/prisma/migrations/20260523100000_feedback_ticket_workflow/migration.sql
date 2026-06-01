-- CustomerFeedbackStatus: migrate processing -> in_progress
CREATE TYPE "CustomerFeedbackSource" AS ENUM ('external', 'internal');

ALTER TYPE "CustomerFeedbackStatus" RENAME TO "CustomerFeedbackStatus_old";

CREATE TYPE "CustomerFeedbackStatus" AS ENUM (
  'new',
  'assigned',
  'in_progress',
  'pending_close',
  'resolved',
  'reopened'
);

ALTER TABLE "customer_feedbacks"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "customer_feedbacks"
  ALTER COLUMN "status" TYPE "CustomerFeedbackStatus"
  USING (
    CASE "status"::text
      WHEN 'processing' THEN 'in_progress'
      WHEN 'resolved' THEN 'resolved'
      WHEN 'new' THEN 'new'
      ELSE 'new'
    END
  )::"CustomerFeedbackStatus";

ALTER TABLE "customer_feedbacks"
  ALTER COLUMN "status" SET DEFAULT 'new';

DROP TYPE "CustomerFeedbackStatus_old";

CREATE TYPE "CustomerFeedbackAssignmentStatus" AS ENUM ('pending', 'in_progress', 'done');

CREATE TYPE "CustomerFeedbackTimelineEvent" AS ENUM (
  'created',
  'assigned',
  'unit_updated',
  'pending_close',
  'resolved',
  'reopened'
);

ALTER TABLE "customer_feedbacks"
  ADD COLUMN "source" "CustomerFeedbackSource" NOT NULL DEFAULT 'external',
  ADD COLUMN "intake" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "sla_due_at" TIMESTAMP(3),
  ADD COLUMN "closed_at" TIMESTAMP(3),
  ADD COLUMN "closed_by_id" TEXT;

CREATE INDEX "idx_customer_feedbacks_sla_due_at" ON "customer_feedbacks"("sla_due_at");

ALTER TABLE "customer_feedbacks"
  ADD CONSTRAINT "customer_feedbacks_closed_by_id_fkey"
  FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "feedback_execution_units" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notify_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "feedback_execution_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feedback_execution_units_code_key" ON "feedback_execution_units"("code");
CREATE INDEX "idx_feedback_execution_units_deleted_at" ON "feedback_execution_units"("deleted_at");

CREATE TABLE "feedback_product_routing_rules" (
  "id" TEXT NOT NULL,
  "unit_id" TEXT NOT NULL,
  "product_id" TEXT,
  "product_category" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "feedback_product_routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_feedback_routing_rules_unit_id" ON "feedback_product_routing_rules"("unit_id");
CREATE INDEX "idx_feedback_routing_rules_product_id" ON "feedback_product_routing_rules"("product_id");
CREATE INDEX "idx_feedback_routing_rules_deleted_at" ON "feedback_product_routing_rules"("deleted_at");

ALTER TABLE "feedback_product_routing_rules"
  ADD CONSTRAINT "feedback_product_routing_rules_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "feedback_execution_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "customer_feedback_assignments" (
  "id" TEXT NOT NULL,
  "feedback_id" TEXT NOT NULL,
  "unit_id" TEXT NOT NULL,
  "status" "CustomerFeedbackAssignmentStatus" NOT NULL DEFAULT 'pending',
  "response_note" TEXT,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_feedback_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_feedback_assignment_feedback_unit"
  ON "customer_feedback_assignments"("feedback_id", "unit_id");
CREATE INDEX "idx_feedback_assignments_feedback_id" ON "customer_feedback_assignments"("feedback_id");
CREATE INDEX "idx_feedback_assignments_unit_id" ON "customer_feedback_assignments"("unit_id");
CREATE INDEX "idx_feedback_assignments_status" ON "customer_feedback_assignments"("status");

ALTER TABLE "customer_feedback_assignments"
  ADD CONSTRAINT "customer_feedback_assignments_feedback_id_fkey"
  FOREIGN KEY ("feedback_id") REFERENCES "customer_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_feedback_assignments"
  ADD CONSTRAINT "customer_feedback_assignments_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "feedback_execution_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_feedback_assignments"
  ADD CONSTRAINT "customer_feedback_assignments_updated_by_id_fkey"
  FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "customer_feedback_timeline" (
  "id" TEXT NOT NULL,
  "feedback_id" TEXT NOT NULL,
  "event" "CustomerFeedbackTimelineEvent" NOT NULL,
  "message" TEXT,
  "actor_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_feedback_timeline_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_feedback_timeline_feedback_id" ON "customer_feedback_timeline"("feedback_id");
CREATE INDEX "idx_feedback_timeline_created_at" ON "customer_feedback_timeline"("created_at");

ALTER TABLE "customer_feedback_timeline"
  ADD CONSTRAINT "customer_feedback_timeline_feedback_id_fkey"
  FOREIGN KEY ("feedback_id") REFERENCES "customer_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_feedback_timeline"
  ADD CONSTRAINT "customer_feedback_timeline_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
