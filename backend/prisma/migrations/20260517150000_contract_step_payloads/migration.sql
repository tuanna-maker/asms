-- CreateTable
CREATE TABLE "contract_step_payloads" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "workflow_step_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_step_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_contract_step_payload" ON "contract_step_payloads"("contract_id", "workflow_step_id");

-- CreateIndex
CREATE INDEX "idx_contract_step_payloads_contract_id" ON "contract_step_payloads"("contract_id");

-- AddForeignKey
ALTER TABLE "contract_step_payloads" ADD CONSTRAINT "contract_step_payloads_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
