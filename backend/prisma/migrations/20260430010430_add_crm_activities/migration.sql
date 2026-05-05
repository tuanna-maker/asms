-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('call', 'email', 'meeting', 'note');

-- CreateEnum
CREATE TYPE "CrmActivityStatus" AS ENUM ('scheduled', 'done');

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CrmActivityStatus" NOT NULL,
    "activity_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_crm_activities_customer_id" ON "crm_activities"("customer_id");

-- CreateIndex
CREATE INDEX "idx_crm_activities_activity_at" ON "crm_activities"("activity_at");

-- CreateIndex
CREATE INDEX "idx_crm_activities_status" ON "crm_activities"("status");

-- CreateIndex
CREATE INDEX "idx_crm_activities_deleted_at" ON "crm_activities"("deleted_at");

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
