-- CreateTable
CREATE TABLE "warranty_step_payloads" (
    "id" TEXT NOT NULL,
    "warranty_id" TEXT NOT NULL,
    "workflow_step_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_step_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_warranty_step_payload" ON "warranty_step_payloads"("warranty_id", "workflow_step_id");

-- CreateIndex
CREATE INDEX "idx_warranty_step_payloads_warranty_id" ON "warranty_step_payloads"("warranty_id");

-- AddForeignKey
ALTER TABLE "warranty_step_payloads" ADD CONSTRAINT "warranty_step_payloads_warranty_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "warranties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
