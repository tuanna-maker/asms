-- Bàn giao & HL — cột phẳng + bảng handover_step_payloads
ALTER TABLE "handovers"
    ADD COLUMN "handover_plan" TEXT,
    ADD COLUMN "cost_report_note" TEXT,
    ADD COLUMN "goods_check_note" TEXT,
    ADD COLUMN "training_plan_note" TEXT,
    ADD COLUMN "training_cost_report" TEXT,
    ADD COLUMN "training_report_note" TEXT,
    ADD COLUMN "training_decision" TEXT,
    ADD COLUMN "temp_handover_note" TEXT,
    ADD COLUMN "final_handover_note" TEXT;

CREATE TABLE "handover_step_payloads" (
    "id" TEXT NOT NULL,
    "handover_id" TEXT NOT NULL,
    "workflow_step_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_step_payloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_handover_step_payload" ON "handover_step_payloads"("handover_id", "workflow_step_id");
CREATE INDEX "idx_handover_step_payloads_handover_id" ON "handover_step_payloads"("handover_id");

ALTER TABLE "handover_step_payloads" ADD CONSTRAINT "handover_step_payloads_handover_id_fkey" FOREIGN KEY ("handover_id") REFERENCES "handovers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
