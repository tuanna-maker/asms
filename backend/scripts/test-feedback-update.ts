import { updateCustomerFeedbackService } from "../src/modules/customer-feedbacks/service";
import { prisma } from "../src/utils/prisma";

const id = "cmpccqtz3000g9d58h8qdfc2b";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@demo.local", deletedAt: null },
    select: { id: true, role: { select: { code: true } } },
  });
  if (!user?.role) throw new Error("no admin");

  const sales = await prisma.user.findFirst({
    where: { email: "sales@demo.local", deletedAt: null },
    select: { id: true },
  });

  const result = await updateCustomerFeedbackService(
    id,
    {
      title: "Chức năng",
      content: "hỏng hóc",
      assignee: { type: "user", userId: sales?.id ?? user.id, roleCode: null },
      feedbackAt: new Date("2026-05-19T05:00:00.000Z").toISOString(),
      contractId: null,
      linkageItems: [],
    },
    { userId: user.id, roleCode: user.role.code },
  );
  console.log("ok", result.id, result.assigneeType, result.canComment);
}

main()
  .catch((e) => {
    console.error("FAILED", e);
  })
  .finally(() => prisma.$disconnect());
