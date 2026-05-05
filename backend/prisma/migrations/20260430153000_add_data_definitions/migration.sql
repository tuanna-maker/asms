-- CreateTable
CREATE TABLE "data_definitions" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "data_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_data_definitions_category" ON "data_definitions"("category");

-- CreateIndex
CREATE INDEX "idx_data_definitions_category_code" ON "data_definitions"("category", "code");

-- CreateIndex
CREATE INDEX "idx_data_definitions_deleted_at" ON "data_definitions"("deleted_at");

-- Unique active definitions per category+code (soft-delete friendly)
CREATE UNIQUE INDEX "uniq_data_definitions_category_code_active"
ON "data_definitions"("category", "code")
WHERE "deleted_at" IS NULL;
