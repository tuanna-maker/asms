-- Nội dung form theo bước quy trình cho khóa đào tạo / huấn luyện
CREATE TABLE "training_course_step_payloads" (
    "id" TEXT NOT NULL,
    "training_course_id" TEXT NOT NULL,
    "workflow_step_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_course_step_payloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_training_course_step_payload" ON "training_course_step_payloads"("training_course_id", "workflow_step_id");
CREATE INDEX "idx_training_course_step_payloads_course_id" ON "training_course_step_payloads"("training_course_id");

ALTER TABLE "training_course_step_payloads" ADD CONSTRAINT "training_course_step_payloads_training_course_id_fkey" FOREIGN KEY ("training_course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
