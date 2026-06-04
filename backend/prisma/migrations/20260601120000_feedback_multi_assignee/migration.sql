-- Phân công phản ánh: nhiều người dùng và nhiều vai trò
CREATE TABLE "customer_feedback_assignee_targets" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "target_key" TEXT NOT NULL,
    "user_id" TEXT,
    "role_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_feedback_assignee_targets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_feedback_assignee_target" ON "customer_feedback_assignee_targets"("feedback_id", "target_key");
CREATE INDEX "idx_feedback_assignee_targets_feedback_id" ON "customer_feedback_assignee_targets"("feedback_id");
CREATE INDEX "idx_feedback_assignee_targets_user_id" ON "customer_feedback_assignee_targets"("user_id");
CREATE INDEX "idx_feedback_assignee_targets_role_code" ON "customer_feedback_assignee_targets"("role_code");

ALTER TABLE "customer_feedback_assignee_targets" ADD CONSTRAINT "customer_feedback_assignee_targets_feedback_id_fkey"
  FOREIGN KEY ("feedback_id") REFERENCES "customer_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_feedback_assignee_targets" ADD CONSTRAINT "customer_feedback_assignee_targets_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill từ cột phân công đơn (legacy)
INSERT INTO "customer_feedback_assignee_targets" ("id", "feedback_id", "target_key", "user_id", "role_code", "created_at")
SELECT
  'cfat_' || substr(md5(random()::text || cf.id || cf.assigned_user_id), 1, 20),
  cf.id,
  'user:' || cf.assigned_user_id,
  cf.assigned_user_id,
  NULL,
  COALESCE(cf.updated_at, cf.created_at)
FROM "customer_feedbacks" cf
WHERE cf.assignee_type = 'user' AND cf.assigned_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "customer_feedback_assignee_targets" ("id", "feedback_id", "target_key", "user_id", "role_code", "created_at")
SELECT
  'cfat_' || substr(md5(random()::text || cf.id || cf.assigned_role_code), 1, 20),
  cf.id,
  'role:' || cf.assigned_role_code,
  NULL,
  cf.assigned_role_code,
  COALESCE(cf.updated_at, cf.created_at)
FROM "customer_feedbacks" cf
WHERE cf.assignee_type = 'role' AND cf.assigned_role_code IS NOT NULL
ON CONFLICT DO NOTHING;
