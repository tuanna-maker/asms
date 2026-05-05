-- CreateEnum
CREATE TYPE "MaterialTransferType" AS ENUM ('contract', 'warranty', 'repair');

-- CreateEnum
CREATE TYPE "MaterialTransferStatus" AS ENUM ('pending', 'processing', 'completed');

-- CreateTable
CREATE TABLE "material_transfers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "from_warehouse" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "type" "MaterialTransferType" NOT NULL,
    "status" "MaterialTransferStatus" NOT NULL DEFAULT 'pending',
    "transfer_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "material_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_transfers_code_key" ON "material_transfers"("code");

-- CreateIndex
CREATE INDEX "idx_material_transfers_material_id" ON "material_transfers"("material_id");

-- CreateIndex
CREATE INDEX "idx_material_transfers_status" ON "material_transfers"("status");

-- CreateIndex
CREATE INDEX "idx_material_transfers_type" ON "material_transfers"("type");

-- CreateIndex
CREATE INDEX "idx_material_transfers_transfer_date" ON "material_transfers"("transfer_date");

-- CreateIndex
CREATE INDEX "idx_material_transfers_deleted_at" ON "material_transfers"("deleted_at");

-- AddForeignKey
ALTER TABLE "material_transfers" ADD CONSTRAINT "material_transfers_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
