import { prisma } from "../src/utils/prisma";

const listSelect = {
  id: true,
  customerId: true,
  contractId: true,
  warrantyId: true,
  title: true,
  content: true,
  severity: true,
  assigneeType: true,
  assignedUserId: true,
  assignedRoleCode: true,
  status: true,
  source: true,
  intake: true,
  feedbackAt: true,
  slaDueAt: true,
  closedAt: true,
  createdById: true,
  closedById: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
  contract: { select: { id: true, code: true, title: true } },
  warranty: { select: { id: true, code: true, issue: true } },
  createdBy: { select: { id: true, fullName: true } },
  closedBy: { select: { id: true, fullName: true } },
  assignedUser: { select: { id: true, fullName: true } },
  linkageItems: true,
  assignments: {
    include: { unit: { select: { id: true, code: true, name: true } } },
  },
} as const;

const id = process.argv[2] ?? "cmpccqtz3000g9d58h8qdfc2b";

async function main() {
  const row = await prisma.customerFeedback.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...listSelect,
      timeline: {
        include: { actor: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  console.log("full select ok", row?.id, row?.timeline?.length);
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
  })
  .finally(() => prisma.$disconnect());
