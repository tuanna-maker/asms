/**
 * Nạp / đồng bộ quy trình hệ thống theo từng nhóm module
 * (handover, warranty, training, coaching, contract, product).
 *
 * Usage:
 *   cd backend && pnpm run seed:workflows
 */
import "dotenv/config";

import { seedWorkflows } from "../src/config/seed-workflows";
import { prisma } from "../src/utils/prisma";

void (async () => {
  await seedWorkflows();

  const rows = await prisma.workflowDefinition.groupBy({
    by: ["moduleKey"],
    where: { deletedAt: null, isActive: true },
    _count: { _all: true },
  });

  // eslint-disable-next-line no-console
  console.log("seed:workflows — hoàn tất. Số QT đang active theo nhóm:");
  for (const row of rows.sort((a, b) => a.moduleKey.localeCompare(b.moduleKey))) {
    // eslint-disable-next-line no-console
    console.log(`  ${row.moduleKey}: ${row._count._all}`);
  }

  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
