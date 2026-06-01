import { listCustomerFeedbacksService } from "../src/modules/customer-feedbacks/service";
import { getFeedbackAssignmentSummaryService } from "../src/modules/customer-feedbacks/service";
import { prisma } from "../src/utils/prisma";

async function main() {
  const rows = await listCustomerFeedbacksService({});
  console.log("list ok", rows.length, rows[0]?.status);
  const summary = await getFeedbackAssignmentSummaryService("test", "admin");
  console.log("summary ok", summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
