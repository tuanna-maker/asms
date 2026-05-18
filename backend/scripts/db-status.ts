/**
 * Báo cáo nhanh số bản ghi trên các bảng chính (đã trừ soft-delete).
 *
 * Usage: `cd backend && npx tsx scripts/db-status.ts`
 */
import "dotenv/config";

import { prisma } from "../src/utils/prisma";

void (async () => {
  const isLive = { deletedAt: null } as const;

  const [users, customers, contracts, handovers, products, materials, transfers, warranties, training, definitions, documents] = await Promise.all([
    prisma.user.count({ where: isLive }),
    prisma.customer.count({ where: isLive }),
    prisma.contract.count({ where: isLive }),
    prisma.handover.count({ where: isLive }),
    prisma.product.count({ where: isLive }),
    prisma.material.count({ where: isLive }),
    prisma.materialTransfer.count({ where: isLive }),
    prisma.warranty.count({ where: isLive }),
    prisma.trainingCourse.count({ where: isLive }),
    prisma.dataDefinition.count({ where: isLive }),
    prisma.document.count({ where: isLive }),
  ]);

  const definitionsByCategory = await prisma.dataDefinition.groupBy({
    by: ["category"],
    _count: { _all: true },
    where: isLive,
    orderBy: { category: "asc" },
  });

  // eslint-disable-next-line no-console
  console.log("== Tổng số bản ghi (deletedAt = null) ==");
  // eslint-disable-next-line no-console
  console.table({
    users,
    customers,
    contracts,
    handovers,
    products,
    materials,
    materialTransfers: transfers,
    warranties,
    trainingCourses: training,
    documents,
    dataDefinitions: definitions,
  });

  // eslint-disable-next-line no-console
  console.log("== Định nghĩa theo nhóm ==");
  // eslint-disable-next-line no-console
  console.table(definitionsByCategory.map((row) => ({ category: row.category, count: row._count._all })));

  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
