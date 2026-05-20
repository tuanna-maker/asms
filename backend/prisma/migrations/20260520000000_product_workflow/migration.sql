-- AlterTable: add workflow_instance_id to products
ALTER TABLE "products" ADD COLUMN "workflow_instance_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_products_workflow_instance_id" ON "products"("workflow_instance_id");

-- CreateTable
CREATE TABLE "product_step_payloads" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "workflow_step_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_step_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_product_step_payloads_product_id" ON "product_step_payloads"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_step_payload" ON "product_step_payloads"("product_id", "workflow_step_id");

-- AddForeignKey
ALTER TABLE "product_step_payloads" ADD CONSTRAINT "product_step_payloads_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
