-- CreateTable
CREATE TABLE "anniversary_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "anniversary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anniversary_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_anniversary_sub_ann" ON "anniversary_subscriptions"("anniversary_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_anniversary_subscription" ON "anniversary_subscriptions"("user_id", "anniversary_id");

-- AddForeignKey
ALTER TABLE "anniversary_subscriptions" ADD CONSTRAINT "anniversary_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anniversary_subscriptions" ADD CONSTRAINT "anniversary_subscriptions_anniversary_id_fkey" FOREIGN KEY ("anniversary_id") REFERENCES "customer_anniversaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
