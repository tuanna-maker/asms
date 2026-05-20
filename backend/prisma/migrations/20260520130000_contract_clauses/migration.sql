-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "clause_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "contract_clauses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clause_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contract_clause_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_clause_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "clause_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contract_clause_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_clauses_code_key" ON "contract_clauses"("code");

-- CreateIndex
CREATE INDEX "idx_contract_clauses_deleted_at" ON "contract_clauses"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_contract_clauses_sort_order" ON "contract_clauses"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "contract_clause_groups_code_key" ON "contract_clause_groups"("code");

-- CreateIndex
CREATE INDEX "idx_contract_clause_groups_deleted_at" ON "contract_clause_groups"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_contract_clause_groups_sort_order" ON "contract_clause_groups"("sort_order");

-- CreateIndex
CREATE INDEX "idx_contract_clause_group_members_group_id" ON "contract_clause_group_members"("group_id");

-- CreateIndex
CREATE INDEX "idx_contract_clause_group_members_clause_id" ON "contract_clause_group_members"("clause_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_contract_clause_group_member" ON "contract_clause_group_members"("group_id", "clause_id");

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_groups" ADD CONSTRAINT "contract_clause_groups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_groups" ADD CONSTRAINT "contract_clause_groups_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_group_members" ADD CONSTRAINT "contract_clause_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "contract_clause_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_clause_group_members" ADD CONSTRAINT "contract_clause_group_members_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "contract_clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
