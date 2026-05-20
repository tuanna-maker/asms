-- Phân loại khóa: đào tạo (training) vs huấn luyện (coaching) — mỗi loại một quy trình riêng
ALTER TABLE "training_courses" ADD COLUMN "course_kind" TEXT NOT NULL DEFAULT 'training';

CREATE INDEX "idx_training_courses_course_kind" ON "training_courses"("course_kind");

-- Khóa gắn HĐ (tab Huấn luyện / bàn giao) → huấn luyện
UPDATE "training_courses"
SET "course_kind" = 'coaching'
WHERE "contract_id" IS NOT NULL AND "deleted_at" IS NULL;

-- Instance quy trình cũ gắn module training → coaching cho khóa HL
UPDATE "workflow_instances" wi
SET "module_key" = 'coaching'
FROM "training_courses" tc
WHERE wi."entity_id" = tc."id"
  AND wi."module_key" = 'training'
  AND tc."course_kind" = 'coaching';
