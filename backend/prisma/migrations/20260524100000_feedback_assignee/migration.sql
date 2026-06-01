-- Phân công phản ánh: người cụ thể hoặc vai trò (thay cho mức độ trên UI)
ALTER TABLE "customer_feedbacks" ADD COLUMN "assignee_type" TEXT;
ALTER TABLE "customer_feedbacks" ADD COLUMN "assigned_user_id" TEXT;
ALTER TABLE "customer_feedbacks" ADD COLUMN "assigned_role_code" TEXT;

ALTER TABLE "customer_feedbacks" ADD CONSTRAINT "customer_feedbacks_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_customer_feedbacks_assigned_user_id" ON "customer_feedbacks"("assigned_user_id");
CREATE INDEX "idx_customer_feedbacks_assigned_role_code" ON "customer_feedbacks"("assigned_role_code");
