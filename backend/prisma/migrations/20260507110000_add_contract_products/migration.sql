-- CreateTable
CREATE TABLE "contract_products" (
  "id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "contract_products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contract_products"
ADD CONSTRAINT "contract_products_contract_id_fkey"
FOREIGN KEY ("contract_id") REFERENCES "contracts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_products"
ADD CONSTRAINT "contract_products_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "idx_contract_products_contract_id" ON "contract_products"("contract_id");

-- CreateIndex
CREATE INDEX "idx_contract_products_product_id" ON "contract_products"("product_id");

-- CreateIndex
CREATE INDEX "idx_contract_products_deleted_at" ON "contract_products"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_contract_products_contract_product_deleted"
ON "contract_products"("contract_id", "product_id", "deleted_at");
