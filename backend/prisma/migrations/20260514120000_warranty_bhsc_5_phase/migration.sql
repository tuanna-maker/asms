-- BH/SC: enum + cột nghiệp vụ 5 giai đoạn + documents.warranty_id
-- Workflow WF_WARRANTY_DEFAULT: thay 3 bước bằng 5 bước; instance đang chạy gắn lại bước 1 (current_step_id + workflow_step trên phiếu).

CREATE TYPE "WarrantyReceiptCategory" AS ENUM ('incident', 'technical_support');
CREATE TYPE "WarrantyRootCause" AS ENUM ('manufacturer', 'customer', 'unknown');
CREATE TYPE "WarrantyExecutionMode" AS ENUM ('self', 'outsource');

ALTER TABLE "warranties"
    ADD COLUMN "receipt_category" "WarrantyReceiptCategory",
    ADD COLUMN "occurred_at" TIMESTAMP(3),
    ADD COLUMN "product_serial_snapshot" TEXT,
    ADD COLUMN "root_cause" "WarrantyRootCause",
    ADD COLUMN "handling_plan" TEXT,
    ADD COLUMN "planned_hours" INTEGER,
    ADD COLUMN "cost_estimate" DECIMAL(18,2),
    ADD COLUMN "customer_disagreed_close" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "execution_mode" "WarrantyExecutionMode",
    ADD COLUMN "outsource_partner" TEXT,
    ADD COLUMN "outsource_budget" DECIMAL(18,2),
    ADD COLUMN "outsource_timeline" TEXT,
    ADD COLUMN "repair_details" TEXT,
    ADD COLUMN "post_repair_assessment" TEXT,
    ADD COLUMN "handover_notes" TEXT;

ALTER TABLE "documents"
    ADD COLUMN "warranty_id" TEXT;

CREATE INDEX "idx_documents_warranty_id" ON "documents"("warranty_id");

ALTER TABLE "documents"
    ADD CONSTRAINT "documents_warranty_id_fkey"
        FOREIGN KEY ("warranty_id") REFERENCES "warranties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Chuẩn hóa workflow_step 1–5 (UI cũ có thể có bước 6)
UPDATE "warranties"
SET "workflow_step" = 5
WHERE "workflow_step" > 5;

-- Thay bước định nghĩa BH mặc định (instance cũ: current_step_id → NULL theo FK, sau đó gắn lại bước đầu)
DELETE FROM "workflow_steps"
WHERE "workflow_id" = (SELECT "id" FROM "workflow_definitions" WHERE "code" = 'WF_WARRANTY_DEFAULT' LIMIT 1);

INSERT INTO "workflow_steps" (
    "id",
    "workflow_id",
    "order",
    "name",
    "action_code",
    "role_code",
    "sla_hours",
    "description",
    "phase_code",
    "require_document",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    d."id",
    v."ord",
    v."nm",
    v."ac",
    v."rc",
    v."sla",
    NULL,
    'warranty',
    v."req_doc",
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM "workflow_definitions" d
CROSS JOIN (
    VALUES
        (10, 'Tiếp nhận yêu cầu', 'submit', 'technician', 8, false),
        (20, 'Phân tích, đề xuất PA và KH BHSC', 'approve', 'technician', 48, true),
        (30, 'Thực hiện BHSC', 'approve', 'technician', 72, true),
        (40, 'Kiểm tra sau BHSC', 'approve', 'manager', 24, false),
        (50, 'Bàn giao SP cho KH', 'release', 'technician', 24, false)
) AS v("ord", "nm", "ac", "rc", "sla", "req_doc")
WHERE d."code" = 'WF_WARRANTY_DEFAULT';

-- Gắn lại bước hiện tại cho instance warranty đang chạy trên WF này (sau khi xóa bước cũ, current_step_id có thể NULL)
UPDATE "workflow_instances" wi
SET
    "current_step_id" = fs."sid",
    "updated_at" = CURRENT_TIMESTAMP(3)
FROM (
    SELECT s."id" AS "sid"
    FROM "workflow_steps" s
    INNER JOIN "workflow_definitions" d ON d."id" = s."workflow_id" AND d."code" = 'WF_WARRANTY_DEFAULT'
    ORDER BY s."order" ASC
    LIMIT 1
) AS fs
WHERE wi."workflow_id" = (SELECT "id" FROM "workflow_definitions" WHERE "code" = 'WF_WARRANTY_DEFAULT' LIMIT 1)
  AND wi."status" = 'running'
  AND wi."module_key" = 'warranty';

UPDATE "warranties"
SET
    "workflow_step" = 1,
    "updated_at" = CURRENT_TIMESTAMP(3)
WHERE "workflow_instance_id" IN (
    SELECT wi."id"
    FROM "workflow_instances" wi
    WHERE wi."workflow_id" = (SELECT "id" FROM "workflow_definitions" WHERE "code" = 'WF_WARRANTY_DEFAULT' LIMIT 1)
      AND wi."status" = 'running'
      AND wi."module_key" = 'warranty'
);
