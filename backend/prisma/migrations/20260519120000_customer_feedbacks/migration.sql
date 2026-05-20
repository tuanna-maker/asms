-- CreateEnum
CREATE TYPE "CustomerFeedbackSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "CustomerFeedbackStatus" AS ENUM ('new', 'processing', 'resolved');

-- CreateTable
CREATE TABLE "customer_feedbacks" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "warranty_id" TEXT,
    "created_by_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "severity" "CustomerFeedbackSeverity" NOT NULL DEFAULT 'medium',
    "status" "CustomerFeedbackStatus" NOT NULL DEFAULT 'new',
    "feedback_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_customer_id" ON "customer_feedbacks"("customer_id");

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_contract_id" ON "customer_feedbacks"("contract_id");

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_warranty_id" ON "customer_feedbacks"("warranty_id");

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_feedback_at" ON "customer_feedbacks"("feedback_at");

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_status" ON "customer_feedbacks"("status");

-- CreateIndex
CREATE INDEX "idx_customer_feedbacks_deleted_at" ON "customer_feedbacks"("deleted_at");

-- AddForeignKey
ALTER TABLE "customer_feedbacks" ADD CONSTRAINT "customer_feedbacks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedbacks" ADD CONSTRAINT "customer_feedbacks_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedbacks" ADD CONSTRAINT "customer_feedbacks_warranty_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "warranties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedbacks" ADD CONSTRAINT "customer_feedbacks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
