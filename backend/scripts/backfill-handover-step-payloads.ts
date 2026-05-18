/**
 * Backfill handover_step_payloads từ cột phẳng trên handovers.
 * Chạy: pnpm --dir backend exec tsx scripts/backfill-handover-step-payloads.ts
 */
import { prisma } from "../src/utils/prisma";
import {
  flatRowToStepPayloadsByIndex,
  getOrderedStepIdsForHandover,
  upsertStepPayloads,
} from "../src/modules/handovers/step-payload";

async function main() {
  const rows = await prisma.handover.findMany({
    where: { deletedAt: null, workflowInstanceId: { not: null } },
    select: {
      id: true,
      handoverPlan: true,
      costReportNote: true,
      goodsCheckNote: true,
      trainingPlanNote: true,
      trainingCostReport: true,
      trainingReportNote: true,
      trainingDecision: true,
      tempHandoverNote: true,
      finalHandoverNote: true,
    },
  });

  let ok = 0;
  let skip = 0;
  for (const row of rows) {
    const stepIds = await getOrderedStepIdsForHandover(row.id);
    if (stepIds.length === 0) {
      skip++;
      continue;
    }
    const map = flatRowToStepPayloadsByIndex(row, stepIds);
    await upsertStepPayloads(row.id, map);
    ok++;
  }
  // eslint-disable-next-line no-console
  console.log(`Backfill handover step payloads: ${ok} updated, ${skip} skipped.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
