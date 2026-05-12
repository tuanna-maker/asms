-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "contract_type_code" TEXT;

-- CreateIndex
CREATE INDEX "idx_contracts_contract_type_code" ON "contracts"("contract_type_code");
