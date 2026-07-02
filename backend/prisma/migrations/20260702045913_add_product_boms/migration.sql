-- CreateTable
CREATE TABLE "product_boms" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "serial_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_boms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_product_boms_product_id" ON "product_boms"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_boms_material_id" ON "product_boms"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_boms_product_material" ON "product_boms"("product_id", "material_id");

-- AddForeignKey
ALTER TABLE "product_boms" ADD CONSTRAINT "product_boms_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_boms" ADD CONSTRAINT "product_boms_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
