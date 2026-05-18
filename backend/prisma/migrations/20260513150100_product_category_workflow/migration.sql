CREATE TABLE "product_category_workflow_defaults" (
    "id" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_category_workflow_defaults_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_category_workflow_defaults_category_code_key" ON "product_category_workflow_defaults"("category_code");

ALTER TABLE "product_category_workflow_defaults"
    ADD CONSTRAINT "product_category_workflow_defaults_workflow_id_fkey"
        FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "product_category_workflow_defaults_updated_by_id_fkey"
        FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
