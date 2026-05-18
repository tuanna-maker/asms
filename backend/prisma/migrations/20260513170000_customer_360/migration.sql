ALTER TABLE "customers"
    ADD COLUMN "founded_at" TIMESTAMP(3),
    ADD COLUMN "revenue_total" DECIMAL(18,2),
    ADD COLUMN "expense_total" DECIMAL(18,2);

CREATE INDEX "idx_customers_founded_at" ON "customers"("founded_at");

CREATE TABLE "customer_anniversaries" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "occurs_at" TIMESTAMP(3) NOT NULL,
    "recurring_yearly" BOOLEAN NOT NULL DEFAULT true,
    "reminder_days" INTEGER NOT NULL DEFAULT 7,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_anniversaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_customer_anniversaries_customer_id" ON "customer_anniversaries"("customer_id");
CREATE INDEX "idx_customer_anniversaries_occurs_at" ON "customer_anniversaries"("occurs_at");

ALTER TABLE "customer_anniversaries"
    ADD CONSTRAINT "customer_anniversaries_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
