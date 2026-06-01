-- CreateEnum
CREATE TYPE "CustomerFeedbackCommentKind" AS ENUM ('issue', 'fix', 'note');

-- CreateTable
CREATE TABLE "customer_feedback_comments" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "kind" "CustomerFeedbackCommentKind" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_feedback_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_feedback_comments_feedback_id" ON "customer_feedback_comments"("feedback_id");

-- CreateIndex
CREATE INDEX "idx_feedback_comments_created_at" ON "customer_feedback_comments"("created_at");

-- AddForeignKey
ALTER TABLE "customer_feedback_comments" ADD CONSTRAINT "customer_feedback_comments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "customer_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedback_comments" ADD CONSTRAINT "customer_feedback_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
